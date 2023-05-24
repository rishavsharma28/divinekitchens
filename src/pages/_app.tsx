import type { AppProps } from 'next/app';
import type { NextPageWithLayout } from '@/types';
// import { Fira_Code } from '@next/font/google';
import Head from 'next/head';
import { ThemeProvider } from 'next-themes';
import DrawersContainer from '@/components/drawer-views/container';
import SettingsButton from '@/components/settings/settings-button';
import SettingsDrawer from '@/components/settings/settings-drawer';
import 'overlayscrollbars/css/OverlayScrollbars.css';
import { useState } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react'
import CheckSessionProvider from "../lib/provider/checkSessionProvider";
import TailwindToaster from '@/components/ui/toast';
// base css file
import 'swiper/css';
import '@/assets/css/scrollbar.css';
import '@/assets/css/globals.css';
import '@/assets/css/range-slider.css';

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
  // initialSession: Session;
};

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {

  // const [supabase] = useState(() => createBrowserSupabaseClient())
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        {/* maximum-scale 1 meta tag need to prevent ios input focus auto zooming */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1 maximum-scale=1"
        />
        <title>Divine Kitchens</title>
      </Head>
      {/* <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}> */}
      <ThemeProvider
        attribute="class"
        enableSystem={false}
        defaultTheme="light"
        enableColorScheme={false}
      >
        <CheckSessionProvider />
        {getLayout(<Component {...pageProps} />)}
        <TailwindToaster />
        <SettingsButton />
        {/* <SettingsDrawer /> */}
        <DrawersContainer />
        {/* </div> */}
      </ThemeProvider>
      {/* </SessionContextProvider> */}
    </>
  );
}

export default CustomApp;
