import cn from 'classnames';
import AuthorCard from '@/components/ui/author-card';
import Logo from '@/components/ui/logo';
import { MenuItem } from '@/components/ui/collapsible-menu';
import Scrollbar from '@/components/ui/scrollbar';
import Button from '@/components/ui/button';
import { useDrawer } from '@/components/drawer-views/context';
import { Close } from '@/components/icons/close';
import { menuItems } from '@/layouts/sidebar/_menu-items';
//images
import AuthorImage from '@/assets/images/author.jpg';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import ActiveLink from '@/components/ui/links/active-link';
import { PowerIcon } from '@/components/icons/power';
import { useAccessToken } from '@/lib/hooks/use-token';

export default function Sidebar({ className }: { className?: string }) {
  const { closeDrawer } = useDrawer();
  const session = useSession()
  const supabaseClient = useSupabaseClient()
  const supabase = useSupabaseClient()
  const router = useRouter();
  const { setAccessToken } = useAccessToken();

  async function signOut() {
    // const { error } = await supabase.auth.signOut()
     router.push("/login");
    setAccessToken(false) 
  }

  return (
    <aside
      className={cn(
        'top-0 z-40 h-full w-full max-w-full border-dashed border-gray-200 bg-body ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l dark:border-gray-700 dark:bg-dark xs:w-80 xl:fixed  xl:w-72 2xl:w-80',
        className
      )}
    >
      <div className="relative flex h-24 items-center justify-between overflow-hidden px-6 py-4 2xl:px-8">
        <Logo />
        <div className="md:hidden">
          <Button
            title="Close"
            color="white"
            shape="circle"
            variant="transparent"
            size="small"
            onClick={closeDrawer}
          >
            <Close className="h-auto w-2.5" />
          </Button>
        </div>
      </div>

      <Scrollbar style={{ height: 'calc(100% - 96px)' }}>
        <div className="px-6 pb-5 2xl:px-8">

          <div className="">
            {menuItems.map((item, index) => (
              <MenuItem
                key={'default' + item.name + index}
                name={item.name}
                href={item.href}
                icon={item.icon}
                dropdownItems={item.dropdownItems}
              />

            ))}

            <div
              className={cn(
                'relative flex h-12 cursor-pointer items-center justify-between whitespace-nowrap  rounded-lg px-4 text-sm transition-all',
                'text-gray-500 hover:text-brand dark:hover:text-white'
              )}
              onClick={() => signOut()}
            >
              <span className="z-[1] flex items-center ltr:mr-3 rtl:ml-3">
                <span className={cn('ltr:mr-3 rtl:ml-3')}><PowerIcon /></span>
                Sign Out
              </span>
            </div>
          </div>
        </div>
        {/* <li onClick={(signOut)}>Sign Out</li> */}
      </Scrollbar>
    </aside>
  );
}
