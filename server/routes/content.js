import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import Content from '../models/Content.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all content for user
router.get('/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status').optional().isIn(['generating', 'draft', 'completed', 'published']),
    query('search').optional().isString()
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

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let query = { user: req.user.id };
      
      if (req.query.status) {
        query.status = req.query.status;
      }

      if (req.query.search) {
        query.$text = { $search: req.query.search };
      }

      const content = await Content.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-content'); // Don't return full content in list

      const total = await Content.countDocuments(query);

      res.json({
        success: true,
        data: {
          content,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content',
        error: error.message
      });
    }
  }
);

// Get single content by ID
router.get('/:id',
  auth,
  async (req, res) => {
    try {
      const content = await Content.findOne({
        _id: req.params.id,
        user: req.user.id
      });

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      // Increment view count
      content.analytics.views += 1;
      await content.save();

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Get content by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content',
        error: error.message
      });
    }
  }
);

// Update content
router.put('/:id',
  auth,
  [
    body('title').optional().isString().trim(),
    body('content').optional().isString(),
    body('status').optional().isIn(['draft', 'completed']),
    body('seo.keywords').optional().isArray(),
    body('seo.metaDescription').optional().isString()
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

      const content = await Content.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Update content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update content',
        error: error.message
      });
    }
  }
);

// Delete content
router.delete('/:id',
  auth,
  async (req, res) => {
    try {
      const content = await Content.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
      });

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      res.json({
        success: true,
        message: 'Content deleted successfully'
      });
    } catch (error) {
      logger.error('Delete content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete content',
        error: error.message
      });
    }
  }
);

// Get content analytics
router.get('/:id/analytics',
  auth,
  async (req, res) => {
    try {
      const content = await Content.findOne({
        _id: req.params.id,
        user: req.user.id
      }).select('analytics title createdAt');

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      res.json({
        success: true,
        data: content.analytics
      });
    } catch (error) {
      logger.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  }
);

// Duplicate content
router.post('/:id/duplicate',
  auth,
  async (req, res) => {
    try {
      const originalContent = await Content.findOne({
        _id: req.params.id,
        user: req.user.id
      });

      if (!originalContent) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      const duplicatedContent = new Content({
        ...originalContent.toObject(),
        _id: undefined,
        title: `${originalContent.title} (Copy)`,
        status: 'draft',
        createdAt: undefined,
        updatedAt: undefined,
        analytics: {
          views: 0,
          shares: 0,
          engagement: 0
        },
        wordpress: {}
      });

      await duplicatedContent.save();

      res.json({
        success: true,
        data: duplicatedContent
      });
    } catch (error) {
      logger.error('Duplicate content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate content',
        error: error.message
      });
    }
  }
);

export default router;