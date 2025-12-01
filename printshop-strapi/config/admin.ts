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
  // Allow admin panel access from the public URL
  url: '/admin',
  serveAdminPanel: true,
  // Disable host check for reverse proxy
  watchIgnoreFiles: [
    '**/config/sync/**',
  ],
});
