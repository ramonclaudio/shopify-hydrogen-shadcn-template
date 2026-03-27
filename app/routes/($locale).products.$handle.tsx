import {
  Analytics,
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  getSelectedProductOptions,
  useOptimisticVariant,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import { CheckIcon, PackageIcon, RotateCcwIcon, TruckIcon } from 'lucide-react';
import { Suspense } from 'react';
import { Await, Link, useLoaderData } from 'react-router';
import type { ProductRecommendationsQuery } from 'storefrontapi.generated';
import { ProductForm } from '~/components/ProductForm';
import { ProductImage } from '~/components/ProductImage';
import { ProductItem } from '~/components/ProductItem';
import { ProductPrice } from '~/components/ProductPrice';
import { Skeleton } from '~/components/ui/skeleton';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import type { Route } from './+types/products.$handle';

export const meta: Route.MetaFunction = ({ data }: { data: any }) => {
  return [
    { title: `Hydrogen | ${data?.product.title ?? ''}` },
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args, criticalData.product.id);

  return { ...deferredData, ...criticalData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({ context, params, request }: Route.LoaderArgs) {
  const { handle } = params;
  const { storefront } = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{ product }] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: { handle, selectedOptions: getSelectedProductOptions(request) },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, { status: 404 });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, { handle, data: product });

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: Route.LoaderArgs, productId: string) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  const { storefront } = context;

  const relatedProducts = Promise.all([
    storefront
      .query(RECOMMENDED_PRODUCTS_QUERY, {
        variables: { productId },
      })
      .catch((error: unknown) => {
        console.error(error);
        return null;
      }),
    storefront
      .query(FALLBACK_PRODUCTS_QUERY)
      .catch((error: unknown) => {
        console.error(error);
        return null;
      }),
  ]);

  return {
    relatedProducts,
  };
}

export default function Product() {
  const { product, relatedProducts } = useLoaderData<typeof loader>();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const { title, descriptionHtml, description, vendor } = product;

  return (
    <div className="space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div>
          <ProductImage image={selectedVariant?.image} />
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          {/* Title & Price Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              {vendor && (
                <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
                  {vendor}
                </p>
              )}
              <h1 className="text-3xl font-bold tracking-tight">
                {title}
              </h1>
            </div>

            <ProductPrice
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
            />

            {description && (
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {selectedVariant?.availableForSale ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-600 font-medium">
                    In Stock
                  </span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm text-red-600 font-medium">
                    Sold Out
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Product Form */}
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 border-t border-b border-border py-6">
            <div className="flex flex-col items-center text-center gap-2">
              <TruckIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <PackageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">2 Year Warranty</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RotateCcwIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Easy Returns</span>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-widest uppercase">
              Product Details
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Premium quality materials</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Designed for maximum comfort</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Sustainable manufacturing process</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Available in multiple sizes</span>
              </li>
            </ul>
          </div>
        </div>

        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      </div>

      {/* Related Products */}
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <Await resolve={relatedProducts}>
          {([recommendationsData, fallbackData]) => {
            const recommendations = recommendationsData?.productRecommendations || [];
            const fallbackProducts = fallbackData?.products?.nodes || [];

            // Combine recommendations with fallback products, filtering out the current product
            const allProducts = [...recommendations];
            const currentProductId = product.id;

            // Add fallback products to fill up to 4 slots
            for (const fallbackProduct of fallbackProducts) {
              if (allProducts.length >= 4) break;
              // Don't add the current product or duplicates
              if (
                fallbackProduct.id !== currentProductId &&
                !allProducts.find(p => p.id === fallbackProduct.id)
              ) {
                allProducts.push(fallbackProduct);
              }
            }

            // Always show exactly 4 products
            const displayProducts = allProducts.slice(0, 4);

            return <RelatedProducts products={displayProducts} />;
          }}
        </Await>
      </Suspense>
    </div>
  );
}

function RelatedProducts({
  products,
}: {
  products: any[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="border-t border-border pt-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-widest uppercase">
          You May Also Like
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductItem
            key={product.id}
            product={product}
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}

function RelatedProductsSkeleton() {
  return (
    <section className="border-t border-border pt-16">
      <div className="mb-8">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((key) => (
          <div key={key} className="space-y-4">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    </section>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query ProductRecommendations(
    $productId: ID!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
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
  }
` as const;

const FALLBACK_PRODUCTS_QUERY = `#graphql
  query FallbackProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: BEST_SELLING) {
      nodes {
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
    }
  }
` as const;
