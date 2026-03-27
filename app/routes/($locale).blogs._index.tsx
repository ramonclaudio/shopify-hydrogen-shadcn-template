import {getPaginationVariables} from '@shopify/hydrogen';
import {ArrowRight, BookOpen} from 'lucide-react';
import {Link, useLoaderData} from 'react-router';
import type {BlogsQuery} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {Button} from '~/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import type {Route} from './+types/blogs._index';

type BlogNode = BlogsQuery['blogs']['nodes'][0];

export const meta: Route.MetaFunction = () => {
  return [{title: `Hydrogen | Blogs`}];
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
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 10,
  });

  const [{blogs}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {blogs};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blogs() {
  const {blogs} = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Blogs</h1>
        <p className="text-lg text-muted-foreground">
          Explore our latest articles and stories
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PaginatedResourceSection<BlogNode> connection={blogs}>
          {({node: blog}) => (
            <Card
              key={blog.handle}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {blog.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {blog.seo?.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {blog.seo.description}
                  </p>
                )}
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link to={`/blogs/${blog.handle}`} prefetch="intent">
                    View Articles
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </PaginatedResourceSection>
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
      }
    }
  }
` as const;
