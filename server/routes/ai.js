import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { AIService } from '../services/aiService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Validate API key
router.post('/validate-key', 
  auth,
  [
    body('apiKey').notEmpty().withMessage('API key is required'),
    body('provider').isIn(['openai', 'anthropic', 'google']).withMessage('Invalid provider')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { apiKey, provider } = req.body;
      const aiService = new AIService();
      
      const validation = await aiService.validateApiKey(apiKey, provider);
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      logger.error('API key validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate API key',
        error: error.message
      });
    }
  }
);

// Get available models for provider
router.post('/models',
  auth,
  [
    body('apiKey').notEmpty().withMessage('API key is required'),
    body('provider').isIn(['openai', 'anthropic', 'google']).withMessage('Invalid provider')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { apiKey, provider } = req.body;
      const aiService = new AIService();
      
      const models = await aiService.getAvailableModels(apiKey, provider);
      
      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      logger.error('Get models error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch models',
        error: error.message
      });
    }
  }
);

// Generate content outline
router.post('/generate-outline',
  auth,
  [
    body('topic').notEmpty().withMessage('Topic is required'),
    body('keywords').optional().isString(),
    body('tone').optional().isIn(['professional', 'casual', 'technical', 'friendly', 'authoritative']),
    body('language').optional().isString(),
    body('targetLength').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const aiService = new AIService();
      const outline = await aiService.generateOutline(req.body, req.user);
      
      res.json({
        success: true,
        data: outline
      });
    } catch (error) {
      logger.error('Outline generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate outline',
        error: error.message
      });
    }
  }
);

// Generate full content
router.post('/generate-content',
  auth,
  [
    body('topic').notEmpty().withMessage('Topic is required'),
    body('outline').optional().isString(),
    body('keywords').optional().isString(),
    body('tone').optional().isIn(['professional', 'casual', 'technical', 'friendly', 'authoritative']),
    body('language').optional().isString(),
    body('targetLength').optional().isString(),
    body('uploadedFiles').optional().isArray(),
    body('includeImages').optional().isBoolean(),
    body('seoOptimize').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const aiService = new AIService();
      
      // Start content generation (this will be a long-running process)
      const contentId = await aiService.generateContent(req.body, req.user);
      
      res.json({
        success: true,
        data: {
          contentId,
          message: 'Content generation started'
        }
      });
    } catch (error) {
      logger.error('Content generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start content generation',
        error: error.message
      });
    }
  }
);

// Get generation status
router.get('/generation-status/:contentId',
  auth,
  async (req, res) => {
    try {
      const { contentId } = req.params;
      const aiService = new AIService();
      
      const status = await aiService.getGenerationStatus(contentId, req.user.id);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Generation status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get generation status',
        error: error.message
      });
    }
  }
);

// Generate images for content
router.post('/generate-images',
  auth,
  [
    body('contentId').notEmpty().withMessage('Content ID is required'),
    body('sections').isArray().withMessage('Sections must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { contentId, sections } = req.body;
      const aiService = new AIService();
      
      const images = await aiService.generateImages(contentId, sections, req.user);
      
      res.json({
        success: true,
        data: images
      });
    } catch (error) {
      logger.error('Image generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate images',
        error: error.message
      });
    }
  }
);

// Optimize content for SEO
router.post('/optimize-seo',
  auth,
  [
    body('contentId').notEmpty().withMessage('Content ID is required'),
    body('targetKeywords').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { contentId, targetKeywords } = req.body;
      const aiService = new AIService();
      
      const seoData = await aiService.optimizeForSEO(contentId, targetKeywords, req.user);
      
      res.json({
        success: true,
        data: seoData
      });
    } catch (error) {
      logger.error('SEO optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize for SEO',
        error: error.message
      });
    }
  }
);

export default router;