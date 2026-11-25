// Reads secrets from environment variables. Nothing secret is written in code.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Add it to .env (local) or to the Vercel project settings (live).`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

export const config = {
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  isProd: process.env.NODE_ENV === 'production',
};
