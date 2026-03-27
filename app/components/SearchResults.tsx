import {Image, Money, Pagination} from '@shopify/hydrogen';
import {ChevronDownIcon, ChevronUpIcon} from 'lucide-react';
import {Link} from 'react-router';
import type {RegularSearchQuery} from 'storefrontapi.generated';
import {AspectRatio} from '~/components/ui/aspect-ratio';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Spinner} from '~/components/ui/spinner';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';

type SearchProduct = RegularSearchQuery['products']['nodes'][number];

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Articles</CardTitle>
          <Badge variant="secondary">{articles.nodes.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {articles?.nodes?.map(
            (article: RegularSearchQuery['articles']['nodes'][number]) => {
              const articleUrl = urlWithTrackingParams({
                baseUrl: `/blogs/${article.handle}`,
                trackingParams: article.trackingParameters,
                term,
              });

              return (
                <div key={article.id}>
                  <Link
                    prefetch="intent"
                    to={articleUrl}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{article.title}</p>
                  </Link>
                </div>
              );
            },
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pages</CardTitle>
          <Badge variant="secondary">{pages.nodes.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pages?.nodes?.map(
            (page: RegularSearchQuery['pages']['nodes'][number]) => {
              const pageUrl = urlWithTrackingParams({
                baseUrl: `/pages/${page.handle}`,
                trackingParams: page.trackingParameters,
                term,
              });

              return (
                <div key={page.id}>
                  <Link
                    prefetch="intent"
                    to={pageUrl}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{page.title}</p>
                  </Link>
                </div>
              );
            },
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Products</CardTitle>
          <Badge variant="secondary">{products.nodes.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Pagination connection={products}>
          {({nodes, isLoading, NextLink, PreviousLink}) => {
            const ItemsMarkup = nodes.map((product: SearchProduct) => {
              const productUrl = urlWithTrackingParams({
                baseUrl: `/products/${product.handle}`,
                trackingParams: product.trackingParameters,
                term,
              });

              const price = product?.selectedOrFirstAvailableVariant?.price;
              const image = product?.selectedOrFirstAvailableVariant?.image;

              return (
                <Link
                  key={product.id}
                  prefetch="intent"
                  to={productUrl}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  {image && (
                    <div className="flex-shrink-0 w-16 h-16">
                      <AspectRatio ratio={1}>
                        <Image
                          data={image}
                          alt={product.title}
                          className="h-full w-full object-cover rounded"
                        />
                      </AspectRatio>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.title}</p>
                    {price && (
                      <span className="text-sm text-muted-foreground">
                        <Money data={price} />
                      </span>
                    )}
                  </div>
                </Link>
              );
            });

            return (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button variant="outline" asChild disabled={isLoading}>
                    <PreviousLink>
                      {isLoading ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronUpIcon className="h-4 w-4 mr-2" />
                          Load previous
                        </>
                      )}
                    </PreviousLink>
                  </Button>
                </div>
                <div className="space-y-2">{ItemsMarkup}</div>
                <div className="flex justify-center">
                  <Button variant="outline" asChild disabled={isLoading}>
                    <NextLink>
                      {isLoading ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load more
                          <ChevronDownIcon className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </NextLink>
                  </Button>
                </div>
              </div>
            );
          }}
        </Pagination>
      </CardContent>
    </Card>
  );
}

function SearchResultsEmpty() {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No results found. Try a different search term.
        </p>
      </CardContent>
    </Card>
  );
}
