# Novels by AKA · Capacitor app

This repository packages the existing static reading lounge as an Android app with Capacitor.

## Requirements

- Node.js 22 or newer
- Android Studio and an Android SDK (API 24 or newer)

## Build and open Android

```sh
npm install
npm run build
npx cap add android
npx cap sync android
npm run android:open
```

To run on an attached device or configured emulator:

```sh
npm run android:run
```

`npm run build` copies the static site and its story/image folders into `www/`. Capacitor syncs that web bundle into the native Android project. After changing website files, run `npm run cap:sync` before launching the native app.

The app ID is `com.aka.novelsbyaka`. Change it in `capacitor.config.json` before publishing if you use a different permanent application ID.
