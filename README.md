# OneinStack Panel Web

OneinStack Panel Web is the Vue 3 + TypeScript frontend for [OneinStack Panel](https://github.com/oneinstack/Oneinstack-Panel). It provides the browser interface for server administration, software, websites, databases, containers, security, monitoring, and multi-node operations.

## Included pages

- Dashboard and resource monitoring
- Software store, installation tasks, service configuration, and updates
- Websites, Nginx/reverse proxy, certificates, ACME, backups, and restore
- Databases, Redis, backups, and remote connections
- Docker containers, images, Compose, and controlled terminals
- Files, SSH, firewall, Fail2ban, scheduled tasks, and runtime logs
- Users, roles, menu visibility, approvals, audit, configuration snapshots, and settings
- Multi-node management: controller/node role, node-mode switch, node registration, token rotation, metrics, task history, and website dispatch

## Multi-node configuration

Open **Multi-node Management → Local cluster role** to choose:

- **Controller**: manage other Panel nodes and dispatch tasks.
- **Node**: enable node mode, enter the controller URL and node token, and configure heartbeat/request intervals.

The form calls `GET/PUT /v1/cluster/agent/settings`; values are persisted by the backend. The node agent automatically reloads changes, so manual YAML editing is not required.

The website dispatch form supports fixed-node, tag, and least-load strategies, plus optional website-content synchronization.

## Requirements

- Node.js **22.12 or newer** (the version in `.nvmrc` and CI)
- npm with the committed `package-lock.json`

Do not build with Node.js 16. Vite 7 and the current lockfile require the Node 22 toolchain.

## Install and run

```bash
nvm install
nvm use
npm ci
npm run dev
```

Useful commands:

```bash
npm run typecheck  # Vue/TypeScript validation
npm test           # Node test suite
npm run build      # production H5 build and version archive
```

The development server uses the Vite configuration in `vite.config.ts`. API requests are configured through the project environment files; do not commit credentials or private keys.

## CI and publishing

GitHub Actions runs the secret scan, `npm ci`, type checking, tests, production build, artifact verification, and supply-chain inventory. The publish workflow builds `main` and force-updates the `Publish` branch with the immutable frontend assets.

Before pushing, run:

```bash
./scripts/secret-scan.sh
npm run typecheck
npm test
npm run build
```

## Project layout

- `src/`: Vue pages, components, stores, API modules, and localization
- `public/`: static public assets
- `scripts/`: validation, secret scanning, packaging, and supply-chain scripts
- `version/`: generated release archives
- `vite.config.ts`: Vite build configuration

## License

This project is licensed under [Apache License 2.0](LICENSE).
