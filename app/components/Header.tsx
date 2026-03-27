import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import { HeartIcon, MenuIcon, SearchIcon, ShoppingBag, UserIcon } from 'lucide-react';
import { Suspense, useEffect, useId, useRef, useState } from 'react';
import { Await, NavLink, useAsyncValue } from 'react-router';
import type { CartApiQueryFragment, HeaderQuery } from 'storefrontapi.generated';
import { useAside } from '~/components/Aside';
import { ModeToggle } from '~/components/mode-toggle';
import { SearchFormPredictive } from '~/components/SearchFormPredictive';
import { SearchResultsPredictive } from '~/components/SearchResultsPredictive';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const { shop, menu } = header;

  // Use Shopify brand logo if it exists, otherwise fallback to shop name
  const logoUrl = shop.brand?.logo?.image?.url;

  return (
    <header className="px-4 sm:px-6 md:px-8 py-4 md:py-6 border-b border-border">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <NavLink
          prefetch="intent"
          to="/"
          end
          className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={shop.name}
              className="h-8 md:h-10 w-auto"
            />
          ) : (
            <strong className="text-xl md:text-2xl font-bold tracking-tight">
              {shop.name}
            </strong>
          )}
        </NavLink>
        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const { close } = useAside();

  const navClassName =
    viewport === 'desktop'
      ? 'hidden md:flex items-center gap-x-8'
      : 'flex flex-col space-y-1';

  // Progressive hiding breakpoints for each menu item (from right to left)
  const getItemBreakpoint = (index: number, total: number) => {
    if (viewport !== 'desktop') return '';

    // Hide items progressively: last item first, first item last
    const reverseIndex = total - 1 - index;

    switch (reverseIndex) {
      case 0: // Last item (About) - hide first at 980px
        return 'max-[980px]:hidden';
      case 1: // Third item (Policies) - hide at 900px
        return 'max-[900px]:hidden';
      case 2: // Second item (Blog) - hide at 820px
        return 'max-[820px]:hidden';
      case 3: // First item (Collections) - stays visible until md breakpoint (768px)
        return '';
      default:
        return '';
    }
  };

  const menuItems = (menu || FALLBACK_HEADER_MENU).items;

  return (
    <nav className={navClassName} role="navigation">
      {menuItems.map((item: {id: string; url?: string | null; title: string}, index: number) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        const breakpointClass = getItemBreakpoint(index, menuItems.length);

        return (
          <NavLink
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
            className={
              viewport === 'desktop'
                ? `text-xs font-semibold tracking-widest uppercase hover:text-muted-foreground transition-colors whitespace-nowrap ${breakpointClass}`
                : 'text-sm font-semibold tracking-widest uppercase py-3 hover:text-muted-foreground transition-colors'
            }
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <div className="flex items-center gap-x-2 sm:gap-x-3 lg:gap-x-6 flex-shrink-0" role="navigation">
      <SearchBar />
      <MobileSearchToggle />
      <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:flex" asChild>
        <NavLink prefetch="intent" to="/account/wishlist">
          <HeartIcon className="h-5 w-5" />
          <span className="sr-only">Wishlist</span>
        </NavLink>
      </Button>
      <CartToggle cart={cart} />
      <ModeToggle />
      <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:flex" asChild>
        <NavLink prefetch="intent" to="/account">
          <UserIcon className="h-5 w-5" />
          <span className="sr-only">
            <Suspense fallback="Account">
              <Await resolve={isLoggedIn} errorElement="Account">
                {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
              </Await>
            </Suspense>
          </span>
        </NavLink>
      </Button>
      <HeaderMenuMobileToggle />
    </div>
  );
}

function HeaderMenuMobileToggle() {
  const { open } = useAside();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden h-8 w-8"
      onClick={() => open('mobile')}
    >
      <MenuIcon className="h-5 w-5" />
      <span className="sr-only">Menu</span>
    </Button>
  );
}

function MobileSearchToggle() {
  const { open } = useAside();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="sm:hidden h-8 w-8"
      onClick={() => open('mobile')}
    >
      <SearchIcon className="h-5 w-5" />
      <span className="sr-only">Search</span>
    </Button>
  );
}

function SearchBar() {
  const queriesDatalistId = useId();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="hidden sm:block relative group" ref={searchContainerRef}>
      <SearchFormPredictive>
        {({ fetchResults, goToSearch, inputRef }) => {
          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            fetchResults(e);
            setIsSearchOpen(!!e.target.value);
          };

          const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            fetchResults(e as any);
            setIsSearchOpen(!!e.target.value);
          };

          return (
            <div className="flex items-center border border-border bg-muted px-4 py-2 hover:bg-accent transition-colors rounded-md">
              <SearchIcon className="mr-3 size-4 text-muted-foreground shrink-0" />
              <Input
                name="q"
                onChange={handleChange}
                onFocus={handleFocus}
                placeholder="SEARCH"
                ref={inputRef}
                type="search"
                className="w-24 h-auto border-0 bg-transparent p-0 text-xs font-mono tracking-wider shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          );
        }}
      </SearchFormPredictive>

      {/* Predictive search results dropdown - wider and better positioned */}
      {isSearchOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 w-[400px]">
          <SearchResultsPredictive>
            {({ items, total, term, state, closeSearch }) => {
              const handleClose = () => {
                closeSearch();
                setIsSearchOpen(false);
              };

              return (
                <SearchResults
                  items={items}
                  total={total}
                  term={term}
                  state={state}
                  closeSearch={handleClose}
                  queriesDatalistId={queriesDatalistId}
                  searchContainerRef={searchContainerRef}
                />
              );
            }}
          </SearchResultsPredictive>
        </div>
      )}
    </div>
  );
}

