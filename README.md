# Vite & Vue — host template

Starter template for the [MFE Orchestrator](https://github.com/mfe-orchestrator), listed in the
marketplace as `vite-host-vue`. Vite + Vue 3, wired as a **host**.

## Requirements

- Node.js 20 or newer
- [pnpm](https://pnpm.io) 10 or newer

> [!NOTE]
> The client SDK is published as `@mfe-orchestrator-hub/client` and this template depends on it at
> `^0.1.0`. A caret on a `0.x` version is deliberately narrow: it accepts `0.1.x`
> only, **not** `0.2.0`. The SDK is new and parts of its API are still settling, so that is the
> intended level of caution — the cost is that you have to widen this range yourself when the SDK
> moves to `0.2.0`, otherwise `pnpm install` fails to resolve it.

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # production build into dist/
```

## Project structure

```
.
├── .github/workflows/build-and-deploy.yml   # build + upload + Docker image
├── Dockerfile                               # standalone nginx deploy
├── nginx/no-cache.conf
├── index.html
├── src/
│   ├── App.vue                              # shell, consumes the example remote
│   ├── components/ManifestPanel.vue          # reads the manifest through the SDK
│   ├── index.css
│   └── main.js                              # configure() lives here
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── vite.config.js                           # federation config
```

## How the orchestrator is wired in

**The host never decides which version it gets.** It hands over the identities it holds and uses
the URL it receives, verbatim. Which version that URL points at — stable, canary, whatever — is
decided by the backend. Nothing in this repo parses a version, builds a URL by hand, or knows that
canaries exist.

Two pieces make that work.

**1. `configure()`, at the very top of the entry point (`src/main.js`), synchronously, before
anything imports a remote:**

```js
import { configure } from '@mfe-orchestrator-hub/client'

const environment = import.meta.env.VITE_MFE_ENVIRONMENT?.trim()

configure({
  backendUrl: import.meta.env.VITE_MFE_BACKEND_URL,
  projectId: import.meta.env.VITE_MFE_PROJECT_ID,
  ...(environment ? { environment } : {})
})
```

`environment` is optional. The host does not have to know which environment it runs in: when the
key is absent the backend resolves the environment from the domain the request comes from. An
unset Vite variable arrives as `undefined` and one declared empty in `.env` arrives as an empty
string, so the entry point normalises both and drops the key instead of forwarding a fake slug.
Set `VITE_MFE_ENVIRONMENT` only when you want to pin the environment explicitly — for instance
when several environments are served from the same domain.

**2. The remote, declared in `vite.config.js` as a promise that resolves to a URL:**

```js
federation({
  name: 'app',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/...' },
  remotes: {
    exampleremote: {
      external: `import('@mfe-orchestrator-hub/client').then(m => m.remoteUrl('example-remote'))`,
      externalType: 'promise'
    }
  },
  shared: [...]
})
```

`remoteUrl('example-remote')` takes the **slug** of a microfrontend and returns the URL the backend
resolved for it, already pinned to a version. Rename the key and the slug to match your own
microfrontends, and add one entry per remote.

The SDK also exposes `manifest()`, `globalVariables()` and `identities()`, all used in this
template, so you can see what the environment actually returned.

## Environment variables

Copy `.env.example` to `.env` and fill it in. Vite injects them at build time.

| variable | required | what it is |
| --- | --- | --- |
| `VITE_MFE_BACKEND_URL` | yes | orchestrator backend, including the `/api` suffix |
| `VITE_MFE_PROJECT_ID` | yes | id of your project in the orchestrator |
| `VITE_MFE_ENVIRONMENT` | no | environment slug, ex. `DEV`. Omit it, or leave it empty, and the backend resolves the environment from the domain the request comes from |

`.env` is gitignored. Never commit real values.

## Build output

`pnpm build` writes to `dist/`. The federation entry lands at **`dist/assets/remoteEntry.js`**, which is the `entryPoint` the marketplace entry declares.

Check it after any change to `vite.config.js`: the orchestrator serves exactly that path, so a build that
puts the entry somewhere else is broken.

## Deploying

### Upload to the orchestrator

`.github/workflows/build-and-deploy.yml` builds the app and uploads `dist/` with
[`mfe-orchestrator/github-action`](https://github.com/mfe-orchestrator/github-action). It runs on
any pushed tag, or manually via *Run workflow*.

Configure these once, in the repository settings:

| kind | name | value |
| --- | --- | --- |
| secret | `MICROFRONTEND_ORCHESTRATOR_API_KEY` | your orchestrator API key |
| variable | `MICROFRONTEND_SLUG` | the slug of this host in the orchestrator |
| variable | `MICROFRONTEND_ORCHESTRATOR_DOMAIN` | your console URL, optional, defaults to `https://console.mfe-orchestrator.dev` |

The API key is a **secret**, never a variable and never a literal in the workflow file. If you
prefer hardcoding the two per project values instead of using repository variables, replace the
expressions in the `env:` block at the top of the workflow.

### Standalone deploy

A host is consumable as a remote, but it is also an application in its own right, so the same
workflow builds and pushes an nginx image to `ghcr.io/<owner>/<repo>`. `nginx/no-cache.conf` serves
`index.html` for any route and marks the entry files as never cacheable, so a redeploy is picked up
immediately.

```bash
docker build -t my-host .
docker run -p 8080:80 my-host
```

## License

MIT
