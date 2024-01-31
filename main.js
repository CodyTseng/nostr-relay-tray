const { NostrRelay } = require("@nostr-relay/core");
const {
  EventRepositorySqlite,
} = require("@nostr-relay/event-repository-sqlite");
const { Validator } = require("@nostr-relay/validator");
const {
  app,
  nativeImage,
  Tray,
  Menu,
  dialog,
  Notification,
} = require("electron");
const { WebSocketServer } = require("ws");
const path = require("path");
const { networkInterfaces } = require("os");
const fs = require("fs");
const readline = require("readline");

let tray;
let eventRepository;
let relay;
let validator;

// Don't show the app in the dock (macOS)
app.dock?.hide();

app.whenReady().then(() => {
  createTray();
  createServer();
});

const createTray = () => {
  const assetsDirectory = path.join(__dirname, "assets");
  tray = new Tray(
    nativeImage.createFromPath(path.join(assetsDirectory, "nostrTemplate.png"))
  );
  let currentLocalIpAddress = getLocalIpAddress();

  tray.setContextMenu(createMenu(currentLocalIpAddress));

  setInterval(() => {
    const newLocalIpAddress = getLocalIpAddress();
    if (newLocalIpAddress !== currentLocalIpAddress) {
      currentLocalIpAddress = newLocalIpAddress;
      tray.setContextMenu(createMenu(currentLocalIpAddress));
    }
  }, 10000);
};

const createMenu = (localIpAddress) => {
  return Menu.buildFromTemplate([
    {
      label: "About",
      type: "normal",
      click: () => {
        dialog.showMessageBox({
          type: "info",
          message: "Your Nostr Relay is running!",
          detail: `Powed by nostr-relay (https://github.com/CodyTseng/nostr-relay)`,
        });
      },
    },
    { type: "separator" },
    {
      label: "Export",
      type: "normal",
      click: exportEvents,
    },
    {
      label: "Import",
      type: "normal",
      click: importEvents,
    },
    { type: "separator" },
    {
      label: `ws://localhost:4869`,
      type: "normal",
      enabled: false,
    },
    {
      label: `ws://${localIpAddress}:4869`,
      type: "normal",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Quit",
      role: "quit",
    },
  ]);
};

const createServer = () => {
  const userPath = app.getPath("userData");

  const wss = new WebSocketServer({ port: 4869 });
  eventRepository = new EventRepositorySqlite(path.join(userPath, "nostr.db"));
  relay = new NostrRelay(eventRepository);
  validator = new Validator();

  wss.on("connection", (ws) => {
    relay.handleConnection(ws);

    ws.on("message", async (data) => {
      const message = await validator.validateIncomingMessage(data);
      await relay.handleMessage(ws, message);
    });

    ws.on("close", () => {
      relay.handleDisconnect(ws);
    });
  });
};

const getLocalIpAddress = () => {
  const interfaces = networkInterfaces();

  for (const key in interfaces) {
    const iface = interfaces[key];
    if (!iface) continue;

    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }

  return undefined;
};

const exportEvents = async () => {
  // Show save dialog
  const { filePath } = await dialog.showSaveDialog({
    title: "Export Events",
    filters: [{ name: "jsonl", extensions: ["jsonl"] }],
    defaultPath: "events.jsonl",
  });

  // If the user doesn't cancel the dialog
  if (filePath) {
    const stream = fs.createWriteStream(filePath);
    const db = eventRepository.getDatabase();
    const stmt = db.prepare("SELECT * FROM events ORDER BY created_at DESC");

    let count = 0;
    for (const row of stmt.iterate()) {
      stream.write(
        JSON.stringify({
          id: row.id,
          kind: row.kind,
          pubkey: row.pubkey,
          content: row.content,
          sig: row.sig,
          created_at: row.created_at,
          tags: JSON.parse(row.tags),
        }) + "\n"
      );
      count++;
      tray.setTitle(`${count}`);
    }

    stream.end();

    setTimeout(() => {
      tray.setTitle("");
      new Notification({
        title: "Export Complete",
        body: `Total events exported: ${count}.`,
      }).show();
    }, 1000);
  }
};

const importEvents = async () => {
  // Show open dialog
  const { filePaths } = await dialog.showOpenDialog({
    title: "Import Data",
    filters: [{ name: "jsonl", extensions: ["jsonl"] }],
    properties: ["openFile"],
  });

  // If the user doesn't cancel the dialog
  if (filePaths.length > 0) {
    const readStream = fs.createReadStream(filePaths[0]);
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });
    let count = 0,
      errorCount = 0,
      newEventCount = 0;

    rl.on("line", async (line) => {
      tray.setTitle(`${++count}`);
      try {
        const event = await validator.validateEvent(JSON.parse(line));
        const { isDuplicate } = await eventRepository.upsert(event);
        if (!isDuplicate) newEventCount++;
      } catch {
        errorCount++;
      }
    });

    rl.on("close", () => {
      setTimeout(() => {
        tray.setTitle("");
        new Notification({
          title: "Import Complete",
          body: `Total: ${count}, New: ${newEventCount}, Error: ${errorCount}.`,
        }).show();
      }, 1000);
    });
  }
};
