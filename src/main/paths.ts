import { is } from '@electron-toolkit/utils'
import { app, dialog } from 'electron'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmdirSync,
  statSync,
  writeFileSync
} from 'fs'
import path from 'path'

const APP_DIR_NAME = 'nostr-relay-tray'

/**
 * Everything that makes up the app's persistent state. These move as one unit: `app.db`
 * without `nostr.db` silently gives the user an empty relay, and `nostr.db` without
 * `app.db` silently resets every setting.
 */
const DATA_FILES = [
  'nostr.db',
  'nostr.db-wal',
  'nostr.db-shm',
  'nostr.db-journal',
  'app.db',
  'app.db-wal',
  'app.db-shm',
  'app.db-journal'
]

/**
 * The databases themselves. Their `-wal`/`-shm`/`-journal` sidecars are worthless on their
 * own, so it is the presence of these two that decides whether a directory holds a usable
 * copy of the user's data.
 */
const PRIMARY_DATA_FILES = ['nostr.db', 'app.db']

type TAppPaths = {
  userData: string
  /** `null` leaves Electron's default, which nests it inside `userData`. */
  sessionData: string | null
}

/**
 * Points the app at platform-appropriate directories and moves any existing data there.
 *
 * Must be called before `app.whenReady()` and while holding the single instance lock:
 * `sessionData` is only honoured before the ready event, and the lock is what guarantees
 * that no other copy of the app - including an older release, which takes its lock in
 * the legacy directory - has the databases open while they are being moved.
 */
export function initAppPaths() {
  const paths = resolveAppPaths()
  if (!paths) return

  // Has to be read first, since `setPath` is what changes the value it returns.
  const legacyUserData = app.getPath('userData')

  // Development runs get their own directories so `npm run dev` can never lock, schema
  // migrate or corrupt the real database. They never migrate either: the user's data
  // must not be dragged into a dev directory.
  if (!is.dev && !migrateLegacyData(legacyUserData, paths.userData)) return

  try {
    // `setPath` throws when the directory does not exist.
    mkdirSync(paths.userData, { recursive: true })
    if (paths.sessionData) {
      mkdirSync(paths.sessionData, { recursive: true })
    }
  } catch (error) {
    console.error('failed to create the new data directories, keeping the old ones', error)
    return
  }

  app.setPath('userData', paths.userData)
  if (paths.sessionData) {
    app.setPath('sessionData', paths.sessionData)
  }
}

/**
 * Electron defaults `userData` to `<appData>/<productName>`, which is `~/.config` on
 * Linux and the roaming `%APPDATA%` on Windows. Neither is an appropriate home for a
 * multi-gigabyte event database, so both get redirected. macOS already puts it in the
 * right place, so nothing is overridden there at all.
 */
function resolveAppPaths(): TAppPaths | null {
  if (process.platform === 'darwin') return null

  const dirName = is.dev ? `${APP_DIR_NAME}-dev` : APP_DIR_NAME

  if (process.platform === 'win32') {
    // %LOCALAPPDATA% is the documented home for large, machine local application data,
    // and unlike the roaming %APPDATA% it is never copied to a file server at logon.
    // Chromium's caches can stay nested inside it.
    const localAppData =
      absoluteEnv('LOCALAPPDATA') ?? path.join(app.getPath('home'), 'AppData', 'Local')
    return { userData: path.join(localAppData, dirName), sessionData: null }
  }

  return {
    userData: path.join(resolveDataHome(), dirName),
    sessionData: path.join(resolveCacheHome(), dirName)
  }
}

/**
 * `$XDG_CACHE_HOME`, which the snap launcher already points at `$SNAP_USER_COMMON` and so
 * needs no special case of its own.
 */
function resolveCacheHome(): string {
  return absoluteEnv('XDG_CACHE_HOME') ?? path.join(app.getPath('home'), '.cache')
}

/**
 * Under snap, `$SNAP_USER_COMMON` is the only writable location that is shared across
 * revisions. The launcher exports `XDG_DATA_HOME=$SNAP_USER_DATA/.local/share`, which is
 * revision scoped: snapd copies it into the new revision on every refresh and retains the
 * old ones, so a large database there would be duplicated on each update.
 *
 * Otherwise this mirrors the `XDG_CONFIG_HOME || ~/.config` logic Electron itself uses to
 * derive `appData`, including the spec's rule that relative values are ignored. Deriving
 * the fallback from `app.getPath('home')` rather than a literal keeps it correct under
 * confinement, where `HOME` is remapped into the snap's own tree.
 */
