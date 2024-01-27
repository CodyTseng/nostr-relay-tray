const { NostrRelay } = require("@nostr-relay/core");
const {
  EventRepositorySqlite,
} = require("@nostr-relay/event-repository-sqlite");
const { Validator } = require("@nostr-relay/validator");
const { app, nativeImage, Tray, Menu, dialog } = require("electron");
const { WebSocketServer } = require("ws");
const path = require("path");
const { networkInterfaces } = require("os");

// Don't show the app in the doc
app.dock.hide();

app.whenReady().then(() => {
  createTray();
  createServer();
});

const createTray = () => {
  const assetsDirectory = path.join(__dirname, "assets");
  const tray = new Tray(
    nativeImage.createFromPath(path.join(assetsDirectory, "nostrTemplate.png"))
  );

  const menu = Menu.buildFromTemplate([
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
      label: `ws://localhost:4869`,
      type: "normal",
      enabled: false,
    },
    {
      label: `ws://${getLocalIpAddress()}:4869`,
      type: "normal",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Quit",
      role: "quit",
    },
  ]);

  tray.setContextMenu(menu);
};

const createServer = () => {
  const userPath = app.getPath("userData");

  const wss = new WebSocketServer({ port: 4869 });
  const eventRepository = new EventRepositorySqlite(
    path.join(userPath, "nostr.db")
  );
  const relay = new NostrRelay(eventRepository);
  const validator = new Validator();

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

function getLocalIpAddress() {
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
}
