const {
  NostrRelay,
  createOutgoingNoticeMessage,
} = require("@nostr-relay/core");
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
  clipboard,
  showDialog,
} = require("electron");
const { WebSocketServer } = require("ws");
const path = require("path");
const { networkInterfaces } = require("os");
const fs = require("fs");
const readline = require("readline");
const fastify = require("fastify")({ logger: false });
const packageJson = require("./package.json");

const assetsDirectory = path.join(__dirname, "assets");

let tray;
let eventRepository;
let db;
let relay;
let validator;
let eventCount = 0;

// Don't show the app in the dock (macOS)
app.dock?.hide();

app.whenReady().then(async () => {
  createTray();
  await createServer();
  resetEventCount();
  setInterval(resetEventCount, 3600000); // 1 hour
});

app.on("before-quit", () => {
  eventRepository.close();
});

const createTray = () => {
  tray = new Tray(
    nativeImage.createFromPath(path.join(assetsDirectory, "nostrTemplate.png"))
  );
  let currentLocalIpAddress = getLocalIpAddress();

  tray.setContextMenu(createMenu(currentLocalIpAddress));
  tray.setTitle("--");

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
          detail: `Powered by nostr-relay (https://github.com/CodyTseng/nostr-relay)`,
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
      label: `ws://localhost:4869 - Copy`,
      type: "normal",
      click: () => clipboard.writeText(`ws://localhost:4869`),
    },
    {
      label: `ws://${localIpAddress}:4869 - Copy`,
      type: "normal",
      click: () => clipboard.writeText(`ws://${localIpAddress}:4869`),
    },
    { type: "separator" },
    {
      label: "Quit",
      role: "quit",
    },
  ]);
};

const createServer = async () => {
  const userPath = app.getPath("userData");

  await fastify.register(require("@fastify/cors"), {
    origin: "*",
  });

  fastify.get("/", function (_, reply) {
    reply.send({
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      software: packageJson.repository.url,
      supported_nips: [1, 11],
      limitation: {
        max_message_length: 128 * 1024, // 128 KB
        max_subscriptions: 20,
        max_limit: 1000,
        max_subid_length: 128,
        max_event_tags: 2000,
        max_content_length: 102400,
        min_pow_difficulty: 0,
        auth_required: false,
        payment_required: false,
        restricted_writes: false,
      },
      retention: [{ time: null }],
    });
  });

  const wss = new WebSocketServer({
    server: fastify.server,
    maxPayload: 128 * 1024,
  });
  eventRepository = new EventRepositorySqlite(path.join(userPath, "nostr.db"));
  db = eventRepository.getDatabase();
  relay = new NostrRelay(eventRepository);
  validator = new Validator({
    maxFilterGenericTagsLength: 512,
  });

  relay.register({
    afterEventHandle: (_ctx, _event, handleResult) => {
      if (
        handleResult.success &&
        !handleResult.message &&
        !handleResult.noReplyNeeded
      ) {
        incrEventCount();
      }
    },
  });

  wss.on("connection", (ws) => {
    relay.handleConnection(ws);

    ws.on("message", async (data) => {
      try {
        const message = await validator.validateIncomingMessage(data);
        await relay.handleMessage(ws, message);
      } catch (error) {
        ws.send(JSON.stringify(createOutgoingNoticeMessage(error.message)));
      }
    });

    ws.on("close", () => {
      relay.handleDisconnect(ws);
    });
  });

  const favicon = fs.readFileSync(path.join(assetsDirectory, "favicon.ico"));
  fastify.get("/favicon.ico", function (_, reply) {
    reply
      .header("cache-control", "max-age=604800")
      .type("image/x-icon")
      .send(favicon);
  });

  fastify.listen({ port: 4869 }, function (err) {
    if (err) {
      showDialog("Error", "Failed to start server.", err.message);
      process.exit(1);
    }
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
    }

    stream.end();

    setTimeout(() => {
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
      try {
        const event = await validator.validateEvent(JSON.parse(line));
        const { isDuplicate } = await eventRepository.upsert(event);
        if (!isDuplicate) {
          newEventCount++;
          incrEventCount();
        }
      } catch {
        errorCount++;
      }
    });

    rl.on("close", () => {
      setTimeout(() => {
        new Notification({
          title: "Import Complete",
          body: `Total: ${count}, New: ${newEventCount}, Error: ${errorCount}.`,
        }).show();
      }, 1000);
    });
  }
};

function incrEventCount(increment = 1) {
  eventCount += increment;
  tray.setTitle(formatCount(eventCount));
}

function resetEventCount() {
  eventCount = db.prepare("SELECT COUNT(*) FROM events").get()["COUNT(*)"];
  tray.setTitle(formatCount(eventCount));
}

function formatCount(count) {
  if (count < 1000) return `${count}`; // 999
  if (count < 10000) return `${(count / 1000).toFixed(2)}k`; // 9.99k
  if (count < 100000) return `${(count / 1000).toFixed(1)}k`; // 99.9k
  if (count < 1000000) return `${(count / 1000).toFixed(0)}k`; // 999k
  if (count < 10000000) return `${(count / 1000000).toFixed(2)}m`; // 9.99m
  if (count < 100000000) return `${(count / 1000000).toFixed(1)}m`; // 99.9m
  return `${(count / 1000000).toFixed(0)}m`; // 999m
}
