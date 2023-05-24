import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import cn from 'classnames';
import LogoIcon from '@/components/ui/logo-icon';
import { useWindowScroll } from '@/lib/hooks/use-window-scroll';
import Hamburger from '@/components/ui/hamburger';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useDrawer } from '@/components/drawer-views/context';
import routes from '@/config/routes';
import Button from '@/components/ui/button';

function NotificationButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [setting, setSetting] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const response = await fetch('/api/supabase/settings/single').then(
        (res) => res.json()
      );
      if (response.data) {
        setSetting(response.data);
      }
    };

    fetchSettings();
  }, []);

  const callGenerateEndpoint = async () => {
    console.log('Calling OpenAI...');
    const url = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_XERO_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_XERO_REDIRECT_URI}&scope=openid offline_access accounting.transactions accounting.settings accounting.attachments accounting.contacts accounting.transactions accounting.contacts.read`;
    window.location.href = url;
  };

  return (
    <>
      {setting ? (
        <Button
          onClick={callGenerateEndpoint}
          shape="rounded"
          className=" mt-4 inline-block rounded-lg border px-4 py-2 text-lg font-medium text-white"
        >
          Reconnect Xero
        </Button>
      ) : (
        <Button
          onClick={callGenerateEndpoint}
          shape="rounded"
          className=" mt-4 inline-block rounded-lg border px-4 py-2 text-lg font-medium text-white"
        >
          Connect Xero
        </Button>
      )}
    </>
  );
}

function HeaderRightArea() {
  return (
    <div className="relative order-last flex shrink-0 items-center gap-4 sm:gap-6 lg:gap-8">
      <NotificationButton />
    </div>
  );
}

export default function Header({ className }: { className?: string }) {
  const router = useRouter();
  const isMounted = useIsMounted();
  const { openDrawer } = useDrawer();
  const windowScroll = useWindowScroll();

  return (
    <nav
      className={cn(
        'sticky top-0 z-30 h-16 w-full transition-all duration-300 ltr:right-0 rtl:left-0 sm:h-20 3xl:h-24',
        (isMounted && windowScroll.y) > 2
          ? 'bg-gradient-to-b from-white to-white/80 shadow-card backdrop-blur dark:from-dark dark:to-dark/80'
          : '',
        className
      )}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8 3xl:px-10">
        <div className="flex items-center">
          <div
            onClick={() => router.push(routes.home)}
            className="flex items-center xl:hidden"
          >
            <LogoIcon />
          </div>
          <div className="mx-2 block sm:mx-4 xl:hidden">
            <Hamburger
              isOpen={false}
              variant="transparent"
              onClick={() => openDrawer('DASHBOARD_SIDEBAR')}
              className="dark:text-white"
            />
          </div>
        </div>
        <HeaderRightArea />
      </div>
    </nav>
  );
}
