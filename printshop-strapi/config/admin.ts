export default ({ env }: { env: (key: string, defaultValue?: string) => string }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  // Use the public URL for admin panel
  url: env('PUBLIC_URL', 'http://localhost:1337') + '/admin',
  serveAdminPanel: true,
  watchIgnoreFiles: [
    '**/config/sync/**',
  ],
});
