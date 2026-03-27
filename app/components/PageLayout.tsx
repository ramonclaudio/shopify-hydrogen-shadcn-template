import {SearchIcon} from 'lucide-react';
import {Suspense} from 'react';
import {Await, Link} from 'react-router';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside, useAside} from '~/components/Aside';
import {CartMain} from '~/components/CartMain';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {SearchFormPredictive} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {Input} from '~/components/ui/input';
import {Separator} from '~/components/ui/separator';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <MobileMenuAside
        header={header}
        publicStoreDomain={publicStoreDomain}
        isLoggedIn={isLoggedIn}
      />
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
        />
      )}
      <main className="container mx-auto px-4 py-8">{children}</main>
      <Footer
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
      />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Suspense fallback={<Aside type="cart" heading="Shopping Cart" />}>
      <Await resolve={cart}>
        {(cart) => {
          const itemCount = cart?.totalQuantity || 0;
          const description = `${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart`;

          return (
            <Aside
              type="cart"
              heading="Shopping Cart"
              description={description}
            >
              <CartMain cart={cart} layout="aside" />
            </Aside>
          );
        }}
      </Await>
    </Suspense>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
  isLoggedIn,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
  isLoggedIn: PageLayoutProps['isLoggedIn'];
}) {
  const {close} = useAside();

  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="Menu">
        <nav className="flex-1 overflow-y-auto p-6">
          {/* Search Input with Predictive Results */}
          <div className="relative mb-6">
            <SearchFormPredictive>
              {({fetchResults, goToSearch, inputRef}) => (
                <>
                  <div className="flex items-center border border-border bg-muted px-4 py-2 rounded-md">
                    <SearchIcon className="mr-3 size-4 text-muted-foreground shrink-0" />
                    <Input
                      name="q"
                      onChange={fetchResults}
                      onFocus={fetchResults}
                      placeholder="SEARCH"
                      ref={inputRef}
                      type="search"
                      className="h-auto border-0 bg-transparent p-0 text-xs font-mono tracking-wider shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  {/* Predictive search results */}
                  <div className="mt-2">
                    <SearchResultsPredictive>
                      {({items, total, term, state, closeSearch}) => {
                        if (!term.current) return null;

                        if (state === 'loading') {
                          return (
                            <div className="bg-popover border rounded-md p-4 shadow-lg">
                              <p className="text-sm text-muted-foreground">
                                Loading...
                              </p>
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
                          <div className="bg-popover border rounded-md p-4 shadow-lg max-h-[400px] overflow-y-auto space-y-4">
                            <SearchResultsPredictive.Products
                              products={items.products}
                              closeSearch={() => {
                                closeSearch();
                                close();
                              }}
                              term={term}
                            />
                            <SearchResultsPredictive.Collections
                              collections={items.collections}
                              closeSearch={() => {
                                closeSearch();
                                close();
                              }}
                              term={term}
                            />
                            <SearchResultsPredictive.Pages
                              pages={items.pages}
                              closeSearch={() => {
                                closeSearch();
                                close();
                              }}
                              term={term}
                            />
                            <SearchResultsPredictive.Articles
                              articles={items.articles}
                              closeSearch={() => {
                                closeSearch();
                                close();
                              }}
                              term={term}
                            />
                          </div>
                        );
                      }}
                    </SearchResultsPredictive>
                  </div>
                </>
              )}
            </SearchFormPredictive>
          </div>

          {/* Navigation Links */}
          <HeaderMenu
            menu={header.menu}
            viewport="mobile"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />

          <Separator className="my-6" />

          {/* Additional Links */}
          <div className="flex flex-col space-y-1">
            <Link
              to="/account"
              onClick={close}
              className="text-sm font-semibold tracking-widest uppercase py-3 hover:text-muted-foreground transition-colors"
            >
              <Suspense fallback="Account">
                <Await resolve={isLoggedIn} errorElement="Account">
                  {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
                </Await>
              </Suspense>
            </Link>
            <Link
              to="/account/wishlist"
              onClick={close}
              className="text-sm font-semibold tracking-widest uppercase py-3 hover:text-muted-foreground transition-colors"
            >
              Wishlist
            </Link>
          </div>
        </nav>
      </Aside>
    )
  );
}
