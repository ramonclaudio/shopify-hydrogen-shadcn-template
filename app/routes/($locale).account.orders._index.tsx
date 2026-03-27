import {
  Money,
  flattenConnection,
  getPaginationVariables,
} from '@shopify/hydrogen';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import { ArrowRight, Package, Search, ShoppingBag, X } from 'lucide-react';
import { useRef } from 'react';
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { CUSTOMER_ORDERS_QUERY } from '~/graphql/customer-account/CustomerOrdersQuery';
import {
  ORDER_FILTER_FIELDS,
  buildOrderSearchQuery,
  parseOrderFilters,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import type { Route } from './+types/account.orders._index';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Orders' }];
};

export async function loader({ request, context }: Route.LoaderArgs) {
  const { customerAccount } = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const { data, errors } = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return { customer: data.customer, filters };
}

export default function Orders() {
  const { customer, filters } = useLoaderData<OrdersLoaderData>();
  const { orders } = customer;

  return (
    <div className="space-y-6">
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div className="acccount-orders" aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection<OrderItemFragment> connection={orders}>
          {({ node: order }) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({ hasFilters = false }: { hasFilters?: boolean }) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        {hasFilters ? (
          <>
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6">
              No orders found matching your search criteria.
            </p>
            <Button asChild variant="outline">
              <Link to="/account/orders">
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Link>
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven&apos;t placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button asChild>
              <Link to="/collections">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Start Shopping
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filter Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          aria-label="Search orders"
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="search"
              name={ORDER_FILTER_FIELDS.NAME}
              placeholder="Order #"
              aria-label="Order number"
              defaultValue={currentFilters.name || ''}
            />
            <Input
              type="search"
              name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
              placeholder="Confirmation #"
              aria-label="Confirmation number"
              defaultValue={currentFilters.confirmationNumber || ''}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSearching} className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                disabled={isSearching}
                onClick={() => {
                  setSearchParams(new URLSearchParams());
                  formRef.current?.reset();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function OrderItem({ order }: { order: OrderItemFragment }) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/account/orders/${btoa(order.id)}`}
                className="text-lg font-bold hover:underline"
              >
                #{order.number}
              </Link>
              <Badge variant="secondary">{order.financialStatus}</Badge>
              {fulfillmentStatus && (
                <Badge variant="outline">{fulfillmentStatus}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(order.processedAt).toDateString()}
            </p>
            {order.confirmationNumber && (
              <p className="text-sm text-muted-foreground">
                Confirmation: {order.confirmationNumber}
              </p>
            )}
          </div>
          <Separator orientation="vertical" className="hidden sm:block h-16" />
          <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2">
            <div className="text-right flex-1 sm:flex-initial">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">
                <Money data={order.totalPrice} />
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/account/orders/${btoa(order.id)}`}>
                View Order
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
