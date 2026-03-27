import {Suspense} from 'react';
import {Await, Link, useLoaderData} from 'react-router';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {AspectRatio} from '~/components/ui/aspect-ratio';
import {Button} from '~/components/ui/button';
import {Skeleton} from '~/components/ui/skeleton';
import type {Route} from './+types/_index';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  return {};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return <RecommendedProducts products={data.recommendedProducts} />;
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section className="mx-auto max-w-4xl px-8 pt-8 pb-16">
      <div className="mb-16 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-widest uppercase">
          FEATURED PRODUCTS
        </h2>
        <Button variant="outline-black-rounded" asChild>
          <Link
            to="/collections/all"
            className="text-xs font-semibold tracking-widest uppercase px-6 hover:scale-105 transition-transform"
          >
            VIEW ALL
          </Link>
        </Button>
      </div>
      <Suspense fallback={<ProductsLoadingSkeleton />}>
        <Await resolve={products}>
          {(response) => (
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
              {response
                ? response.products.nodes.map(
                    (
                      product: (typeof response.products.nodes)[number],
                      index: number,
                    ) => (
                      <ProductItem
                        key={product.id}
                        product={product}
                        loading={index < 2 ? 'eager' : 'lazy'}
                      />
                    ),
                  )
                : null}
            </div>
          )}
        </Await>
      </Suspense>
    </section>
  );
}

function ProductsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
      {Array.from({length: 4}, (_, i) => (
        <div key={`skeleton-${i}`} className="space-y-4">
          <AspectRatio ratio={3 / 4}>
            <Skeleton className="h-full w-full rounded-lg" />
          </AspectRatio>
          <div className="space-y-3">
            <div>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    availableForSale
    collections(first: 5) {
      nodes {
        id
        title
        handle
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    options {
      name
      optionValues {
        name
      }
    }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
