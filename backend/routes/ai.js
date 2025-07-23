import express from 'express'
import { askKai, processVoiceCommand } from '../controllers/aiController.js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

router.post('/ask', auth, askKai)
router.post('/voice', auth, processVoiceCommand)

export default router