# Budget Tracker Mobile

This is a separate Expo / React Native client for the existing Budget Tracker
backend. It uses the same accounts and data as the web app; it does not replace
or change the web client.

## Features

- Sign in and account registration
- Dashboard totals and period filters
- Expense and income envelopes, including create, edit, and delete
- Transactions and income fills, including create, edit, delete, search, and type filters
- Envelope transfers, including create, edit, delete, and history
- Six-month income and expense charts and spending by envelope
- CSV transaction import and export
- Currency display preference, approximate USD/PKR conversion, and transaction page-size setting
- Secure token storage with Expo SecureStore

## Run the apps together

Keep the backend and web client running in separate terminals:

```sh
cd backend
npm run dev
```

```sh
cd frontend
npm run dev
```

In another terminal, configure and start the mobile client:

```sh
cd mobile
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_URL for your emulator, simulator, or phone.
npm install
npx expo start --clear
```

The project uses Expo SDK 58. Use an SDK 58-compatible Expo Go to scan the QR
code, or run `npm run android` / `npm run ios` with the corresponding
simulator/device toolchain installed.

### API URL examples

- Android emulator: `http://10.0.2.2:5000/api`
- iOS simulator: `http://localhost:5000/api`
- Physical phone: `http://<your-computer-LAN-IP>:5000/api`

For a physical phone, the phone and computer must be on the same network, and
the backend must listen on an interface reachable from the LAN. Do not use
`localhost` for a physical device; it refers to the phone itself. Use HTTPS for
production deployments and keep the API host out of source control.

`EXPO_PUBLIC_API_URL` is bundled into the application and is not a secret.
The Android release profile below specifies the public backend URL.
Authentication tokens are stored in the platform secure store.

If sign-in reports a network error, confirm `http://<API host>:5000/api/health`
opens from the phone's browser, then restart Expo with `npx expo start --clear`.

## Build an Android APK to share

The internal APK profile uses the deployed backend at
`https://budget-tracker-jx22.vercel.app/api`. Confirm that
`https://budget-tracker-jx22.vercel.app/api/health` responds before building.

Install or sign in to an Expo account, then run:

```sh
cd mobile
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile preview
```

`eas init` links this app to your Expo account. The first build may ask to
configure Android signing; accept the prompts. When the cloud build finishes,
open its build page and share the APK download link. Recipients can download the
APK on Android and install it, allowing installation from that source if
Android asks. The APK contains the public API URL, so future backend URL changes
require a new build.

## Verify the mobile bundle

```sh
cd mobile
npx expo install --check
npx expo export --platform android
```

The web project remains independently runnable with `cd frontend && npm run dev`.
