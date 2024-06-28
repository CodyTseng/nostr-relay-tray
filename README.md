<h1 align="center">
  <br>
  <img src="resources/icon.png" alt="nostr-relay-tray" width="210">
  <br>
  nostr-relay-tray
  <br>
  <br>
</h1>

<h4 align="center">A simple nostr relay tray. For Mac, Windows, and Linux. </h4>

<p align="center">powered by <a href="https://github.com/CodyTseng/nostr-relay">nostr-relay</a></p>

## Features

- **Comprehensive**: A fully featured Nostr relay.
- **User-Friendly**: Start the relay with a single click.
- **Granular Control**: Manage which events to accept or reject with precision.
- **Cross-Platform**: Available for macOS, Windows, and Linux.

## Download

You can download the latest version from the [release page](https://github.com/CodyTseng/nostr-relay-tray/releases). If you want to use Apple Silicon version, you need to build it from the source code.

Because the app is not signed, you may need to allow it to run in the system settings.

## Build from source

You can also build the app from the source code.

```bash
# Clone this repository
git clone https://github.com/CodyTseng/nostr-relay-tray.git

# Go into the repository
cd nostr-relay-tray

# Install dependencies
npm install

# Build the app
npm run build:mac
# or npm run build:win
# or npm run build:linux
```

The executable file will be in the `dist` folder.

## Screenshot

![screenshot](./screenshots/screenshot-1.jpg)

![screenshot](./screenshots/screenshot-2.jpg)

![screenshot](./screenshots/screenshot-3.jpg)

## Donate

If you like this project, you can buy me a coffee :) ⚡️ codytseng@getalby.com ⚡️

## Icon Attribution

The ostrich element within the icon is sourced from [nostr_icons](https://github.com/satscoffee/nostr_icons). Special thanks to satscoffee for providing such a beautiful ostrich.

## License

MIT
