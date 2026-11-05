# itsghostlan portfolio

The portfolio app and visual design come from the complete Figma Make project in `C:\Users\lucas\Downloads\website design`. This repository keeps that React/Vite app intact, including its draggable, wheel- and keyboard-controlled vinyl navigation, five portfolio sections, project pages, carousel, lightbox, responsive styling and reduced-motion support.

## Run locally

```powershell
npm install
npm run dev
```

Vite prints the local URL. To verify a production build:

```powershell
npm run typecheck
npm run build
```

## Deploy to Vercel

Import this repository into Vercel. The included [vercel.json](./vercel.json) configures the Vite build, static output, CMS/admin path, and the SPA fallback. The build script injects the public OAuth base URL into the generated CMS config from Vercel environment variables; no OAuth secrets are bundled into the site.

The OAuth function reads these **server-only** Vercel environment variables:

- `GITHUB_CLIENT_ID` — GitHub OAuth App client ID.
- `GITHUB_CLIENT_SECRET` — GitHub OAuth App secret; add as a Vercel Secret, never to source control.
- `OAUTH_BASE_URL` — the site's canonical HTTPS origin, e.g. `https://your-project.vercel.app`. Set this for Production and Preview only if Preview sign-in is configured.
- `ALLOWED_DOMAINS` — optional comma-separated additional hostnames allowed to open CMS sign-in, e.g. `www.example.com`. The hostname in `OAUTH_BASE_URL` is trusted automatically.
- `SITE_URL` — optional canonical site URL shown in the CMS; otherwise the Vercel production URL is used.

Use the same Production origin for `OAUTH_BASE_URL` and `SITE_URL`. In GitHub Developer Settings, create an OAuth App with its **Authorization callback URL** set to `https://your-project.vercel.app/callback`, then add its client ID and secret in Vercel **Project → Settings → Environment Variables** and redeploy. The Vercel Function handles `/auth` and `/callback`, validates CSRF state, restricts CMS sign-in to the canonical `OAUTH_BASE_URL` hostname and any optional `ALLOWED_DOMAINS`, and exchanges the GitHub code server-side.

Vercel CLI can also add environment variables after authenticating with `npx vercel login`; do not commit a populated `.env` file. `.env.example` lists the variable names without secrets.

## Content and Sveltia CMS

The app loads public JSON content at runtime from `public/content/`. The Sveltia CMS editor is at `/admin/`; its small GitHub icon is in the site footer. The CMS has separate Settings, Projects, Work, and Posts sections, and content fields can be left blank. Each project and Work gallery item has its own JSON entry under `public/content/projects/` and `public/content/work/`; the build generates the indexes the site reads, including when either collection folder is empty or absent. Work gallery entries link to project details and can be reordered independently. Empty sections show “No content yet.” Published posts appear on the home page.

The GitHub backend is configured for `itsghostlan/dylan-portfolio` on `main` in [public/admin/config.yml](./public/admin/config.yml). CMS edits commit directly to the content JSON files, and Vercel automatically deploys the new commit.
