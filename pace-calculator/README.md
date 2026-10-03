# Get Back on Pace

React/Vite race pace tools with a Capacitor iOS wrapper. Both calculators run locally; Google Fonts requires a network connection, with system font fallbacks offline.

## Web development

Use Node.js 24 LTS and npm:

```sh
npm ci
npm test
npm run lint
npm run dev
```

## iPhone simulator

Requires Xcode with an installed iOS simulator runtime and its license accepted.

```sh
npm run ios:sync
npm run ios:open
```

In Xcode, select the **App** scheme and an iPhone simulator, then Run. No paid developer enrollment or real-device signing is needed. Alternatively, `npm run ios:run` builds, syncs, and offers a simulator target.

Always run `npm run ios:sync` after web changes: the native app loads bundled `dist` assets, not a development server. Commit `ios/` and `capacitor.config.json`; generated web assets and native caches are ignored.

Local bundle ID: `com.rogandev.backonpace`. This does not register an App Store identifier. Icons and launch artwork remain Capacitor defaults pending production branding.

## First Mac build

The first build used official Node.js 24.21.0 extracted under `/tmp/node-v24.21.0-darwin-arm64`, without changing system configuration. Until Node is installed separately, prefix commands with:

```sh
export PATH=/tmp/node-v24.21.0-darwin-arm64/bin:$PATH
```

That temporary runtime may disappear after a restart or cleanup.

Production dependencies have no reported npm audit advisories. Three moderate development-only findings remain in Capacitor CLI's xcode/uuid dependency chain; npm's proposed forced downgrade was not applied.
