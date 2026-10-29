# Group Chat Backend

Express API for the Group Chat frontend.

## Requirements

- Node.js 20 or newer

## Start the API

```powershell
npm install
npm run dev
```

The server reads `HOST` and `PORT` from `.env` and defaults to `127.0.0.1:3001`.

## Health endpoint

```http
GET /api/health
```

Returns a JSON health status and timestamp. The frontend's Vite dev server proxies `/api` requests to this backend.
