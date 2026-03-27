import {Image, Money} from '@shopify/hydrogen';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import {ExternalLink, MapPin, Package} from 'lucide-react';
import {redirect, useLoaderData} from 'react-router';
import {AspectRatio} from '~/components/ui/aspect-ratio';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';
import type {Route} from './+types/account.orders.$id';

export const meta: Route.MetaFunction = ({data}: {data: any}) => {
  return [{title: `Order ${data?.order?.name}`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors}: {data: OrderQuery; errors?: Array<{message: string}>} =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<
          typeof firstDiscount,
          {__typename: 'MoneyV2'}
        >)
      : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (
          firstDiscount as Extract<
            typeof firstDiscount,
            {__typename: 'PricingPercentageValue'}
          >
        ).percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Order {order.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Placed on {new Date(order.processedAt!).toDateString()}
              </p>
              {order.confirmationNumber && (
                <p className="text-sm text-muted-foreground">
                  Confirmation: {order.confirmationNumber}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="self-start sm:self-auto">
              {fulfillmentStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((lineItem: OrderLineItemFullFragment) => (
                <OrderLineRow key={lineItem.id} lineItem={lineItem} />
              ))}
            </TableBody>
            <TableFooter>
              {((discountValue && discountValue.amount) ||
                discountPercentage) && (
                <TableRow>
                  <TableCell colSpan={3}>Discounts</TableCell>
                  <TableCell className="text-right">
                    {discountPercentage ? (
                      <span className="text-green-600 font-medium">
                        -{discountPercentage}% OFF
                      </span>
                    ) : (
                      discountValue && <Money data={discountValue!} />
                    )}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3}>Subtotal</TableCell>
                <TableCell className="text-right">
                  <Money data={order.subtotal!} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3}>Tax</TableCell>
                <TableCell className="text-right">
                  <Money data={order.totalTax!} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  <Money data={order.totalPrice!} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order?.shippingAddress ? (
              <address className="not-italic text-sm space-y-1">
                <p className="font-medium">{order.shippingAddress.name}</p>
                {order.shippingAddress.formatted && (
                  <p className="text-muted-foreground">
                    {order.shippingAddress.formatted}
                  </p>
                )}
                {order.shippingAddress.formattedArea && (
                  <p className="text-muted-foreground">
                    {order.shippingAddress.formattedArea}
                  </p>
                )}
              </address>
            ) : (
              <p className="text-muted-foreground text-sm">
                No shipping address defined
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="outline" className="text-base px-3 py-1">
                {fulfillmentStatus}
              </Badge>
            </div>
            <Button asChild className="w-full" variant="outline">
              <a target="_blank" href={order.statusPageUrl} rel="noreferrer">
                View Order Status
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OrderLineRow({lineItem}: {lineItem: OrderLineItemFullFragment}) {
  return (
    <TableRow key={lineItem.id}>
      <TableCell>
        <div className="flex items-center gap-4">
          {lineItem?.image && (
            <div className="flex-shrink-0 w-16 h-16">
              <AspectRatio ratio={1}>
                <Image
                  data={lineItem.image}
                  className="h-full w-full object-cover rounded"
                />
              </AspectRatio>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium">{lineItem.title}</p>
            {lineItem.variantTitle && (
              <p className="text-sm text-muted-foreground">
                {lineItem.variantTitle}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Money data={lineItem.price!} />
      </TableCell>
      <TableCell className="text-right">{lineItem.quantity}</TableCell>
      <TableCell className="text-right">
        <Money data={lineItem.totalDiscount!} />
      </TableCell>
    </TableRow>
  );
}
