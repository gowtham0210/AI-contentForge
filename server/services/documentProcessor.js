import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '../utils/logger.js';

export class DocumentProcessor {
  async extractText(filePath, mimeType) {
    try {
      const buffer = await fs.readFile(filePath);
      
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromDOCX(buffer);
        case 'text/plain':
          return await this.extractFromTXT(buffer);
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      logger.error('Document processing error:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  async extractFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return this.cleanText(data.text);
    } catch (error) {
      logger.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  async extractFromDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return this.cleanText(result.value);
    } catch (error) {
      logger.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  async extractFromTXT(buffer) {
    try {
      const text = buffer.toString('utf-8');
      return this.cleanText(text);
    } catch (error) {
      logger.error('TXT extraction error:', error);
      throw new Error('Failed to extract text from TXT');
    }
  }

  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim();
  }

  // Extract key information from document
  extractKeyInfo(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keywords = this.extractKeywords(text);
    const summary = sentences.slice(0, 3).join('. ') + '.';
    
    return {
      summary,
      keywords,
      wordCount: text.split(/\s+/).length,
      characterCount: text.length
    };
  }

  extractKeywords(text) {
    // Simple keyword extraction (in production, use NLP libraries)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
}