import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {AlertCircle, Home} from 'lucide-react';
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useRouteLoaderData,
  type ShouldRevalidateFunction,
} from 'react-router';
import {PreventFlashOnWrongTheme, ThemeProvider, useTheme} from 'remix-themes';
import {Button} from '~/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import {themeSessionResolver} from '~/lib/sessions.server';
import type {Route} from './+types/root';
import Styling from './app.css?url';
import {PageLayout} from './components/PageLayout';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  // Get theme from session
  const {getTheme} = await themeSessionResolver(args.request);

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN || env.PUBLIC_STORE_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
    theme: getTheme(),
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {header};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  return <>{children}</>;
}

function LayoutWithTheme({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');
  const [theme] = useTheme();

  return (
    <html lang="en" data-theme={theme ?? ''} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={Styling}></link>
        <Meta />
        <PreventFlashOnWrongTheme
          ssrTheme={Boolean(data?.theme)}
          nonce={nonce}
        />
        <Links />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

function AppWithProviders() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <ThemeProvider specifiedTheme={data.theme} themeAction="/action/set-theme">
      <LayoutWithTheme>
        <AppContent />
      </LayoutWithTheme>
    </ThemeProvider>
  );
}

function AppContent() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  // Only enable analytics in production
  const isProduction = import.meta.env.PROD;

  // Disable analytics in development to prevent CORS errors
  if (!isProduction) {
    return (
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    );
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export default AppWithProviders;

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;
  let errorTitle = 'Oops! Something went wrong';

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;

    if (errorStatus === 404) {
      errorTitle = 'Page Not Found';
      errorMessage = "Sorry, we couldn't find the page you're looking for.";
    } else if (errorStatus === 500) {
      errorTitle = 'Server Error';
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-2xl">{errorTitle}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Error {errorStatus}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <p className="text-muted-foreground">{errorMessage}</p>
          )}
          <Button asChild className="w-full" size="lg">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
