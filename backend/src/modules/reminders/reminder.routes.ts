// src/modules/reminders/reminder.routes.ts
import { Router } from 'express';
import { ReminderController } from './reminder.controller';

const router = Router();
const reminderController = new ReminderController();

/**
 * GET    /api/v1/reminders         — list all reminders
 * POST   /api/v1/reminders         — create reminder
 * GET    /api/v1/reminders/:id     — get single reminder
 * PUT    /api/v1/reminders/:id     — update reminder
 * DELETE /api/v1/reminders/:id     — delete reminder
 * PATCH  /api/v1/reminders/:id/complete — mark as taken
 */
router.get('/', (req, res) => reminderController.getAll(req, res));
router.post('/', (req, res) => reminderController.create(req, res));
router.get('/history', (req, res) => reminderController.getHistory(req, res));
router.get('/streak', (req, res) => reminderController.getStreak(req, res));
router.get('/:id', (req, res) => reminderController.getById(req, res));
router.put('/:id', (req, res) => reminderController.update(req, res));
router.delete('/:id', (req, res) => reminderController.delete(req, res));
router.patch('/:id/complete', (req, res) => reminderController.markComplete(req, res));

export default router;
