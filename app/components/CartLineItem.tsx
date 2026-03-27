import { CartForm, Image, type OptimisticCartLine } from '@shopify/hydrogen';
import type { CartLineUpdateInput } from '@shopify/hydrogen/storefront-api-types';
import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Link } from 'react-router';
import type { CartApiQueryFragment } from 'storefrontapi.generated';
import type { CartLayout } from '~/components/CartMain';
import { Button } from '~/components/ui/button';
import { useVariantUrl } from '~/lib/variants';
import { useAside } from './Aside';
import { ProductPrice } from './ProductPrice';

type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 */
export function CartLineItem({
  layout,
  line,
}: {
  layout: CartLayout;
  line: CartLine;
}) {
  const { id, merchandise } = line;
  const { product, title, image, selectedOptions } = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const { close } = useAside();

  return (
    <div key={id} className="flex gap-4 p-4 border-b last:border-b-0">
      {image && (
        <Image
          alt={title}
          aspectRatio="1/1"
          data={image}
          height={80}
          loading="lazy"
          width={80}
          className="rounded-lg object-cover flex-shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <Link
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => {
            if (layout === 'aside') {
              close();
            }
          }}
          className="hover:underline"
        >
          <p className="font-medium text-sm">
            {product.title}
          </p>
        </Link>
        {selectedOptions.length > 0 && selectedOptions[0].value !== 'Default Title' && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedOptions.map((option: {name: string; value: string}) => option.value).join(', ')}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <ProductPrice price={line?.cost?.totalAmount} className="font-semibold text-base" />
          <CartLineQuantity line={line} />
        </div>
      </div>
    </div>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 */
function CartLineQuantity({ line }: { line: CartLine }) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const { id: lineId, quantity, isOptimistic } = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0 border rounded-md">
        <CartLineUpdateButton lines={[{ id: lineId, quantity: prevQuantity }]}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || !!isOptimistic}
            type="submit"
            className="h-8 w-8 rounded-r-none hover:bg-muted"
          >
            <MinusIcon className="h-3.5 w-3.5" />
          </Button>
        </CartLineUpdateButton>
        <span className="w-8 text-center text-sm font-medium border-x">{quantity}</span>
        <CartLineUpdateButton lines={[{ id: lineId, quantity: nextQuantity }]}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            disabled={!!isOptimistic}
            type="submit"
            className="h-8 w-8 rounded-l-none hover:bg-muted"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </Button>
        </CartLineUpdateButton>
      </div>
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds }}
    >
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        type="submit"
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        aria-label="Remove item"
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{ lines }}
    >
      {children}
    </CartForm>
  );
}

/**
 * Returns a unique key for the update action. This is used to make sure actions modifying the same line
 * items are not run concurrently, but cancel each other. For example, if the user clicks "Increase quantity"
 * and "Decrease quantity" in rapid succession, the actions will cancel each other and only the last one will run.
 * @param lineIds - line ids affected by the update
 * @returns
 */
function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
