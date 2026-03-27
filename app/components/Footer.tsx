import {Suspense} from 'react';
import {Await} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  // Use Shopify brand logo if it exists, otherwise fallback to shop name
  const logoUrl = header.shop.brand?.logo?.image?.url;

  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer
            className="border-t border-border bg-muted/30 px-8 py-16 animate-slide-up"
            style={{animationDelay: '1100ms'}}
          >
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 flex justify-center">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={header.shop.name}
                    className="h-8 w-auto opacity-40"
                  />
                ) : (
                  <strong className="text-2xl font-bold tracking-tight opacity-40">
                    {header.shop.name}
                  </strong>
                )}
              </div>
              <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
                © {new Date().getFullYear()} {header.shop.name.toUpperCase()},
                INC. ALL RIGHTS RESERVED.
              </p>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}
