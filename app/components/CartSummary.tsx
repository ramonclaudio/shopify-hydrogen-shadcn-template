import { CartForm, Money, type OptimisticCart } from '@shopify/hydrogen';
import type { MoneyV2, AppliedGiftCard } from '@shopify/hydrogen/storefront-api-types';
import { XIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FetcherWithComponents } from 'react-router';
import { Link, useFetcher } from 'react-router';
import type { CartApiQueryFragment } from 'storefrontapi.generated';
import type { CartLayout } from '~/components/CartMain';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({ cart, layout }: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  return (
    <div aria-labelledby="cart-summary" className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center text-lg">
        <span className="font-medium">Subtotal</span>
        <span className="font-semibold">
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart?.cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </span>
      </div>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
      {layout === 'aside' && (
        <Button variant="outline" className="w-full" asChild>
          <Link to="/collections">Continue Shopping</Link>
        </Button>
      )}
      {layout === 'page' && (
        <>
          <Separator />
          <CartDiscounts discountCodes={cart?.discountCodes} />
          <CartGiftCard giftCardCodes={cart?.appliedGiftCards} />
        </>
      )}
    </div>
  );
}

function CartCheckoutActions({ checkoutUrl }: { checkoutUrl?: string }) {
  if (!checkoutUrl) return null;

  return (
    <Button asChild className="w-full" size="lg">
      <a href={checkoutUrl} target="_self">
        Checkout
      </a>
    </Button>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount: {code: string; applicable: boolean}) => discount.applicable)
      ?.map(({ code }: {code: string; applicable: boolean}) => code) || [];

  return (
    <div className="space-y-3">
      {/* Have existing discount, display it with a remove option */}
      {codes.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2">Applied Discounts</Label>
          <UpdateDiscountForm>
            <div className="flex flex-wrap gap-2 mt-2">
              {codes.map((code) => (
                <Badge key={code} variant="secondary" className="gap-1">
                  {code}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    type="submit"
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </UpdateDiscountForm>
        </div>
      )}

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="space-y-2">
          <Label htmlFor="discountCode">Discount Code</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              id="discountCode"
              name="discountCode"
              placeholder="Enter code"
              className="flex-1"
            />
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </div>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartGiftCard({
  giftCardCodes,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
}) {
  const appliedGiftCardCodes = useRef<string[]>([]);
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const giftCardAddFetcher = useFetcher({ key: 'gift-card-add' });

  // Clear the gift card code input after the gift card is added
  useEffect(() => {
    if (giftCardAddFetcher.data) {
      giftCardCodeInput.current!.value = '';
    }
  }, [giftCardAddFetcher.data]);

  function saveAppliedCode(code: string) {
    const formattedCode = code.replace(/\s/g, ''); // Remove spaces
    if (!appliedGiftCardCodes.current.includes(formattedCode)) {
      appliedGiftCardCodes.current.push(formattedCode);
    }
  }

  return (
    <div className="space-y-3">
      {/* Display applied gift cards with individual remove buttons */}
      {giftCardCodes && giftCardCodes.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2">Applied Gift Cards</Label>
          <div className="space-y-2 mt-2">
            {giftCardCodes.map((giftCard: Pick<AppliedGiftCard, 'id' | 'lastCharacters'> & {amountUsed: Pick<MoneyV2, 'currencyCode' | 'amount'>}) => (
              <RemoveGiftCardForm key={giftCard.id} giftCardId={giftCard.id}>
                <div className="flex items-center justify-between p-2 rounded-md border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">***{giftCard.lastCharacters}</Badge>
                    <span className="text-sm font-medium">
                      <Money data={giftCard.amountUsed} />
                    </span>
                  </div>
                  <Button type="submit" variant="ghost" size="sm">
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </RemoveGiftCardForm>
            ))}
          </div>
        </div>
      )}

      {/* Show an input to apply a gift card */}
      <UpdateGiftCardForm
        giftCardCodes={appliedGiftCardCodes.current}
        saveAppliedCode={saveAppliedCode}
        fetcherKey="gift-card-add"
      >
        <div className="space-y-2">
          <Label htmlFor="giftCardCode">Gift Card Code</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              id="giftCardCode"
              name="giftCardCode"
              placeholder="Enter gift card code"
              ref={giftCardCodeInput}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={giftCardAddFetcher.state !== 'idle'}
            >
              Apply
            </Button>
          </div>
        </div>
      </UpdateGiftCardForm>
    </div>
  );
}

function UpdateGiftCardForm({
  giftCardCodes,
  saveAppliedCode,
  fetcherKey,
  children,
}: {
  giftCardCodes?: string[];
  saveAppliedCode?: (code: string) => void;
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesUpdate}
      inputs={{
        giftCardCodes: giftCardCodes || [],
      }}
    >
      {(fetcher: FetcherWithComponents<any>) => {
        const code = fetcher.formData?.get('giftCardCode');
        if (code && saveAppliedCode) {
          saveAppliedCode(code as string);
        }
        return children;
      }}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  children,
}: {
  giftCardId: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {children}
    </CartForm>
  );
}
