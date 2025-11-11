import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.NODE_ENV === 'production'
      ? process.env.DATABASE_URL
      : process.env.DIRECT_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
}));