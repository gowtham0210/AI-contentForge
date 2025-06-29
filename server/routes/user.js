import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Content from '../models/Content.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Update user profile
router.put('/profile',
  auth,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('company').optional().trim()
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

      const updates = {};
      const allowedFields = ['name', 'email', 'company'];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
);

// Update user preferences
router.put('/preferences',
  auth,
  [
    body('defaultLanguage').optional().isString(),
    body('defaultTone').optional().isIn(['professional', 'casual', 'technical', 'friendly', 'authoritative']),
    body('defaultLength').optional().isString(),
    body('autoSave').optional().isBoolean(),
    body('emailNotifications').optional().isBoolean()
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

      const updates = {};
      Object.keys(req.body).forEach(key => {
        updates[`preferences.${key}`] = req.body[key];
      });

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: user.preferences,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences',
        error: error.message
      });
    }
  }
);

// Update AI settings
router.put('/ai-settings',
  auth,
  [
    body('apiKey').optional().isString(),
    body('provider').optional().isIn(['openai', 'anthropic', 'google']),
    body('model').optional().isString(),
    body('creativity').optional().isIn(['conservative', 'balanced', 'creative']),
    body('includeImages').optional().isBoolean(),
    body('seoOptimization').optional().isBoolean()
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

      const updates = {};
      Object.keys(req.body).forEach(key => {
        updates[`aiSettings.${key}`] = req.body[key];
      });

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: user.aiSettings,
        message: 'AI settings updated successfully'
      });
    } catch (error) {
      logger.error('Update AI settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update AI settings',
        error: error.message
      });
    }
  }
);

// Get user dashboard stats
router.get('/stats',
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      // Get content stats
      const contentStats = await Content.aggregate([
        { $match: { user: req.user.id } },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            totalWords: { $sum: '$metadata.wordCount' },
            avgSeoScore: { $avg: '$seo.score' },
            totalViews: { $sum: '$analytics.views' }
          }
        }
      ]);

      const stats = contentStats[0] || {
        totalPosts: 0,
        totalWords: 0,
        avgSeoScore: 0,
        totalViews: 0
      };

      // Get recent activity
      const recentContent = await Content.find({ user: req.user.id })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title status updatedAt metadata.wordCount');

      res.json({
        success: true,
        data: {
          user: {
            name: user.name,
            email: user.email,
            subscription: user.subscription,
            usage: user.usage
          },
          stats: {
            totalPosts: stats.totalPosts,
            totalWords: stats.totalWords,
            avgGenerationTime: 42, // Mock data
            avgSeoScore: Math.round(stats.avgSeoScore || 0)
          },
          recentContent
        }
      });
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user stats',
        error: error.message
      });
    }
  }
);

export default router;