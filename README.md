# Budget Tracker

The repository contains three independently runnable projects:

- `backend/` — Express API and MongoDB
- `frontend/` — Vite web client
- `mobile/` — Expo / React Native mobile client

## Run web and mobile together

Install dependencies once in each project:

```sh
cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install
```

Before starting the mobile app, create `mobile/.env` from
[mobile/.env.example](./mobile/.env.example) and set `EXPO_PUBLIC_API_URL`:

- Android emulator: `http://10.0.2.2:5000/api`
- iOS simulator: `http://localhost:5000/api`
- Physical phone: `http://<your-computer-LAN-IP>:5000/api`

For a physical phone, ensure it can reach the backend over the same network.
Restart Expo after changing `.env` so the URL is included in the app bundle.

From the repository root, start the backend, web server, and Expo development
server together:

```sh
npm run dev
```

Press Ctrl+C to stop all three. To start only one service, use `npm run
dev:backend`, `npm run dev:web`, or `npm run dev:mobile`.

The web app is available at the Vite URL (usually `http://localhost:5173`).
Expo prints a QR code and simulator/device options in the terminal. See
[mobile/README.md](./mobile/README.md) for platform API URL examples and
mobile-specific setup.
