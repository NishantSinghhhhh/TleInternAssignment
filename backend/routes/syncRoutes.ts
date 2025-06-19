// backend/src/routes/syncRoutes.ts
import { Router } from 'express'
import {
  getSyncStatus,
  getSyncLogs,
  getUsersSyncStatus,
  runManualSync,
  syncSingleUser,
  updateSyncSettings,
  checkUserHandle
} from '../controllers/syncController'

const router = Router()

router.get    ('/status',         getSyncStatus)
router.get    ('/logs',           getSyncLogs)            // ?limit=…
router.get    ('/users-status',   getUsersSyncStatus)      // ?limit=…
router.post   ('/run',            runManualSync)
router.post   ('/user/:handle',   syncSingleUser)
router.put    ('/settings',       updateSyncSettings)
router.get('/sync/check/:handle', checkUserHandle);

export default router
