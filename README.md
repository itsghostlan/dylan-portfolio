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

## Content and Sveltia CMS

The app loads public JSON content at runtime from `public/content/`. The Sveltia CMS editor is at `/admin/`; its small GitHub icon is in the site footer. It can edit site settings, projects, and studio posts. Published posts appear on the home page.

The GitHub backend is configured for `itsghostlan/dylan-portfolio` on `main` in [public/admin/config.yml](./public/admin/config.yml). CMS edits commit directly to those public JSON files, and the GitHub Pages workflow republishes the updated site on each commit.

### GitHub OAuth

GitHub OAuth needs a server-side OAuth client; a GitHub client secret must never be stored in this repository. Deploy [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) (for example, on Cloudflare Workers), register its callback URL in a GitHub OAuth App, configure the app's client ID and secret in the authenticator, then set `backend.base_url` in `public/admin/config.yml` to the authenticator URL. The footer icon opens Sveltia, where editors can then authorize with GitHub.

The included [GitHub Pages workflow](./.github/workflows/deploy.yml) builds and deploys this repository to `https://itsghostlan.github.io/dylan-portfolio/` on pushes to `main`. Enable **GitHub Actions** as the Pages build and deployment source in repository settings.
