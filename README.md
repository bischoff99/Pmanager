# Pmanager

## Configuration Server

This project now includes a small Express server used to supply
platform API keys at runtime. Keys are read from environment variables
and never exposed in the client bundle.

### Environment variables

```
EASYSHIP_KEY=<your_easyship_key>
VEEQO_KEY=<your_veeqo_key>
CONFIG_API_TOKEN=<token_used_by_frontend>
```

### Start the server

```
cd server
npm install
node config.js
```

The client fetches keys via `GET /config/key?platform=easyship` and uses
the `Authorization: Bearer <CONFIG_API_TOKEN>` header for
authentication.