# Shopify Hydrogen shadcn/ui Template

Modern Shopify storefront built with Hydrogen, React Router 7, and shadcn/ui. Made this for selling physical products with the same modern stack I use for everything else.

## Quick Start

**Prerequisites:**
- Node.js 18.0+ and npm 8.19+ ([Download](https://nodejs.org/))
- A Shopify store (free trial works: [shopify.com](https://www.shopify.com/))
- Hydrogen sales channel installed ([Install from App Store](https://apps.shopify.com/hydrogen))

### 1. Clone and Install

```bash
git clone https://github.com/ramonclaudio/shopify-hydrogen-shadcn-template.git
cd shopify-hydrogen-shadcn-template
npm install
```

### 2. Connect to Shopify

```bash
npx shopify hydrogen link
npx shopify hydrogen env pull
```

This logs you into Shopify, creates/links a storefront, and auto-generates your `.env` file with credentials.

### 3. Generate TypeScript Types

```bash
npm run codegen
```

This generates TypeScript types from your Shopify store's GraphQL schema (Storefront API and Customer Account API). Run this whenever your Shopify schema changes.

### 4. Start Development

```bash
npm run dev
```

Open http://localhost:3000 - you'll see your store with your actual products!

### 5. Deploy to Production

```bash
npx shopify hydrogen deploy
```

That's it! Your store is live on Shopify's Oxygen hosting.

**Self-hosting:** Can also deploy to Vercel, Netlify, Cloudflare Workers, or any Node.js host. See [Shopify's self-hosting guide](https://shopify.dev/docs/storefronts/headless/hydrogen/deployments/self-hosting) for adapter configuration.

---

## Why This Exists

If you're selling physical products, Shopify handles inventory, shipping, and fulfillment better than anything else. But the standard Shopify theme system feels ancient compared to modern React development.

Hydrogen lets you build Shopify storefronts with React and deploy them anywhere - Vercel, Cloudflare, your own servers. You get Shopify's backend with a proper React frontend. This template combines that with shadcn/ui so you can build a good-looking store without starting from scratch.

## Who This Is For

**Tech companies selling merch:** If you're an AI startup, dev tools company, or tech brand that wants to sell t-shirts, hoodies, stickers - and your team already knows React/TypeScript/shadcn - this is your starting point. Upload products and ship.

**Agencies and freelancers:** Seen plenty of big brands and artists running janky merch setups. This gives you a modern scaffold to deliver professional stores quickly.

**Developers who hate Liquid templates:** If you know React but don't want to learn Shopify's template language, use this instead. Proper React components, TypeScript, and all the tooling you're used to.

## What's Included

**Complete component library:** 18 shadcn/ui components (buttons, forms, dialogs, cards, badges, tables, etc.) built on Radix UI primitives. Dark mode included.

**Full e-commerce functionality:** Product pages, collections, cart, checkout, customer accounts, search, blog. Everything needed for a production store.

**Internationalization:** Built-in locale support with `($locale)` route parameters - ready for multi-language stores.

**Modern stack:** React Router 7, TypeScript, Tailwind CSS 4, auto-generated GraphQL types. Same developer experience as any modern React app.

**Self-hosted:** Deploy anywhere Node.js runs. Not locked into Shopify hosting or their theme system.

**Tech stack:**
- Shopify Hydrogen 2025.7.0
- React Router 7.9.2
- React 18.3.1
- shadcn/ui (18 components) + Radix UI
- Tailwind CSS 4.1.6
- TypeScript 5.9.2
- Vite 6.2.4
- remix-themes (dark mode)

## Features

- Product browsing with variant selection
- Cart with optimistic UI updates
- Customer accounts and order history
- Search with predictive results
- Blog and content pages
- Dark/light mode
- Mobile responsive
- Type-safe GraphQL

## Current Limitations

**React 19 & Vite 7 blocked:** Using React 18.3.1 and Vite 6.2.4 because Vite 7's SSR implementation conflicts with Hydrogen's mini-oxygen dev server. Vite 7 also requires React 19 via peer deps, blocking both upgrades. [Tracking #3263](https://github.com/Shopify/hydrogen/issues/3263).

Planning to upgrade and test React 19.2's View Transitions API, `useEffectEvent`, and experimental caching once Hydrogen ships mini-oxygen v5.

## Development Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
npm run codegen    # Regenerate GraphQL types
```

## Customization

**Add more shadcn/ui components:**
```bash
npx shadcn@latest add [component-name]
```

**Modify theme colors:**
Edit CSS variables in `app/app.css`:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
}
```

**Add new routes:**
Create files in `app/routes/` following React Router 7 conventions:
- `($locale).your-route.tsx` - Single page
- `($locale).your-route.$param.tsx` - Dynamic route
- `($locale).your-route._index.tsx` - Index route

## Project Structure

```
app/
├── components/
│   ├── ui/                    # 18 shadcn/ui components
│   ├── AddToCartButton.tsx
│   ├── CartMain.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── mode-toggle.tsx        # Dark mode toggle
├── routes/                     # 28 locale-aware routes
│   ├── ($locale)._index.tsx
│   ├── ($locale).products.$handle.tsx
│   ├── ($locale).collections.$handle.tsx
│   ├── ($locale).account.tsx
│   └── ...
├── hooks/
│   └── use-mobile.ts          # Responsive breakpoint hook
├── lib/
│   ├── fragments.ts           # GraphQL fragments
│   ├── context.ts             # Hydrogen context
│   ├── i18n.ts                # Locale detection
│   └── sessions.server.ts     # Theme session management
├── graphql/
│   └── customer-account/      # Customer Account API queries
├── app.css                     # Tailwind + theme configuration
└── root.tsx
```

## Troubleshooting

**Products not showing up?**
- Verify you ran `npx shopify hydrogen link` and `npx shopify hydrogen env pull`
- Check `.env` file exists and has all required variables
- Ensure your Shopify store has products published

**Build errors?**
- Run `npm run codegen` to regenerate GraphQL types
- Verify Node.js version: `node --version` (need 18.0+)
- Clear cache: `rm -rf .react-router node_modules && npm install`

**Type errors?**
- React Router types are auto-generated on first `npm run dev`
- Manually regenerate: `npx react-router typegen`

## License

MIT
