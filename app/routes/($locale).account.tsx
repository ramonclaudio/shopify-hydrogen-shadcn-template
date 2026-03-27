import {LogOut, MapPin, Package, User} from 'lucide-react';
import {
  Form,
  NavLink,
  Outlet,
  data as remixData,
  useLoaderData,
} from 'react-router';
import {Button} from '~/components/ui/button';
import {Card, CardContent} from '~/components/ui/card';
import {Separator} from '~/components/ui/separator';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {cn} from '~/lib/utils';
import type {Route} from './+types/account';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `Welcome to your account.`
    : 'Account Details';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">{heading}</h1>
        <p className="text-muted-foreground">
          Manage your orders, profile, and account settings
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <AccountMenu />
        </CardContent>
      </Card>
      <Outlet context={{customer}} />
    </div>
  );
}

function AccountMenu() {
  const menuItems = [
    {to: '/account/orders', label: 'Orders', icon: Package},
    {to: '/account/profile', label: 'Profile', icon: User},
    {to: '/account/addresses', label: 'Addresses', icon: MapPin},
  ];

  return (
    <nav
      role="navigation"
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
    >
      {menuItems.map((item, index) => (
        <div key={item.to} className="flex items-center">
          <NavLink to={item.to} className="flex-1 sm:flex-initial">
            {({isActive, isPending}) => (
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full sm:w-auto justify-start',
                  isPending && 'opacity-50',
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            )}
          </NavLink>
          {index < menuItems.length - 1 && (
            <Separator
              orientation="vertical"
              className="hidden sm:block h-8 mx-2"
            />
          )}
        </div>
      ))}
      <Separator orientation="vertical" className="hidden sm:block h-8 mx-2" />
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form
      method="POST"
      action="/account/logout"
      className="flex-1 sm:flex-initial"
    >
      <Button
        type="submit"
        variant="ghost"
        className="w-full sm:w-auto justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>
    </Form>
  );
}
