import { useLoaderData } from 'react-router';
import { Card, CardContent } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import type { Route } from './+types/pages.$handle';

export const meta: Route.MetaFunction = ({ data }: { data: any }) => {
  return [{ title: `Hydrogen | ${data?.page.title ?? ''}` }];
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
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{ page }] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', { status: 404 });
  }

  redirectIfHandleIsLocalized(request, { handle: params.handle, data: page });

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const { page } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              {page.title}
            </h1>
          </div>

          <Separator />

          <div
            dangerouslySetInnerHTML={{ __html: page.body }}
            className="prose prose-slate max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
              prose-p:text-base prose-p:leading-7
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:shadow-md
              prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-muted prose-pre:border
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:italic
              prose-ul:list-disc prose-ol:list-decimal"
          />
        </CardContent>
      </Card>
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
