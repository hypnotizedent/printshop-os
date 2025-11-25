/**
 * Time Clock Routes
 * Defines API endpoints for time clock operations
 */

import { Router } from 'express';
import { TimeClockController } from './time-clock.controller';

export function createTimeClockRoutes(): Router {
  const router = Router();
  const controller = new TimeClockController();

  // Time clock operations
  router.post('/time-clock/in', controller.clockIn);
  router.post('/time-clock/out', controller.clockOut);
  router.post('/time-clock/pause', controller.pause);
  router.post('/time-clock/resume', controller.resume);
  router.get('/time-clock/active', controller.getActive);

  // Time entries
  router.post('/time-entries', controller.createEntry);
  router.patch('/time-entries/:id', controller.editEntry);
  router.get('/time-entries', controller.getEntries);
  router.post('/time-entries/:id/approve', controller.approveEdit);

  // Employee summary
  router.get('/employees/:id/time', controller.getEmployeeSummary);

  return router;
}
