# Shopify Hydrogen shadcn/ui Template

I run a storefront on Shopify. Shopify handles inventory, fulfillment, and payments better than anything else for physical products, but their Liquid theme system feels ancient compared to modern React. Hydrogen gives you Shopify's backend with a real React frontend, deployable anywhere. I wanted a starting point that combined Hydrogen with shadcn/ui, proper TypeScript, and React Router 7 so I wouldn't be scaffolding the same boilerplate every time. So I built this.

Modern Shopify storefront built with Hydrogen, React Router 7, and shadcn/ui.

## Prerequisites

- Node.js 18.0+, npm 8.19+
- Shopify store (free trial at [shopify.com](https://www.shopify.com/))
- [Hydrogen sales channel](https://apps.shopify.com/hydrogen) installed

## Quick start

```bash
git clone https://github.com/ramonclaudio/shopify-hydrogen-shadcn-template.git
cd shopify-hydrogen-shadcn-template
npm install
```

Connect to your Shopify store:

```bash
npx shopify hydrogen link      # login + link/create storefront
npx shopify hydrogen env pull  # auto-generate .env
```

Generate TypeScript types from your store's GraphQL schema:

```bash
npm run codegen
```

Run dev:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy

To Shopify Oxygen:

```bash
npx shopify hydrogen deploy
```

Self-host on Vercel, Netlify, Cloudflare Workers, or any Node host. See [Shopify's self-hosting guide](https://shopify.dev/docs/storefronts/headless/hydrogen/deployments/self-hosting).

## Stack

- Shopify Hydrogen 2025.7.0
- React Router 7.9.2, React 18.3.1
- shadcn/ui (18 components) + Radix
- Tailwind CSS 4.1.6
- TypeScript 5.9.2, Vite 6.2.4
- `remix-themes` (dark mode)

## What's included

- Full storefront: product browsing with variant selection, cart with optimistic UI, customer accounts, order history, search with predictive results, blog, content pages
- 18 shadcn/ui components, dark mode, mobile responsive
- Locale-aware routing via `($locale)` params
- Auto-generated GraphQL types from your store's schema

## Current limitations

Stuck on React 18.3.1 and Vite 6.2.4: Vite 7's SSR implementation conflicts with Hydrogen's mini-oxygen dev server, and Vite 7 requires React 19 via peer deps. Both blocked until Hydrogen ships mini-oxygen v5. [Tracking #3263](https://github.com/Shopify/hydrogen/issues/3263).

## Commands

```bash
npm run dev         # dev server
npm run build       # production build
npm run preview     # preview production build
npm run lint        # eslint
npm run typecheck   # tsc
npm run codegen     # regenerate GraphQL types
```

## Customization

Add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Edit theme colors in `app/app.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
}
```

Add routes in `app/routes/` following React Router 7:
- `($locale).your-route.tsx` — page
- `($locale).your-route.$param.tsx` — dynamic
- `($locale).your-route._index.tsx` — index

## Troubleshooting

- **Products not showing**: verify `npx shopify hydrogen link` and `env pull` succeeded, and your store has published products
- **Build errors**: run `npm run codegen` and check Node 18.0+. Clear: `rm -rf .react-router node_modules && npm install`
- **Type errors**: regenerate types with `npx react-router typegen`

## License

MIT