function resolveDataHome(): string {
  return (
    absoluteEnv('SNAP_USER_COMMON') ??
    absoluteEnv('XDG_DATA_HOME') ??
    path.join(app.getPath('home'), '.local', 'share')
  )
}

/** The XDG spec says a relative value must be ignored, and an empty one means unset. */
function absoluteEnv(name: string): string | null {
  const value = process.env[name]
  return value && path.isAbsolute(value) ? value : null
}

/**
 * Moves the databases out of the legacy directory. Returns whether the app can safely use
 * `to` from now on; when it returns false every database is still in `from` and the app
 * carries on from there exactly as it did before.
 *
 * The files are staged in a sibling of the destination and only then published, so the one
 * outcome that would look to the user like data loss - a directory that holds one database
 * but not the other - is either impossible or, where the filesystem forces the set to be
 * published file by file, undone before this returns. Nothing here ever deletes or
 * overwrites a database: where two copies of one exist and there is no way to tell which
 * the user has been using, both are left where they are.
 */
function migrateLegacyData(from: string, to: string): boolean {
  if (path.resolve(from) === path.resolve(to) || !existsSync(from)) return true

  const staging = `${to}.migrating`
  const inStaging = dataFilesIn(staging)
  const inLegacy = dataFilesIn(from)

  // Checked first and unconditionally. Anything at the destination is what the app has
  // been opening - a finished migration, or a fresh install that got here first - so a
  // `.migrating` directory left behind by an interrupted run must never be published
  // over it.
  if (dataFilesIn(to).length) return keepDestination(staging, to, inStaging)

  if (!inStaging.length && !inLegacy.length) return true

  // Every move below is a rename within one filesystem, which needs no free space and
  // cannot half-write a file. If the destination lives somewhere else, copying tens of
  // gigabytes during startup would look like a hang, so leave everything where it is.
  if (inLegacy.length && !isSameFilesystem(from, nearestExistingDir(path.dirname(to)))) {
    console.error(
      `cannot move app data to ${to}: it is on a different filesystem. Continuing to use ${from}`
    )
    return false
  }

  // One name in both directories means an earlier attempt was interrupted and the file
  // came back afterwards - an empty database the app recreated on a later start, or a
  // copy a restore put back. Nothing here can tell which of the two holds the user's
  // events, so the migration gives up instead of picking one, and both copies stay
  // exactly where they are.
  const duplicates = inStaging.filter((file) => inLegacy.includes(file))
  if (duplicates.length) {
    console.error(
      `cannot move app data to ${to}: ${duplicates.join(', ')} exist in both ${from} and ` +
        `${staging}. Continuing to use ${from}, leaving the staged copies untouched`
    )
    return continueFromLegacy(from, staging)
  }

  const moved: string[] = []
  try {
    mkdirSync(staging, { recursive: true })
    for (const file of inLegacy) {
      renameSync(path.join(from, file), path.join(staging, file))
      moved.push(file)
    }
  } catch (error) {
    console.error(`failed to move app data to ${to}, continuing to use ${from}`, error)
    // Nothing has been published yet, so putting these back restores the exact state the
    // app started in - provided they all make it back, which is what the check below is
    // for.
    moveBack(staging, from, moved)
    return continueFromLegacy(from, staging)
  }

  try {
    publish(staging, to)
  } catch (error) {
    console.error(`failed to move app data to ${to}, continuing to use ${from}`, error)
    moveBack(staging, from, dataFilesIn(staging))
    return continueFromLegacy(from, staging)
  }

  leaveBreadcrumb(from, to)
  console.log(`moved app data from ${from} to ${to}`)
  return true
}

/**
 * The destination already holds data, so that is what the app opens. A staging directory
 * beside it is either a leftover from a run that was killed after publishing, or the other
 * half of a publish that was killed part way through - and in that second case what it
 * still holds is precisely what the destination is missing.
 */
function keepDestination(staging: string, to: string, inStaging: string[]): boolean {
  const missing = inStaging.filter((file) => !existsSync(path.join(to, file)))

  try {
    for (const file of missing) {
      renameSync(path.join(staging, file), path.join(to, file))
    }
    removeIfEmpty(staging)
    return true
  } catch (error) {
    console.error(`failed to move the rest of the app data into ${to}`, error)
  }

  // Whatever is still in staging duplicates a file at the destination, so it is safe to
  // leave lying around - unless a database the app is about to open is one of the files
  // that did not make it.
  if (!missing.some(isPrimaryDataFile)) {
    console.warn(`leftover staged data in ${staging} could not be moved into ${to}`)
    return true
  }
  reportSplit(staging, to)
}

