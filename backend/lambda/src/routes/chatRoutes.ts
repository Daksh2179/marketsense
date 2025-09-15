import express from 'express';
import { chatController } from '../controllers/chatController';

const router = express.Router();

/**
 * @route   POST /chat/message
 * @desc    Handle chatbot conversation
 * @body    { message: string, context?: { currentStock?, currentPage?, portfolioSummary?, recentNews? } }
 */
router.post('/message', chatController.handleChatMessage);

/**
 * @route   GET /chat/status
 * @desc    Get chatbot health and capabilities
 */
router.get('/status', chatController.getChatbotStatus);

/**
 * @route   GET /chat/starters
 * @desc    Get suggested conversation starters based on context
 * @query   currentStock?, currentPage?
 */
router.get('/starters', chatController.getConversationStarters);

export default router;