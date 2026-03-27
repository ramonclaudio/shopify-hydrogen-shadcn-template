import { CartForm, useOptimisticCart, type OptimisticCartLine } from '@shopify/hydrogen';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';
import type { CartApiQueryFragment } from 'storefrontapi.generated';
import { useAside } from '~/components/Aside';
import { CartLineItem } from '~/components/CartLineItem';
import { Button } from '~/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty';
import { CartSummary } from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null | undefined;
  layout: CartLayout;
};

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({ layout, cart: originalCart }: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code: {code: string; applicable: boolean}) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;

  return (
    <div className={`${className} flex flex-col h-full`}>
      <CartEmpty hidden={linesCount} layout={layout} />
      {linesCount && (
        <>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div aria-labelledby="cart-lines" className="space-y-0">
              {(cart?.lines?.nodes ?? []).map((line: OptimisticCartLine<CartApiQueryFragment>) => (
                <CartLineItem key={line.id} line={line} layout={layout} />
              ))}
            </div>
            {cartHasItems && cart?.lines?.nodes && cart.lines.nodes.length > 0 && (
              <div className="border-t">
                <CartClearButton lineIds={cart.lines.nodes.map((line: OptimisticCartLine<CartApiQueryFragment>) => line.id)} />
              </div>
            )}
          </div>
          {cartHasItems && (
            <div className="mt-auto border-t p-4 flex-shrink-0">
              <CartSummary cart={cart} layout={layout} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const { close } = useAside();
  return (
    <Empty hidden={hidden}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShoppingBag />
        </EmptyMedia>
        <EmptyTitle>Your cart is empty</EmptyTitle>
        <EmptyDescription>
          Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
          started!
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="default">
          <Link to="/collections" onClick={close} prefetch="viewport">
            Continue Shopping
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function CartClearButton({ lineIds }: { lineIds: string[] }) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds }}
    >
      <Button
        type="submit"
        variant="ghost"
        className="w-full text-muted-foreground hover:text-foreground py-6"
      >
        Clear cart
      </Button>
    </CartForm>
  );
}