function SearchResults({
  items,
  total,
  term,
  state,
  closeSearch,
  queriesDatalistId,
  searchContainerRef,
}: {
  items: any;
  total: number;
  term: React.MutableRefObject<string>;
  state: string;
  closeSearch: () => void;
  queriesDatalistId: string;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Handle click outside to close search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        closeSearch();
      }
    }

    if (term.current) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeSearch, searchContainerRef]);

  // Don't show anything if there's no search term
  if (!term.current) {
    return null;
  }

  if (state === 'loading') {
    return (
      <div className="bg-popover border rounded-md p-4 shadow-lg">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!total) {
    return (
      <div className="bg-popover border rounded-md p-4 shadow-lg">
        <SearchResultsPredictive.Empty term={term} />
      </div>
    );
  }

  return (
    <div className="bg-popover border rounded-md p-4 shadow-lg max-h-[500px] overflow-y-auto space-y-4">
      <SearchResultsPredictive.Queries
        queries={items.queries}
        queriesDatalistId={queriesDatalistId}
      />
      <SearchResultsPredictive.Products
        products={items.products}
        closeSearch={closeSearch}
        term={term}
      />
      <SearchResultsPredictive.Collections
        collections={items.collections}
        closeSearch={closeSearch}
        term={term}
      />
      <SearchResultsPredictive.Pages
        pages={items.pages}
        closeSearch={closeSearch}
        term={term}
      />
      <SearchResultsPredictive.Articles
        articles={items.articles}
        closeSearch={closeSearch}
        term={term}
      />
    </div>
  );
}

function CartBadge({ count }: { count: number | null }) {
  const { open } = useAside();
  const { publish, shop, cart, prevCart } = useAnalytics();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-8 w-8"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      <ShoppingBag className="h-5 w-5" />
      {count !== null && count > 0 && (
        <Badge
          variant="default"
          className="absolute -right-1 -top-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
      <span className="sr-only">
        Cart {count === null ? '' : `(${count} items)`}
      </span>
    </Button>
  );
}

function CartToggle({ cart }: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/0',
  items: [
    {
      id: 'gid://shopify/MenuItem/1',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/2',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/3',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/4',
      resourceId: 'gid://shopify/Page/1',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};
