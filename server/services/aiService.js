import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Content from '../models/Content.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

export class AIService {
  constructor() {
    this.providers = {
      openai: null,
      anthropic: null,
      google: null
    };
  }

  // Initialize AI client based on user's API key
  initializeClient(apiKey, provider) {
    switch (provider) {
      case 'openai':
        return new OpenAI({ apiKey });
      case 'anthropic':
        return new Anthropic({ apiKey });
      case 'google':
        return new GoogleGenerativeAI(apiKey);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Validate API key and return provider info
  async validateApiKey(apiKey, provider) {
    try {
      const client = this.initializeClient(apiKey, provider);
      
      switch (provider) {
        case 'openai':
          // Test with a simple completion
          await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5
          });
          break;
          
        case 'anthropic':
          // Test with Claude
          await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Hello' }]
          });
          break;
          
        case 'google':
          // Test with Gemini
          const model = client.getGenerativeModel({ model: 'gemini-pro' });
          await model.generateContent('Hello');
          break;
      }

      return {
        isValid: true,
        provider,
        message: 'API key is valid'
      };
    } catch (error) {
      logger.error(`API key validation failed for ${provider}:`, error);
      return {
        isValid: false,
        provider,
        error: error.message
      };
    }
  }

  // Get available models for a provider
  async getAvailableModels(apiKey, provider) {
    const modelMappings = {
      openai: [
        { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Faster and more efficient' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' }
      ],
      anthropic: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful Claude model' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and efficient' }
      ],
      google: [
        { id: 'gemini-pro', name: 'Gemini Pro', description: 'Google\'s most capable model' },
        { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Multimodal capabilities' }
      ]
    };

    return modelMappings[provider] || [];
  }

  // Generate content outline
  async generateOutline(params, user) {
    const { topic, keywords, tone, language, targetLength } = params;
    
    const client = this.initializeClient(user.aiSettings.apiKey, user.aiSettings.provider);
    
    const prompt = `Create a detailed outline for a ${targetLength}-word blog post about "${topic}".
    
    Requirements:
    - Tone: ${tone}
    - Language: ${language}
    - Target keywords: ${keywords || 'N/A'}
    - Include main sections and subsections
    - Suggest relevant examples and case studies
    - Include SEO-friendly headings
    
    Format the outline as a structured list with clear hierarchy.`;

    try {
      let outline;
      
      switch (user.aiSettings.provider) {
        case 'openai':
          const completion = await client.chat.completions.create({
            model: user.aiSettings.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: user.aiSettings.creativity === 'creative' ? 0.8 : 
                        user.aiSettings.creativity === 'conservative' ? 0.3 : 0.5
          });
          outline = completion.choices[0].message.content;
          break;
          
        case 'anthropic':
          const message = await client.messages.create({
            model: user.aiSettings.model,
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          });
          outline = message.content[0].text;
          break;
          
        case 'google':
          const model = client.getGenerativeModel({ model: user.aiSettings.model });
          const result = await model.generateContent(prompt);
          outline = result.response.text();
          break;
      }

      return {
        outline,
        topic,
        metadata: {
          tone,
          language,
          targetLength,
          keywords: keywords?.split(',').map(k => k.trim()) || []
        }
      };
    } catch (error) {
      logger.error('Outline generation error:', error);
      throw new Error('Failed to generate outline');
    }
  }

  // Generate full content (this would be a background job in production)
  async generateContent(params, user) {
    const {
      topic,
      outline,
      keywords,
      tone,
      language,
      targetLength,
      uploadedFiles,
      includeImages,
      seoOptimize
    } = params;

    // Create content record
    const content = new Content({
      user: user.id,
      title: topic,
      status: 'generating',
      metadata: {
        language,
        tone,
        targetLength
      },
      seo: {
        keywords: keywords?.split(',').map(k => k.trim()) || []
      },
      generation: {
        model: user.aiSettings.model,
        provider: user.aiSettings.provider
      },
      uploadedFiles: uploadedFiles || []
    });

    await content.save();

    // Start background generation (in production, use a job queue)
    this.generateContentBackground(content._id, params, user);

    return content._id;
  }

  // Background content generation
  async generateContentBackground(contentId, params, user) {
    try {
      const content = await Content.findById(contentId);
      if (!content) return;

      const client = this.initializeClient(user.aiSettings.apiKey, user.aiSettings.provider);
      
      // Build context from uploaded files
      let fileContext = '';
      if (params.uploadedFiles && params.uploadedFiles.length > 0) {
        fileContext = params.uploadedFiles
          .map(file => file.extractedText)
          .join('\n\n');
      }

      const prompt = `Write a comprehensive ${params.targetLength}-word blog post about "${params.topic}".

      ${params.outline ? `Follow this outline:\n${params.outline}\n` : ''}
      
      Requirements:
      - Tone: ${params.tone}
      - Language: ${params.language}
      - Target keywords: ${params.keywords || 'N/A'}
      - Include code examples where relevant
      - Use markdown formatting
      - Include tables and lists where appropriate
      - Make it engaging and informative
      
      ${fileContext ? `Reference material:\n${fileContext}\n` : ''}
      
      Write the complete blog post in markdown format.`;

      const startTime = Date.now();
      let generatedContent;

      switch (user.aiSettings.provider) {
        case 'openai':
          const completion = await client.chat.completions.create({
            model: user.aiSettings.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: Math.min(parseInt(params.targetLength) * 2, 4000),
            temperature: user.aiSettings.creativity === 'creative' ? 0.8 : 
                        user.aiSettings.creativity === 'conservative' ? 0.3 : 0.5
          });
          generatedContent = completion.choices[0].message.content;
          break;
          
        case 'anthropic':
          const message = await client.messages.create({
            model: user.aiSettings.model,
            max_tokens: Math.min(parseInt(params.targetLength) * 2, 4000),
            messages: [{ role: 'user', content: prompt }]
          });
          generatedContent = message.content[0].text;
          break;
          
        case 'google':
          const model = client.getGenerativeModel({ model: user.aiSettings.model });
          const result = await model.generateContent(prompt);
          generatedContent = result.response.text();
          break;
      }

      const generationTime = Date.now() - startTime;

      // Update content
      content.content = generatedContent;
      content.status = 'completed';
      content.generation.generationTime = generationTime;
      
      await content.save();

      // Update user usage
      await User.findByIdAndUpdate(user.id, {
        $inc: {
          'usage.totalPosts': 1,
          'usage.totalWords': content.metadata.wordCount,
          'subscription.wordsUsed': content.metadata.wordCount
        }
      });

      // Generate SEO data if requested
      if (params.seoOptimize) {
        await this.optimizeForSEO(contentId, params.keywords?.split(','), user);
      }

      // Generate images if requested
      if (params.includeImages) {
        await this.generateImages(contentId, [], user);
      }

    } catch (error) {
      logger.error('Background content generation error:', error);
      
      // Update content status to failed
      await Content.findByIdAndUpdate(contentId, {
        status: 'draft',
        'generation.error': error.message
      });
    }
  }

  // Get generation status
  async getGenerationStatus(contentId, userId) {
    const content = await Content.findOne({ _id: contentId, user: userId });
    
    if (!content) {
      throw new Error('Content not found');
    }

    return {
      id: content._id,
      status: content.status,
      progress: content.status === 'generating' ? 50 : 100,
      title: content.title,
      wordCount: content.metadata.wordCount,
      generationTime: content.generation.generationTime,
      error: content.generation.error
    };
  }

  // Generate images for content sections
  async generateImages(contentId, sections, user) {
    try {
      const content = await Content.findById(contentId);
      if (!content) throw new Error('Content not found');

      // Mock image generation (in production, integrate with DALL-E, Midjourney, etc.)
      const mockImages = [
        {
          url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
          alt: 'Technology concept',
          caption: 'Modern technology illustration',
          section: 'introduction'
        },
        {
          url: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg',
          alt: 'Code on screen',
          caption: 'Programming code example',
          section: 'implementation'
        }
      ];

      content.images = mockImages;
      await content.save();

      return mockImages;
    } catch (error) {
      logger.error('Image generation error:', error);
      throw error;
    }
  }

  // Optimize content for SEO
  async optimizeForSEO(contentId, targetKeywords, user) {
    try {
      const content = await Content.findById(contentId);
      if (!content) throw new Error('Content not found');

      // Mock SEO analysis (in production, use real SEO tools)
      const seoScore = Math.floor(Math.random() * 20) + 80; // 80-100
      const suggestions = [
        'Add more internal links',
        'Include target keywords in headings',
        'Optimize meta description length',
        'Add alt text to images'
      ];

      content.seo.score = seoScore;
      content.seo.suggestions = suggestions;
      content.seo.metaDescription = content.content.substring(0, 160) + '...';
      
      await content.save();

      return {
        score: seoScore,
        suggestions,
        keywords: content.seo.keywords,
        metaDescription: content.seo.metaDescription
      };
    } catch (error) {
      logger.error('SEO optimization error:', error);
      throw error;
    }
  }
}