# React + Vite

## Running the app locally

1. In `server/.env`, set `MONGO_URI` and `JWT_SECRET`.
2. Start the API from the `server` folder with `npm run dev` (port `5000`).
3. Start the frontend from the project root with `npm run dev`.

The frontend sends API requests to `/api` by default; Vite proxies those requests
to the local backend. For a separately hosted frontend, set `VITE_API_URL` to
the backend API base URL, including `/api` (for example,
`https://your-backend.example.com/api`), and allow the frontend origin in the
backend CORS configuration.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
