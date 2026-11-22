# Multi Hex Visualizer
>website link : https://multi-hex-visualizer.pages.dev/


A fast, browser-based workspace for visualizing, comparing, editing, and exporting color palettes. It accepts HEX, RGB, RGBA, HSL, and OKLCH values and can display up to four independent palette groups across eight visualization layouts.

<img width="1779" height="884" alt="image" src="https://github.com/user-attachments/assets/68544fcb-2e05-43b7-9a95-6c87ccb586d3" />
<img width="1784" height="817" alt="image" src="https://github.com/user-attachments/assets/2d32bc8b-b9b6-4859-8912-83564c843b54" />
<img width="1750" height="899" alt="image" src="https://github.com/user-attachments/assets/e3eca971-d0e4-472e-bbec-39fa1964cebd" />
<img width="1724" height="846" alt="image" src="https://github.com/user-attachments/assets/03e0b33a-77d8-4208-9b81-6dbc019653b1" />
<img width="1792" height="928" alt="image" src="https://github.com/user-attachments/assets/e4b9c0d6-0cb3-4881-b310-e10ce29a8645" />

<img width="891" height="618" alt="image" src="https://github.com/user-attachments/assets/b65fd692-852c-4cb2-b2a1-88ed683b5e6e" />


## Features

- Paste multiple colors with automatic format and separator detection
- Work with HEX, RGB, RGBA, HSL, and OKLCH
- Compare up to four independently editable palettes
- Preview colors as grids, tiles, circles, stripes, diagonal bands, radial segments, or typography
- Edit, name, reorder, sort, reverse, and hue-shift colors
- Copy individual values or complete palettes
- Export PNG, SVG, CSS, JSON, and TXT
- Restore work from local browser storage or a shareable URL
- Light and dark themes, keyboard controls, fullscreen viewing, and responsive layouts
- Dedicated format routes, SEO metadata, structured data, legal pages, robots.txt, and sitemap.xml

## Tech stack

- [Astro](https://astro.build/)
- Tailwind CSS v4 through the Vite plugin
- Vanilla JavaScript for the interactive workspace
- Culori for color parsing and conversion
- Lucide static icons

## Local development

Install dependencies:

```sh
npm install
```

Start Astro in the project’s required background mode:

```sh
npx astro dev --background
```

Manage the server with:

```sh
npx astro dev status
npx astro dev logs
npx astro dev stop
```

The local site is normally available at `http://localhost:4321`.

## Commands

| Command | Action |
| --- | --- |
| `npm run build` | Build the static production site into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Node test suite |
| `npm run astro -- --help` | Show Astro CLI help |

## Project structure

```text
public/                 Static assets, robots.txt, sitemap.xml, and social image
src/components/        Visualizer, SEO content, guide, and shared footer
src/layouts/           Shared layout for policy pages
src/lib/               Color, preview, export, and workspace logic
src/pages/             Home, format-specific routes, privacy, and terms
src/styles/            Global visualizer and content styles
tests/                 Color and palette behavior tests
```

## SEO deployment URL

Canonical URLs, Open Graph URLs, `robots.txt`, and `sitemap.xml` currently use:

```text
https://mshareef-git.github.io/Multi-Hex-Visualizer/
```

If the project is deployed to a custom domain or a Cloudflare Pages domain, update that origin in:

- `src/components/Studio.astro`
- `src/layouts/Layout.astro`
- `public/robots.txt`
- `public/sitemap.xml`

Also verify that the deployment base path matches the absolute internal links used by the site.

## Privacy model

Palette data is processed in the browser. Workspace state and theme preference are stored in local storage. Shared workspaces are encoded into URL fragments, and oversized workspaces can be exported as files. The application does not include user accounts or an application database.

## Repository

[github.com/mshareef-git/Multi-Hex-Visualizer](https://github.com/mshareef-git/Multi-Hex-Visualizer)

