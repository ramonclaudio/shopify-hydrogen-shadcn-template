import type { CustomerAddressInput } from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type Fetcher,
} from 'react-router';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  CREATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  UPDATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';
import type { Route } from './+types/account.addresses';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Addresses' }];
};

export async function loader({ context }: Route.LoaderArgs) {
  context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const { customerAccount } = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        { error: { [addressId]: 'Unauthorized' } },
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const { data, errors } = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              { error: { [addressId]: error.message } },
              {
                status: 400,
              },
            );
          }
          return data(
            { error: { [addressId]: error } },
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const { data, errors } = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              { error: { [addressId]: error.message } },
              {
                status: 400,
              },
            );
          }
          return data(
            { error: { [addressId]: error } },
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const { data, errors } = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return { error: null, deletedAddress: addressId };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              { error: { [addressId]: error.message } },
              {
                status: 400,
              },
            );
          }
          return data(
            { error: { [addressId]: error } },
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          { error: { [addressId]: 'Method not allowed' } },
          {
            status: 405,
          },
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return data(
        { error: error.message },
        {
          status: 400,
        },
      );
    }
    return data(
      { error },
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const { customer } = useOutletContext<{ customer: CustomerFragment }>();
  const { defaultAddress, addresses } = customer;

  return (
    <div className="space-y-8">
      {!addresses.nodes.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              You have no addresses saved.
            </p>
            <NewAddressForm />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NewAddressForm />
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">Saved Addresses</h2>
            <ExistingAddresses
              addresses={addresses}
              defaultAddress={defaultAddress}
            />
          </div>
        </>
      )}
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  } as CustomerAddressInput;

  return (
    <AddressForm
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
    >
      {({ stateForMethod }) => (
        <Button
          disabled={stateForMethod('POST') !== 'idle'}
          formMethod="POST"
          type="submit"
          size="lg"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {stateForMethod('POST') !== 'idle' ? 'Creating Address...' : 'Create Address'}
        </Button>
      )}
    </AddressForm>
  );
}

function ExistingAddresses({
  addresses,
  defaultAddress,
}: Pick<CustomerFragment, 'addresses' | 'defaultAddress'>) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {addresses.nodes.map((address: (typeof addresses.nodes)[number]) => (
        <Card key={address.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {address.firstName} {address.lastName}
              </CardTitle>
              {defaultAddress?.id === address.id && (
                <Badge>Default</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AddressForm
              addressId={address.id}
              address={address}
              defaultAddress={defaultAddress}
            >
              {({ stateForMethod }) => (
                <div className="flex gap-2">
                  <Button
                    disabled={stateForMethod('PUT') !== 'idle'}
                    formMethod="PUT"
                    type="submit"
                    className="flex-1"
                  >
                    {stateForMethod('PUT') !== 'idle' ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    disabled={stateForMethod('DELETE') !== 'idle'}
                    formMethod="DELETE"
                    type="submit"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </AddressForm>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  }) => React.ReactNode;
}) {
  const { state, formMethod } = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  return (
    <Form id={addressId} className="space-y-4">
      <input type="hidden" name="addressId" defaultValue={addressId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`firstName-${addressId}`}>First name*</Label>
          <Input
            id={`firstName-${addressId}`}
            name="firstName"
            autoComplete="given-name"
            defaultValue={address?.firstName ?? ''}
            placeholder="First name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`lastName-${addressId}`}>Last name*</Label>
          <Input
            id={`lastName-${addressId}`}
            name="lastName"
            autoComplete="family-name"
            defaultValue={address?.lastName ?? ''}
            placeholder="Last name"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`company-${addressId}`}>Company</Label>
        <Input
          id={`company-${addressId}`}
          name="company"
          autoComplete="organization"
          defaultValue={address?.company ?? ''}
          placeholder="Company"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`address1-${addressId}`}>Address line 1*</Label>
        <Input
          id={`address1-${addressId}`}
          name="address1"
          autoComplete="address-line1"
          defaultValue={address?.address1 ?? ''}
          placeholder="Street address"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`address2-${addressId}`}>Address line 2</Label>
        <Input
          id={`address2-${addressId}`}
          name="address2"
          autoComplete="address-line2"
          defaultValue={address?.address2 ?? ''}
          placeholder="Apartment, suite, etc. (optional)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`city-${addressId}`}>City*</Label>
          <Input
            id={`city-${addressId}`}
            name="city"
            autoComplete="address-level2"
            defaultValue={address?.city ?? ''}
            placeholder="City"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`zoneCode-${addressId}`}>State/Province*</Label>
          <Input
            id={`zoneCode-${addressId}`}
            name="zoneCode"
            autoComplete="address-level1"
            defaultValue={address?.zoneCode ?? ''}
            placeholder="State"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`zip-${addressId}`}>Postal Code*</Label>
          <Input
            id={`zip-${addressId}`}
            name="zip"
            autoComplete="postal-code"
            defaultValue={address?.zip ?? ''}
            placeholder="ZIP"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`territoryCode-${addressId}`}>Country Code*</Label>
          <Input
            id={`territoryCode-${addressId}`}
            name="territoryCode"
            autoComplete="country"
            defaultValue={address?.territoryCode ?? ''}
            placeholder="US"
            required
            maxLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`phoneNumber-${addressId}`}>Phone</Label>
          <Input
            id={`phoneNumber-${addressId}`}
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            defaultValue={address?.phoneNumber ?? ''}
            placeholder="+1 (613) 555-1111"
            pattern="^\+?[1-9]\d{3,14}$"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id={`defaultAddress-${addressId}`}
          name="defaultAddress"
          defaultChecked={isDefaultAddress}
        />
        <Label
          htmlFor={`defaultAddress-${addressId}`}
          className="text-sm font-normal cursor-pointer"
        >
          Set as default address
        </Label>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}
