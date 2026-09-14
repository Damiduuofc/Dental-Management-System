import express from 'express';
import { getContacts, getChatHistory, sendMessageRest, markMessagesRead } from '../controllers/messageController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/contacts', getContacts);
router.get('/history/:otherUserId', getChatHistory);
router.put('/read/:otherUserId', markMessagesRead);
router.post('/send', sendMessageRest);

export default router;
