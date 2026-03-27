import {type MappedProductOptions} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {Heart, ShoppingBag} from 'lucide-react';
import {Link, useNavigate} from 'react-router';
import type {ProductFragment} from 'storefrontapi.generated';
import {Button} from '~/components/ui/button';
import {Label} from '~/components/ui/label';
import {cn} from '~/lib/utils';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  return (
    <div className="space-y-6">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <div key={option.name} className="space-y-3">
            <Label className="text-sm font-semibold tracking-widest uppercase">
              {option.name}
            </Label>
            <div className="flex flex-wrap gap-2">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Button
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      asChild
                      key={option.name + name}
                      className={cn(!available && 'opacity-50')}
                    >
                      <Link
                        prefetch="intent"
                        preventScrollReset
                        replace
                        to={`/products/${handle}?${variantUriQuery}`}
                      >
                        <ProductOptionSwatch swatch={swatch} name={name} />
                      </Link>
                    </Button>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <Button
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      type="button"
                      key={option.name + name}
                      className={cn(!available && 'opacity-50')}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            open('cart');
          }}
          lines={
            selectedVariant
              ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                    selectedVariant,
                  },
                ]
              : []
          }
          className="w-full uppercase gap-3 tracking-wider"
          size="lg"
        >
          <ShoppingBag className="h-5 w-5" />
          {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
        </AddToCartButton>
        <Button variant="outline" size="lg" type="button">
          <Heart className="h-5 w-5" />
          <span className="sr-only">Add to wishlist</span>
        </Button>
      </div>
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return <span>{name}</span>;

  return (
    <div className="flex items-center gap-2">
      <div
        aria-label={name}
        className={cn(
          'h-6 w-6 rounded-full border-2 border-border',
          image && 'p-0',
        )}
        style={{
          backgroundColor: color || 'transparent',
        }}
      >
        {!!image && (
          <img
            src={image}
            alt={name}
            className="h-full w-full rounded-full object-cover"
          />
        )}
      </div>
      <span className="text-sm">{name}</span>
    </div>
  );
}
