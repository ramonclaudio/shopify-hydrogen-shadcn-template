import { Image, getPaginationVariables } from '@shopify/hydrogen';
import { Calendar, User } from 'lucide-react';
import { Link, useLoaderData } from 'react-router';
import type { ArticleItemFragment } from 'storefrontapi.generated';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { AspectRatio } from '~/components/ui/aspect-ratio';
import { Card, CardContent } from '~/components/ui/card';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import type { Route } from './+types/blogs.$blogHandle._index';

export const meta: Route.MetaFunction = ({ data }: { data: any }) => {
  return [{ title: `Hydrogen | ${data?.blog.title ?? ''} blog` }];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return { ...deferredData, ...criticalData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({ context, request, params }: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  if (!params.blogHandle) {
    throw new Response(`blog not found`, { status: 404 });
  }

  const [{ blog }] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', { status: 404 });
  }

  redirectIfHandleIsLocalized(request, { handle: params.blogHandle, data: blog });

  return { blog };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}

export default function Blog() {
  const { blog } = useLoaderData<typeof loader>();
  const { articles } = blog;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {blog.title}
        </h1>
        {blog.seo?.description && (
          <p className="text-lg text-muted-foreground">
            {blog.seo.description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaginatedResourceSection<ArticleItemFragment> connection={articles}>
          {({ node: article, index }) => (
            <ArticleItem
              article={article}
              key={article.id}
              loading={index < 2 ? 'eager' : 'lazy'}
            />
          )}
        </PaginatedResourceSection>
      </div>
    </div>
  );
}

function ArticleItem({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  const publishedAt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt!));
  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      className="group"
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full">
        <CardContent className="p-0">
          {article.image && (
            <AspectRatio ratio={3 / 2}>
              <Image
                alt={article.image.altText || article.title}
                data={article.image}
                loading={loading}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </AspectRatio>
          )}
        </CardContent>
        <CardContent className="space-y-3">
          <h3 className="text-xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={article.publishedAt!}>{publishedAt}</time>
            </div>
            {article.author?.name && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>{article.author.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          hasNextPage
          endCursor
          startCursor
        }

      }
    }
  }
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
  }
` as const;
