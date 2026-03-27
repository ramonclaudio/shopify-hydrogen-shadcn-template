import { type Shop } from '@shopify/hydrogen/storefront-api-types';
import { ArrowLeft } from 'lucide-react';
import { Link, useLoaderData } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import type { Route } from './+types/policies.$handle';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

export const meta: Route.MetaFunction = ({ data }: { data: any }) => {
  return [{ title: `Hydrogen | ${data?.policy.title ?? ''}` }];
};

export async function loader({ params, context }: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', { status: 404 });
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('Could not find the policy', { status: 404 });
  }

  return { policy };
}

export default function Policy() {
  const { policy } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/policies">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Policies
        </Link>
      </Button>

      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              {policy.title}
            </h1>
          </div>

          <Separator />

          <div
            dangerouslySetInnerHTML={{ __html: policy.body }}
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

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;
