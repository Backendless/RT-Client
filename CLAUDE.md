# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Backendless RT Client — a JavaScript library for real-time communication with Backendless RT Server via WebSockets (socket.io). Provides data subscriptions, pub/sub messaging, Real-time Shared Objects (RSO), and remote method invocation.

## Related Projects

All three projects live as siblings under the same parent directory:

```
../
├── rt-server/    # Backendless RT Server — the server this client connects to
├── RT-Client/    # This repo — RT client library
└── JS-SDK/       # Backendless JS SDK — consumes this RT client as a dependency
```

The dependency chain is: **JS-SDK → RT-Client → rt-server**

## Build & Development Commands

```bash
npm run build          # Full build: CommonJS (lib/), ES modules (es/), UMD (dist/)
npm run build:commonjs # Babel transpile to CommonJS only
npm run build:es       # Babel transpile to ES modules only
npm run build:umd      # Webpack UMD development bundle
npm run build:umd:min  # Webpack UMD production bundle
npm run dev            # Watch mode — rebuilds CommonJS on src/ changes
npm run lint           # ESLint with auto-fix on src/
npm run clean          # Remove lib/, dist/, es/
npm run prepare        # clean + build + bannerize (pre-publish)
```

No test framework is configured — `npm run test` is referenced but not implemented.

## Architecture

### Layered Design

```
RTClient (client.js) — main orchestrator, connection lifecycle
  ├── RTSubscriptions (subscriptions.js) — data/pub-sub/RSO subscriptions
  ├── RTMethods (methods.js) — RPC-style remote method invocations
  └── RTSession (session.js) — reconnection with exponential backoff
       └── RTSocket (socket.js) — socket.io-client wrapper
```

**Entry point:** `src/index.js` exports `RTClient` (default), `RTListeners`, `RTScopeConnector`, and attaches `Request` from `backendless-request`.

### Key Patterns

- **Lazy connection:** RTClient only creates an RTSession when subscriptions or methods need it (`provideConnection()`)
- **Auto-disconnect:** Disconnects if connection error occurs and no active subscriptions/methods exist
- **Socket context injection:** RTClient passes `{ onMessage, emitMessage }` to Subscriptions and Methods
- **Exponential backoff:** RTSession reconnects with 200ms initial delay, doubling up to 60s max, step at 10 attempts
- **Decorator pattern:** `RTScopeConnector` uses `@connectionRequired()` to queue method calls until scope is connected
- **Custom socket.io parser** (`socket-parser.js`): JSON-only, replaces default `socket.io-parser` via webpack plugin to avoid binary overhead

### Protocol Events (constants.js)

- Subscriptions: `SUB_ON` / `SUB_OFF` / `SUB_RES` / `SUB_READY`
- Methods: `MET_REQ` / `MET_RES`
- Subscription types: `OBJECTS_CHANGES`, `RELATIONS_CHANGES`, `PUB_SUB_*`, `RSO_*`, `*_MESSAGES`
- Method types: `SET_USER_TOKEN`, `RSO_GET/SET/CLEAR/COMMAND/INVOKE`, `PUB_SUB_COMMAND`

### Output Formats

Three build targets via package.json entry points:
- `main` → `lib/index.js` (CommonJS)
- `module` → `es/index.js` (ES modules)
- `browser` → `dist/backendless-rt-client.js` (UMD, global `BackendlessRTClient`)

## Code Style

- **No semicolons**, single quotes, 120-char max line length
- `const`/`let` only (no `var`), `===`/`!==` (smart null comparison allowed)
- Function declarations preferred, arrow functions allowed
- `no-console` is an **error** — use debug logging through the socket's debug mode instead
- Arrow parens: as-needed; object curly spacing required
- Parser: babel-eslint (supports decorators and experimental features)

## Dependencies

- **socket.io-client** `^2.5.0` — WebSocket transport (v2, not v4)
- **backendless-request** `^0.8.0` — HTTP requests, re-exported as `RTClient.Request`
- **@babel/runtime** — transpilation helpers
- Babel with legacy decorators and class properties plugins