/**
 * Called once a migration has given up. Carrying on from the legacy directory is only safe
 * if the databases are all actually there; one still sitting in staging would be reopened
 * as an empty database, which to the user is indistinguishable from losing their events.
 */
function continueFromLegacy(from: string, staging: string): boolean {
  const stranded = PRIMARY_DATA_FILES.filter(
    (file) => existsSync(path.join(staging, file)) && !existsSync(path.join(from, file))
  )
  if (!stranded.length) return false

  reportSplit(staging, from)
}

/**
 * The databases are intact, but the directory the app is about to open is missing one of
 * them. Starting anyway would create an empty one and convince the user their events are
 * gone, so the app stops and says where everything is instead.
 */
function reportSplit(staging: string, using: string): never {
  dialog.showErrorBox(
    'nostr-relay-tray could not finish moving its data',
    [
      'Your databases are safe, but they could not all be moved into place.',
      '',
      `Some of them are in: ${staging}`,
      `The app needs them in: ${using}`,
      '',
      'Restarting will retry. If it keeps failing, move the files from the first',
      'folder into the second one manually.'
    ].join('\n')
  )
  app.exit(1)
  // `app.exit` never returns, but its signature cannot say so.
  throw new Error(`app data is split between ${staging} and ${using}`)
}

/** Publishes the staged set, atomically where the destination does not already exist. */
function publish(staging: string, to: string) {
  if (existsSync(to) && !readdirSync(to).length) {
    rmdirSync(to)
  }

  if (!existsSync(to)) {
    mkdirSync(path.dirname(to), { recursive: true })
    // One syscall makes the complete set visible.
    renameSync(staging, to)
    return
  }

  // The destination is already there - Electron creates it for its own state before any
  // of this runs - so the set has to go in a file at a time. Failing part way through is
  // what would split the databases across two directories, so anything already moved is
  // pulled back out before the failure is reported.
  const published: string[] = []
  try {
    for (const file of dataFilesIn(staging)) {
      renameSync(path.join(staging, file), path.join(to, file))
      published.push(file)
    }
  } catch (error) {
    moveBack(to, staging, published)
    throw error
  }
  removeIfEmpty(staging)
}

/**
 * Moves files back out of `from`. Never overwrites: a name that is already taken in `to`
 * is a second copy this code cannot choose between, and destroying one of them is the
 * whole failure it is here to avoid.
 */
function moveBack(from: string, to: string, files: string[]) {
  for (const file of files) {
    try {
      if (existsSync(path.join(to, file))) {
        console.error(`not moving ${file} back to ${to}: a file of that name is already there`)
        continue
      }
      renameSync(path.join(from, file), path.join(to, file))
    } catch (error) {
      console.error(`failed to move ${file} back to ${to}`, error)
    }
  }
  removeIfEmpty(from)
}

/**
 * The legacy directory is deliberately left in place. It still holds the single instance
 * lock, which is taken there on purpose, and the rest is regenerable Chromium state that
 * the user can delete at their leisure.
 */
function leaveBreadcrumb(from: string, to: string) {
  try {
    writeFileSync(
      path.join(from, 'DATA-MOVED.txt'),
      [
        'nostr-relay-tray now keeps its databases somewhere more appropriate.',
        '',
        `New location: ${to}`,
        '',
        'What is left here is regenerable browser state (caches, cookies, local storage)',
        'plus the Singleton* lock files, which are still created here so that older',
        'releases of the app cannot run at the same time as this one.',
        'Everything except the Singleton* files is safe to delete.'
      ].join('\n')
    )
  } catch (error) {
    console.warn(`failed to write the breadcrumb file in ${from}`, error)
  }
}

function isPrimaryDataFile(file: string) {
  return PRIMARY_DATA_FILES.includes(file)
}

function dataFilesIn(dir: string) {
  if (!existsSync(dir)) return []
  return DATA_FILES.filter((file) => existsSync(path.join(dir, file)))
}

function isSameFilesystem(a: string, b: string) {
  try {
    return statSync(a).dev === statSync(b).dev
  } catch {
    return false
  }
}

function nearestExistingDir(dir: string) {
  let current = dir
  while (!existsSync(current)) {
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return current
}

function removeIfEmpty(dir: string) {
  try {
    if (existsSync(dir) && !readdirSync(dir).length) rmdirSync(dir)
  } catch {
    // An empty directory left behind is harmless.
  }
}
