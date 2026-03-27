import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '~/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * A side bar component with Overlay using shadcn Sheet
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  description,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
  description?: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const isOpen = type === activeType;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine sheet direction based on type and screen size
  const getSide = (): 'top' | 'right' | 'bottom' | 'left' => {
    if (type === 'mobile') return 'right'; // mobile menu always from right
    if (type === 'cart') {
      return isMobile ? 'bottom' : 'right'; // cart from bottom on mobile, right on desktop
    }
    return 'right';
  };

  // Use Drawer for cart on mobile, Sheet otherwise
  if (type === 'cart' && isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => !open && close()}
        direction="bottom"
      >
        <DrawerContent className="gap-0 p-0 flex flex-col max-h-[95vh]">
          <DrawerHeader className="border-b flex-shrink-0 text-center">
            <DrawerTitle>{heading}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side={getSide()}
        className={`gap-0 p-0 flex flex-col ${
          type === 'cart' && !isMobile ? 'md:max-w-md' : ''
        }`}
      >
        <SheetHeader
          className={`border-b flex-shrink-0 ${type === 'cart' ? 'text-left space-y-2 py-6' : 'text-left py-6'}`}
        >
          <SheetTitle>{heading}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
