import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Content from '../models/Content.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Test WordPress connection
router.post('/test-connection',
  auth,
  [
    body('siteUrl').isURL().withMessage('Valid site URL is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('applicationPassword').notEmpty().withMessage('Application password is required')
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

      const { siteUrl, username, applicationPassword } = req.body;
      
      // Test connection by fetching user info
      const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
      
      const response = await axios.get(`${siteUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: parseInt(process.env.WP_API_TIMEOUT) || 30000
      });

      if (response.status === 200) {
        res.json({
          success: true,
          data: {
            connected: true,
            userInfo: {
              id: response.data.id,
              name: response.data.name,
              roles: response.data.roles
            }
          },
          message: 'WordPress connection successful'
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      logger.error('WordPress connection test error:', error);
      
      let message = 'Failed to connect to WordPress';
      if (error.response?.status === 401) {
        message = 'Invalid credentials';
      } else if (error.response?.status === 403) {
        message = 'Insufficient permissions';
      } else if (error.code === 'ENOTFOUND') {
        message = 'Site not found';
      }

      res.status(400).json({
        success: false,
        message,
        error: error.message
      });
    }
  }
);

// Save WordPress settings
router.post('/settings',
  auth,
  [
    body('siteUrl').isURL().withMessage('Valid site URL is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('applicationPassword').notEmpty().withMessage('Application password is required')
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

      const { siteUrl, username, applicationPassword } = req.body;

      // Test connection first
      const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
      
      await axios.get(`${siteUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: parseInt(process.env.WP_API_TIMEOUT) || 30000
      });

      // Save settings
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            'wordpressSettings.siteUrl': siteUrl,
            'wordpressSettings.username': username,
            'wordpressSettings.applicationPassword': applicationPassword,
            'wordpressSettings.isConnected': true
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        data: {
          siteUrl: user.wordpressSettings.siteUrl,
          username: user.wordpressSettings.username,
          isConnected: user.wordpressSettings.isConnected
        },
        message: 'WordPress settings saved successfully'
      });
    } catch (error) {
      logger.error('Save WordPress settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save WordPress settings',
        error: error.message
      });
    }
  }
);

// Publish content to WordPress
router.post('/publish/:contentId',
  auth,
  [
    body('status').optional().isIn(['draft', 'publish']),
    body('categories').optional().isArray(),
    body('tags').optional().isArray(),
    body('featuredImage').optional().isURL()
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

      const { contentId } = req.params;
      const { status = 'draft', categories = [], tags = [], featuredImage } = req.body;

      // Get content
      const content = await Content.findOne({
        _id: contentId,
        user: req.user.id
      });

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      // Get user WordPress settings
      const user = await User.findById(req.user.id).select('+wordpressSettings.applicationPassword');
      
      if (!user.wordpressSettings.isConnected) {
        return res.status(400).json({
          success: false,
          message: 'WordPress not connected'
        });
      }

      // Prepare post data
      const postData = {
        title: content.title,
        content: content.content,
        status,
        categories,
        tags,
        excerpt: content.seo.metaDescription || '',
        meta: {
          _yoast_wpseo_metadesc: content.seo.metaDescription,
          _yoast_wpseo_focuskw: content.seo.keywords.join(', ')
        }
      };

      if (featuredImage) {
        postData.featured_media = featuredImage;
      }

      // Publish to WordPress
      const auth = Buffer.from(
        `${user.wordpressSettings.username}:${user.wordpressSettings.applicationPassword}`
      ).toString('base64');

      const response = await axios.post(
        `${user.wordpressSettings.siteUrl}/wp-json/wp/v2/posts`,
        postData,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: parseInt(process.env.WP_API_TIMEOUT) || 30000
        }
      );

      // Update content with WordPress info
      content.wordpress = {
        postId: response.data.id,
        url: response.data.link,
        publishedAt: new Date(),
        status: response.data.status
      };
      content.status = 'published';
      await content.save();

      res.json({
        success: true,
        data: {
          wordpressId: response.data.id,
          url: response.data.link,
          status: response.data.status
        },
        message: 'Content published to WordPress successfully'
      });
    } catch (error) {
      logger.error('WordPress publish error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to publish to WordPress',
        error: error.message
      });
    }
  }
);

// Get published posts
router.get('/posts',
  auth,
  async (req, res) => {
    try {
      const publishedContent = await Content.find({
        user: req.user.id,
        'wordpress.postId': { $exists: true }
      })
      .select('title wordpress createdAt metadata analytics')
      .sort({ 'wordpress.publishedAt': -1 });

      res.json({
        success: true,
        data: publishedContent
      });
    } catch (error) {
      logger.error('Get published posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch published posts',
        error: error.message
      });
    }
  }
);

// Disconnect WordPress
router.delete('/disconnect',
  auth,
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(
        req.user.id,
        {
          $unset: {
            'wordpressSettings.siteUrl': '',
            'wordpressSettings.username': '',
            'wordpressSettings.applicationPassword': ''
          },
          $set: {
            'wordpressSettings.isConnected': false
          }
        }
      );

      res.json({
        success: true,
        message: 'WordPress disconnected successfully'
      });
    } catch (error) {
      logger.error('WordPress disconnect error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect WordPress',
        error: error.message
      });
    }
  }
);

export default router;