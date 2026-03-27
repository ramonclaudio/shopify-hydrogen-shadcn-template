import {Image, Money} from '@shopify/hydrogen';
import React, {useEffect, useRef} from 'react';
import {Link, useFetcher, type Fetcher} from 'react-router';
import type {PredictiveSearchQuery} from 'storefrontapi.generated';
import {AspectRatio} from '~/components/ui/aspect-ratio';
import {Badge} from '~/components/ui/badge';
import {Separator} from '~/components/ui/separator';
import {
  getEmptyPredictiveSearchResult,
  urlWithTrackingParams,
  type PredictiveSearchReturn,
} from '~/lib/search';
import {useAside} from './Aside';

type PredictiveItems = NonNullable<PredictiveSearchQuery['predictiveSearch']>;

type PredictiveSearchItems = PredictiveSearchReturn['result']['items'];

type UsePredictiveSearchReturn = {
  term: React.MutableRefObject<string>;
  total: number;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  items: PredictiveSearchItems;
  fetcher: Fetcher<PredictiveSearchReturn>;
};

type SearchResultsPredictiveArgs = Pick<
  UsePredictiveSearchReturn,
  'term' | 'total' | 'inputRef' | 'items'
> & {
  state: Fetcher['state'];
  closeSearch: () => void;
};

type PartialPredictiveSearchResult<
  ItemType extends keyof PredictiveSearchItems,
  ExtraProps extends keyof SearchResultsPredictiveArgs = 'term' | 'closeSearch',
> = Pick<PredictiveSearchItems, ItemType> &
  Pick<SearchResultsPredictiveArgs, ExtraProps>;

type SearchResultsPredictiveProps = {
  children: (args: SearchResultsPredictiveArgs) => React.ReactNode;
};

/**
 * Component that renders predictive search results
 */
export function SearchResultsPredictive({
  children,
}: SearchResultsPredictiveProps) {
  const aside = useAside();
  const {term, inputRef, fetcher, total, items} = usePredictiveSearch();

  /*
   * Utility that resets the search input
   */
  function resetInput() {
    if (inputRef.current) {
      inputRef.current.blur();
      inputRef.current.value = '';
    }
  }

  /**
   * Utility that resets the search input and closes the search aside
   */
  function closeSearch() {
    resetInput();
    aside.close();
  }

  return children({
    items,
    closeSearch,
    inputRef,
    state: fetcher.state,
    term,
    total,
  });
}

SearchResultsPredictive.Articles = SearchResultsPredictiveArticles;
SearchResultsPredictive.Collections = SearchResultsPredictiveCollections;
SearchResultsPredictive.Pages = SearchResultsPredictivePages;
SearchResultsPredictive.Products = SearchResultsPredictiveProducts;
SearchResultsPredictive.Queries = SearchResultsPredictiveQueries;
SearchResultsPredictive.Empty = SearchResultsPredictiveEmpty;

