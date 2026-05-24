// src/config/clerk.ts
import { createClerkClient } from '@clerk/express';
import { env } from './env';

/**
 * Clerk client instance for server-side operations (user lookup, token verification).
 */
export const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
});

export default clerkClient;
