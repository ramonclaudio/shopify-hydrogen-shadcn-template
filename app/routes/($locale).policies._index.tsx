import {ArrowRight, FileText} from 'lucide-react';
import {Link, useLoaderData} from 'react-router';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';
import {Button} from '~/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import type {Route} from './+types/policies._index';

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Policies
        </h1>
        <p className="text-lg text-muted-foreground">
          Review our store policies and terms
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {policies.map((policy) => (
          <Card
            key={policy.id}
            className="group hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">
                {policy.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link to={`/policies/${policy.handle}`}>
                  Read Policy
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
