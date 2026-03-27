import {Image} from '@shopify/hydrogen';
import {HeartIcon} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import type {
  CollectionItemFragment,
  ProductItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {AspectRatio} from '~/components/ui/aspect-ratio';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {cn} from '~/lib/utils';
import {useVariantUrl} from '~/lib/variants';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const isAvailable = product.availableForSale;
  const {open} = useAside();
  const variantSelectorRef = useRef<HTMLDivElement>(null);

  // Get variants and options
  const variants = 'variants' in product ? product.variants?.nodes || [] : [];
  const options = 'options' in product ? product.options || [] : [];

  // Get primary collection for category label
  const collections =
    'collections' in product ? product.collections?.nodes || [] : [];
  const primaryCollection =
    collections.find((c: {id: string; title: string; handle: string}) =>
      ['women', 'men', 'kids', 'accessories'].includes(c.handle.toLowerCase()),
    ) || collections[0];
  const categoryLabel = primaryCollection?.title.toUpperCase() || 'SHOP';

  // State for selected options
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    // Initialize with first available variant's options
    const firstAvailableVariant =
      variants.find(
        (v: {
          id: string;
          title: string;
          availableForSale: boolean;
          selectedOptions: Array<{name: string; value: string}>;
          price: {amount: string; currencyCode: string};
        }) => v.availableForSale,
      ) || variants[0];
    if (!firstAvailableVariant) return {};

    return firstAvailableVariant.selectedOptions.reduce(
      (acc: Record<string, string>, option: {name: string; value: string}) => {
        acc[option.name] = option.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  });

  // State for showing variant selector
  const [showVariantSelector, setShowVariantSelector] = useState(false);

  // Find the currently selected variant based on selected options
  const selectedVariant =
    variants.find(
      (variant: {
        id: string;
        title: string;
        availableForSale: boolean;
        selectedOptions: Array<{name: string; value: string}>;
        price: {amount: string; currencyCode: string};
      }) =>
        variant.selectedOptions.every(
          (option: {name: string; value: string}) =>
            selectedOptions[option.name] === option.value,
        ),
    ) || variants[0];

  const hasMultipleVariants = variants.length > 1;

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasMultipleVariants && !showVariantSelector) {
      // Show variant selector if there are multiple variants
      setShowVariantSelector(true);
    } else if (!hasMultipleVariants) {
      // If only one variant, add directly to cart
      // The AddToCartButton will handle this
    }
  };

  // Handle click outside to close variant selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        variantSelectorRef.current &&
        !variantSelectorRef.current.contains(event.target as Node)
      ) {
        setShowVariantSelector(false);
      }
    };

    if (showVariantSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showVariantSelector]);

  return (
    <div className="group">
      <Link prefetch="intent" to={variantUrl} className="cursor-pointer block">
        <AspectRatio
          ratio={3 / 4}
          className="mb-4 overflow-hidden relative rounded-none"
        >
          <div
            className={cn(
              'absolute inset-0 transition-all duration-500',
              !isAvailable &&
                'grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100',
            )}
          >
            {image && (
              <Image
                alt={image.altText || product.title}
                aspectRatio="3/4"
                data={image}
                loading={loading}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </div>

          {/* Out of Stock Badge */}
          {!isAvailable && (
            <Badge
              variant="destructive"
              className="absolute top-2 right-2 font-bold z-10 text-[10px] px-2 py-0.5"
            >
              SOLD OUT
            </Badge>
          )}
        </AspectRatio>
      </Link>

      <div className="space-y-3" ref={variantSelectorRef}>
        <Link prefetch="intent" to={variantUrl}>
          <div>
            <h3 className="text-sm font-semibold tracking-wide hover:underline truncate">
              {product.title}
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
              {categoryLabel}
            </p>
          </div>
        </Link>

        {/* Variant Options - Slide Down Animation */}
        <div
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            showVariantSelector && hasMultipleVariants
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="py-4 space-y-4">
              {hasMultipleVariants &&
                options.map(
                  (option: {
                    name: string;
                    optionValues: Array<{name: string}>;
                  }) => (
                    <div key={option.name} className="space-y-2">
                      <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                        {option.name}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {option.optionValues.map((value: {name: string}) => {
                          const isSelected =
                            selectedOptions[option.name] === value.name;
                          // Check if this option value exists in any variant
                          const variantWithOption = variants.find(
                            (v: {
                              id: string;
                              title: string;
                              availableForSale: boolean;
                              selectedOptions: Array<{
                                name: string;
                                value: string;
                              }>;
                              price: {amount: string; currencyCode: string};
                            }) =>
                              v.selectedOptions.some(
                                (o: {name: string; value: string}) =>
                                  o.name === option.name &&
                                  o.value === value.name,
                              ),
                          );
                          const isOptionAvailable =
                            variantWithOption?.availableForSale || false;

                          return (
                            <Button
                              key={value.name}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                'text-xs h-7 px-2',
                                !isOptionAvailable &&
                                  'opacity-50 cursor-not-allowed',
                              )}
                              disabled={!isOptionAvailable}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOptionChange(option.name, value.name);
                              }}
                            >
                              {value.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ),
                )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tracking-wide">
            $
            {selectedVariant
              ? Math.floor(parseFloat(selectedVariant.price.amount))
              : Math.floor(
                  parseFloat(product.priceRange.minVariantPrice.amount),
                )}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Add to wishlist functionality
              }}
            >
              <HeartIcon className="h-4 w-4" />
            </Button>
            {hasMultipleVariants && showVariantSelector ? (
              <AddToCartButton
                disabled={!selectedVariant?.availableForSale}
                onClick={() => {
                  open('cart');
                  setShowVariantSelector(false);
                }}
                lines={
                  selectedVariant
                    ? [
                        {
                          merchandiseId: selectedVariant.id,
                          quantity: 1,
                          selectedVariant: {
                            id: selectedVariant.id,
                            title: selectedVariant.title,
                            availableForSale: selectedVariant.availableForSale,
                            price: selectedVariant.price,
                            selectedOptions: selectedVariant.selectedOptions,
                          },
                        },
                      ]
                    : []
                }
                variant="outline"
                size="sm"
                className="text-xs font-semibold tracking-widest uppercase"
              >
                {selectedVariant?.availableForSale ? 'ADD TO CART' : 'SOLD OUT'}
              </AddToCartButton>
            ) : hasMultipleVariants ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold tracking-widest uppercase"
                onClick={handleAddToCartClick}
                disabled={!isAvailable}
              >
                {isAvailable ? 'ADD TO CART' : 'SOLD OUT'}
              </Button>
            ) : selectedVariant ? (
              <AddToCartButton
                disabled={!selectedVariant.availableForSale}
                onClick={() => {
                  open('cart');
                }}
                lines={[
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                    selectedVariant: {
                      id: selectedVariant.id,
                      title: selectedVariant.title,
                      availableForSale: selectedVariant.availableForSale,
                      price: selectedVariant.price,
                      selectedOptions: selectedVariant.selectedOptions,
                    },
                  },
                ]}
                variant="outline"
                size="sm"
                className="text-xs font-semibold tracking-widest uppercase"
              >
                {selectedVariant.availableForSale ? 'ADD TO CART' : 'SOLD OUT'}
              </AddToCartButton>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold tracking-widest uppercase"
                disabled
              >
                UNAVAILABLE
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
