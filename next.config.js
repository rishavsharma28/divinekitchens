/** @type {import('next').NextConfig} */

// const { CronJob } = require('cron');
// const fetch = require('node-fetch');

// new CronJob(
//   '* * * * * *',
//   async function() {
//     try {
//       console.log('GETTING!', process.env.NEXT_PUBLIC_BASE_URL);
//       const response =  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/sync-bills`);
//     } catch (error){
//       console.log(error)
//     }
    
//   }, null, true, 'America/Los_Angeles');

const runtimeCaching = require('next-pwa/cache');
// const { CronJob } = require('cron');
// const fetch = require('node-fetch');
// new CronJob(
//   '*/10 * * * * *',
//   async function () {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/invoiceStatus`);
//       return true;
//     } catch (error) {
//       console.log(error)
//     }
//   }, null, true, 'America/Los_Angeles');

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
});

const nextConfig = withPWA({
  reactStrictMode: true,
  ...(process.env.NODE_ENV === 'production' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
});

module.exports = nextConfig;
