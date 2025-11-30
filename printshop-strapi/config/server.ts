export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // Public URL for the server - CRITICAL for admin panel to load correctly
  // This tells Strapi where it's publicly accessible from
  // Without this, the admin panel may fail to load static assets correctly
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  app: {
    keys: env.array('APP_KEYS'),
  },
});
