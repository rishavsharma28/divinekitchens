import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import RootLayout from '@/layouts/_root-layout';

const SingleBlogPage: NextPageWithLayout = () => {

  return (
    <>
      <NextSeo
        title="Divine Kitchens"
        description=""
      />
    </>
  );
};

SingleBlogPage.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};

export default SingleBlogPage;