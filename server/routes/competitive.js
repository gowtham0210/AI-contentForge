import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { CompetitiveResearchService } from '../services/competitiveResearchService.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Perform web research for competitive analysis
router.post('/research',
  auth,
  [
    body('topic').notEmpty().withMessage('Topic is required')
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

      // Fetch user with AI settings including API key
      const user = await User.findById(req.user.id).select('+aiSettings.apiKey');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { topic } = req.body;
      const researchService = new CompetitiveResearchService();
      
      const competitors = await researchService.performWebResearch(topic);
      
      res.json({
        success: true,
        data: {
          competitors,
          researchedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Web research error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform web research',
        error: error.message
      });
    }
  }
);

// Generate competitive outline based on research
router.post('/generate-outline',
  auth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('competitors').isArray().withMessage('Competitors data is required'),
    body('seoKeywords').optional().isString(),
    body('tone').optional().isString(),
    body('targetAudience').optional().isString()
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

      // Fetch user with AI settings including API key
      const user = await User.findById(req.user.id).select('+aiSettings.apiKey');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const researchService = new CompetitiveResearchService();
      const outline = await researchService.generateCompetitiveOutline(req.body, user);
      
      res.json({
        success: true,
        data: outline
      });
    } catch (error) {
      logger.error('Competitive outline generation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate competitive outline',
        error: error.message
      });
    }
  }
);

// Generate content for a specific section
router.post('/generate-section',
  auth,
  [
    body('title').notEmpty().withMessage('Section title is required'),
    body('description').notEmpty().withMessage('Section description is required'),
    body('wordCount').isInt({ min: 100, max: 2000 }).withMessage('Word count must be between 100-2000'),
    body('tone').notEmpty().withMessage('Tone is required'),
    body('context').isObject().withMessage('Context is required')
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

      // Fetch user with AI settings including API key
      const user = await User.findById(req.user.id).select('+aiSettings.apiKey');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const researchService = new CompetitiveResearchService();
      const content = await researchService.generateSectionContent(req.body, user);
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Section content generation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate section content',
        error: error.message
      });
    }
  }
);

export default router;