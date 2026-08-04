# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Deployment

This project deploys to [Vercel](https://vercel.com) using the `@astrojs/vercel` adapter (`output: 'server'` in `astro.config.mjs`). Vercel auto-detects the build settings; no `vercel.json` is required.

### Two Git remotes

Day-to-day work and production deploys use **different GitHub repos**:

| Remote | Repository | Branch | Purpose |
| :----- | :--------- | :----- | :------ |
| `origin` | `Hi-Altitude/ReviewScout-Astro` | `master` | Team source of truth |
| `personal` | `TristanAG/rs-astro-poc` | `main` | Triggers Vercel deploys |

Vercel on the Hobby plan cannot connect to the private org repo, so the Vercel project watches `TristanAG/rs-astro-poc` on **`main`**, not `Hi-Altitude/ReviewScout-Astro`.

Locally, the working branch is `master` and it tracks `personal/main`.

### Push to deploy

Commit your changes locally, then push to **both** remotes when you want the team repo and Vercel to stay in sync:

```sh
git push origin master
git push personal master:main
```

Because `master` tracks `personal/main`, this also triggers a deploy:

```sh
git push personal
```

Or push both in one step:

```sh
git push origin master && git push personal master:main
```

Pushing only to `origin` updates the org repo but **does not** trigger a Vercel deployment.

### Vercel project settings

In the Vercel dashboard, confirm **Settings → Git**:

- **Repository:** `TristanAG/rs-astro-poc`
- **Production Branch:** `main`

In **Settings → Environment Variables**, set:

- `STORYBLOK_TOKEN` — enabled for **Production** and **Preview**

The build fails without this token. See `astro.config.mjs` for how it is loaded.

Expected build settings (usually auto-detected):

| Setting | Value |
| :------ | :---- |
| Build Command | `npm run build` |
| Install Command | `npm install` |
| Output | Handled by `@astrojs/vercel` |

### Verify a deployment

After pushing to `personal`, a new deployment should appear in Vercel within ~30 seconds. In **Deployment Details**, check:

- **Repository:** `TristanAG/rs-astro-poc`
- **Branch:** `main`
- **Commit:** matches `git rev-parse master`

In the build logs, you should see:

```text
[storyblok] access token length: 24
```

If that line is missing or the commit SHA is stale, Vercel is building old code or the wrong repo.

### Troubleshooting

| Symptom | Likely cause |
| :------ | :----------- |
| Push succeeded, no Vercel deploy | Pushed to `origin` only, not `personal` |
| Deploy ran, site unchanged | Wrong branch (`master` vs `main`) or wrong connected repo |
| Build fails immediately | Missing `STORYBLOK_TOKEN` in Vercel env vars |
| No deploy at all | Git integration disconnected, or GitHub App lacks access to `rs-astro-poc` |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
