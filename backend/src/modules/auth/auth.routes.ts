// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/v1/auth/sync
 * Upserts authenticated user in local DB — call after Clerk login.
 */
router.post('/sync', (req, res) => authController.syncUser(req, res));

/**
 * GET /api/v1/auth/me
 * Returns current user profile.
 */
router.get('/me', (req, res) => authController.getMe(req, res));

/**
 * DELETE /api/v1/auth/me
 * Deletes the authenticated user account and data.
 */
router.delete('/me', (req, res) => authController.deleteAccount(req, res));

export default router;
