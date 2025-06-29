import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { auth } from '../middleware/auth.js';
import { DocumentProcessor } from '../services/documentProcessor.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', req.user.id);
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 5
  }
});

// Upload documents
router.post('/',
  auth,
  upload.array('documents', 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const documentProcessor = new DocumentProcessor();
      const processedFiles = [];

      for (const file of req.files) {
        try {
          const extractedText = await documentProcessor.extractText(file.path, file.mimetype);
          
          processedFiles.push({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimeType: file.mimetype,
            extractedText: extractedText.substring(0, 10000) // Limit to 10k chars
          });
        } catch (error) {
          logger.error(`Failed to process file ${file.originalname}:`, error);
          // Remove the file if processing failed
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error('Failed to remove file:', unlinkError);
          }
        }
      }

      res.json({
        success: true,
        data: processedFiles,
        message: `${processedFiles.length} files processed successfully`
      });
    } catch (error) {
      logger.error('File upload error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error('Failed to remove file:', unlinkError);
          }
        }
      }

      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: error.message
      });
    }
  }
);

// Get uploaded files for user
router.get('/',
  auth,
  async (req, res) => {
    try {
      const uploadPath = path.join(process.cwd(), 'uploads', req.user.id);
      
      try {
        const files = await fs.readdir(uploadPath);
        const fileStats = await Promise.all(
          files.map(async (filename) => {
            const filePath = path.join(uploadPath, filename);
            const stats = await fs.stat(filePath);
            return {
              filename,
              size: stats.size,
              uploadedAt: stats.birthtime,
              path: `/uploads/${req.user.id}/${filename}`
            };
          })
        );

        res.json({
          success: true,
          data: fileStats
        });
      } catch (error) {
        // Directory doesn't exist or is empty
        res.json({
          success: true,
          data: []
        });
      }
    } catch (error) {
      logger.error('Get files error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch files',
        error: error.message
      });
    }
  }
);

// Delete uploaded file
router.delete('/:filename',
  auth,
  async (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', req.user.id, filename);
      
      await fs.unlink(filePath);
      
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      logger.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: error.message
      });
    }
  }
);

export default router;