function SearchResultsPredictiveArticles({
  term,
  articles,
  closeSearch,
}: PartialPredictiveSearchResult<'articles'>) {
  if (!articles.length) return null;

  return (
    <div className="space-y-3" key="articles">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold text-sm text-muted-foreground">
          Articles
        </h5>
        <Badge variant="secondary" className="text-xs">
          {articles.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {articles.map((article: PredictiveItems['articles'][number]) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.blog.handle}/${article.handle}`,
            trackingParams: article.trackingParameters,
            term: term.current ?? '',
          });

          return (
            <Link
              key={article.id}
              onClick={closeSearch}
              to={articleUrl}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {article.image?.url && (
                <div className="flex-shrink-0 w-12 h-12">
                  <AspectRatio ratio={1}>
                    <Image
                      alt={article.image.altText ?? ''}
                      src={article.image.url}
                      className="h-full w-full object-cover rounded"
                    />
                  </AspectRatio>
                </div>
              )}
              <span className="text-sm truncate">{article.title}</span>
            </Link>
          );
        })}
      </div>
      <Separator />
    </div>
  );
}

function SearchResultsPredictiveCollections({
  term,
  collections,
  closeSearch,
}: PartialPredictiveSearchResult<'collections'>) {
  if (!collections.length) return null;

  return (
    <div className="space-y-3" key="collections">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold text-sm text-muted-foreground">
          Collections
        </h5>
        <Badge variant="secondary" className="text-xs">
          {collections.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {collections.map(
          (collection: PredictiveItems['collections'][number]) => {
            const collectionUrl = urlWithTrackingParams({
              baseUrl: `/collections/${collection.handle}`,
              trackingParams: collection.trackingParameters,
              term: term.current,
            });

            return (
              <Link
                key={collection.id}
                onClick={closeSearch}
                to={collectionUrl}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {collection.image?.url && (
                  <div className="flex-shrink-0 w-12 h-12">
                    <AspectRatio ratio={1}>
                      <Image
                        alt={collection.image.altText ?? ''}
                        src={collection.image.url}
                        className="h-full w-full object-cover rounded"
                      />
                    </AspectRatio>
                  </div>
                )}
                <span className="text-sm truncate">{collection.title}</span>
              </Link>
            );
          },
        )}
      </div>
      <Separator />
    </div>
  );
}

function SearchResultsPredictivePages({
  term,
  pages,
  closeSearch,
}: PartialPredictiveSearchResult<'pages'>) {
  if (!pages.length) return null;

  return (
    <div className="space-y-3" key="pages">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold text-sm text-muted-foreground">Pages</h5>
        <Badge variant="secondary" className="text-xs">
          {pages.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {pages.map((page: PredictiveItems['pages'][number]) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term: term.current,
          });

          return (
            <Link
              key={page.id}
              onClick={closeSearch}
              to={pageUrl}
              className="block p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <span className="text-sm truncate">{page.title}</span>
            </Link>
          );
        })}
      </div>
      <Separator />
    </div>
  );
}

function SearchResultsPredictiveProducts({
  term,
  products,
  closeSearch,
}: PartialPredictiveSearchResult<'products'>) {
  if (!products.length) return null;

  return (
    <div className="space-y-3" key="products">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold text-sm text-muted-foreground">
          Products
        </h5>
        <Badge variant="secondary" className="text-xs">
          {products.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {products.map((product: PredictiveItems['products'][number]) => {
          const productUrl = urlWithTrackingParams({
            baseUrl: `/products/${product.handle}`,
            trackingParams: product.trackingParameters,
            term: term.current,
          });

          const price = product?.selectedOrFirstAvailableVariant?.price;
          const image = product?.selectedOrFirstAvailableVariant?.image;
          return (
            <Link
              key={product.id}
              to={productUrl}
              onClick={closeSearch}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {image && (
                <div className="flex-shrink-0 w-12 h-12">
                  <AspectRatio ratio={1}>
                    <Image
                      alt={image.altText ?? ''}
                      src={image.url}
                      className="h-full w-full object-cover rounded"
                      sizes="48px"
                    />
                  </AspectRatio>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.title}</p>
                {price && (
                  <div className="text-xs text-muted-foreground">
                    <Money data={price} />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <Separator />
    </div>
  );
}

function SearchResultsPredictiveQueries({
  queries,
  queriesDatalistId,
}: PartialPredictiveSearchResult<'queries', never> & {
  queriesDatalistId: string;
}) {
  if (!queries.length) return null;

  return (
    <datalist id={queriesDatalistId}>
      {queries.map((suggestion: PredictiveItems['queries'][number]) => {
        if (!suggestion) return null;

        return <option key={suggestion.text} value={suggestion.text} />;
      })}
    </datalist>
  );
}

function SearchResultsPredictiveEmpty({
  term,
}: {
  term: React.MutableRefObject<string>;
}) {
  if (!term.current) {
    return null;
  }

  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">
        No results found for <q className="font-medium">{term.current}</q>
      </p>
    </div>
  );
}

/**
 * Hook that returns the predictive search results and fetcher and input ref.
 * @example
 * '''ts
 * const { items, total, inputRef, term, fetcher } = usePredictiveSearch();
 * '''
 **/
function usePredictiveSearch(): UsePredictiveSearchReturn {
  const fetcher = useFetcher<PredictiveSearchReturn>({key: 'search'});
  const term = useRef<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (fetcher?.state === 'loading') {
    term.current = String(fetcher.formData?.get('q') || '');
  }

  // capture the search input element as a ref
  useEffect(() => {
    if (!inputRef.current) {
      inputRef.current = document.querySelector('input[type="search"]');
    }
  }, []);

  const {items, total} =
    fetcher?.data?.result ?? getEmptyPredictiveSearchResult();

  return {items, total, inputRef, term, fetcher};
}
