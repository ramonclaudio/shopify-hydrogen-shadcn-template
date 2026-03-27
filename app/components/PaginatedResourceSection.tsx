import { Pagination } from '@shopify/hydrogen';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';

/**
 * <PaginatedResourceSection > is a component that encapsulate how the previous and next behaviors throughout your application.
 */
export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  resourcesClassName,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{ node: NodesType; index: number }>;
  resourcesClassName?: string;
}) {
  return (
    <Pagination connection={connection}>
      {({ nodes, isLoading, PreviousLink, NextLink }) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({ node, index }),
        ) as React.ReactNode[];

        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Button variant="outline" asChild disabled={isLoading}>
                <PreviousLink>
                  {isLoading ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronUpIcon className="h-4 w-4 mr-2" />
                      Load previous
                    </>
                  )}
                </PreviousLink>
              </Button>
            </div>
            {resourcesClassName ? (
              <div className={resourcesClassName}>{resourcesMarkup}</div>
            ) : (
              <>{resourcesMarkup}</>
            )}
            <div className="flex justify-center">
              <Button variant="outline" asChild disabled={isLoading}>
                <NextLink>
                  {isLoading ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load more
                      <ChevronDownIcon className="h-4 w-4 ml-2" />
                    </>
                  )}
                </NextLink>
              </Button>
            </div>
          </div>
        );
      }}
    </Pagination>
  );
}
