import axios from 'axios';
import * as cheerio from 'cheerio';
import { AIService } from './aiService.js';
import { logger } from '../utils/logger.js';

export class CompetitiveResearchService {
  constructor() {
    this.aiService = new AIService();
    this.serpApiKey = process.env.SERPAPI_KEY;
  }

  // Perform web research to find top-ranking competitors
  async performWebResearch(topic) {
    try {
      logger.info(`Starting competitive research for topic: ${topic}`);
      
      // Use real SerpAPI if key is available, otherwise fallback to mock data
      if (this.serpApiKey) {
        logger.info('Using SerpAPI for real competitive research');
        const realCompetitors = await this.scrapeTopResults(topic);
        return realCompetitors;
      } else {
        logger.warn('SerpAPI key not found, using mock data');
        const mockCompetitors = await this.generateMockCompetitors(topic);
        return mockCompetitors;
      }
    } catch (error) {
      logger.error('Web research error:', error);
      // Fallback to mock data if real scraping fails
      logger.info('Falling back to mock competitor data');
      return await this.generateMockCompetitors(topic);
    }
  }

  // Real web scraping implementation using SerpAPI
  async scrapeTopResults(topic) {
    try {
      logger.info(`Fetching search results for: ${topic}`);
      
      // Get search results from SerpAPI
      const searchResults = await this.getSearchResults(topic);
      const competitors = [];

      // Process top 10 results
      const resultsToProcess = searchResults.slice(0, 10);
      logger.info(`Processing ${resultsToProcess.length} search results`);

      for (let i = 0; i < resultsToProcess.length; i++) {
        const result = resultsToProcess[i];
        try {
          logger.info(`Scraping page ${i + 1}: ${result.link}`);
          
          const pageData = await this.scrapePage(result.link);
          
          competitors.push({
            title: result.title || `Result ${i + 1}`,
            url: result.link,
            metaDescription: result.snippet || '',
            headings: pageData.headings,
            snippet: result.snippet || '',
            ranking: result.position || i + 1,
            wordCount: pageData.wordCount,
            backlinks: this.estimateBacklinks(result.link),
            domain: this.extractDomain(result.link),
            extractedContent: pageData.textContent
          });
          
          logger.info(`Successfully scraped: ${result.title}`);
        } catch (error) {
          logger.warn(`Failed to scrape ${result.link}:`, error.message);
          
          // Add basic competitor data even if scraping fails
          competitors.push({
            title: result.title || `Result ${i + 1}`,
            url: result.link,
            metaDescription: result.snippet || '',
            headings: this.extractHeadingsFromSnippet(result.snippet || ''),
            snippet: result.snippet || '',
            ranking: result.position || i + 1,
            wordCount: this.estimateWordCount(result.snippet || ''),
            backlinks: this.estimateBacklinks(result.link),
            domain: this.extractDomain(result.link)
          });
        }
      }

      logger.info(`Successfully processed ${competitors.length} competitors`);
      return competitors;
    } catch (error) {
      logger.error('Real scraping error:', error);
      throw error;
    }
  }

  // Get search results using SerpAPI
  async getSearchResults(query) {
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: query,
          api_key: this.serpApiKey,
          engine: 'google',
          num: 10,
          gl: 'us', // Country
          hl: 'en', // Language
          safe: 'active'
        },
        timeout: 30000
      });

      if (!response.data.organic_results) {
        throw new Error('No organic results found in SerpAPI response');
      }

      logger.info(`Found ${response.data.organic_results.length} organic results`);
      return response.data.organic_results;
    } catch (error) {
      logger.error('SerpAPI request failed:', error.message);
      throw new Error(`Failed to fetch search results: ${error.message}`);
    }
  }

  // Scrape individual page content
  async scrapePage(url) {
    try {
      // Add delay to be respectful to servers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style, nav, footer, aside, .advertisement, .ads, .sidebar').remove();
      
      // Extract headings with hierarchy
      const headings = [];
      $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const text = $(el).text().trim();
        const level = el.tagName.toLowerCase();
        if (text && text.length > 3 && text.length < 200) {
          headings.push({
            text: text,
            level: level,
            order: i
          });
        }
      });

      // Extract main content
      const contentSelectors = [
        'article',
        '.content',
        '.post-content',
        '.entry-content',
        '.main-content',
        'main',
        '.article-body',
        '.post-body'
      ];

      let textContent = '';
      for (const selector of contentSelectors) {
        const content = $(selector).text();
        if (content && content.length > textContent.length) {
          textContent = content;
        }
      }

      // Fallback to body if no specific content found
      if (!textContent) {
        textContent = $('body').text();
      }

      // Clean and process text
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

      // Extract meta description
      const metaDescription = $('meta[name="description"]').attr('content') || 
                             $('meta[property="og:description"]').attr('content') || '';

      return {
        headings: headings.map(h => h.text),
        wordCount,
        textContent: textContent.substring(0, 5000), // Limit for analysis
        metaDescription,
        title: $('title').text() || '',
        url: url
      };
    } catch (error) {
      logger.error(`Failed to scrape ${url}:`, error.message);
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }

  // Helper methods
  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown-domain.com';
    }
  }

  estimateBacklinks(url) {
    // Simple estimation based on domain authority indicators
    const domain = this.extractDomain(url);
    const authorityDomains = ['wikipedia.org', 'github.com', 'stackoverflow.com', 'medium.com'];
    
    if (authorityDomains.some(d => domain.includes(d))) {
      return Math.floor(Math.random() * 1000) + 500;
    }
    return Math.floor(Math.random() * 200) + 10;
  }

  estimateWordCount(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length * 10; // Estimate based on snippet
  }

  extractHeadingsFromSnippet(snippet) {
    // Extract potential headings from snippet
    const sentences = snippet.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  // Generate mock competitor data for demo/fallback
  async generateMockCompetitors(topic) {
    logger.info(`Generating mock competitor data for: ${topic}`);
    
    const competitors = [
      {
        title: `The Complete Guide to ${topic}: Everything You Need to Know`,
        url: `https://example1.com/${topic.toLowerCase().replace(/\s+/g, '-')}-guide`,
        metaDescription: `Master ${topic} with our comprehensive guide. Learn best practices, avoid common mistakes, and get expert insights.`,
        headings: [
          'Introduction to ' + topic,
          'Why ' + topic + ' Matters in 2024',
          'Getting Started: The Basics',
          'Step-by-Step Implementation',
          'Advanced Techniques and Strategies',
          'Common Mistakes to Avoid',
          'Tools and Resources',
          'Real-World Case Studies',
          'Future Trends and Predictions',
          'Conclusion and Next Steps'
        ],
        snippet: `Comprehensive guide covering everything about ${topic}. Learn from experts and implement proven strategies.`,
        ranking: 1,
        wordCount: 3500,
        backlinks: 245,
        domain: 'example1.com'
      },
      {
        title: `${topic}: Best Practices and Expert Tips for Success`,
        url: `https://techblog.com/${topic.toLowerCase().replace(/\s+/g, '-')}-best-practices`,
        metaDescription: `Discover proven ${topic} strategies from industry experts. Practical tips and actionable insights for immediate results.`,
        headings: [
          'Understanding ' + topic,
          'Industry Best Practices',
          'Expert Recommendations',
          'Implementation Strategies',
          'Measuring Success and ROI',
          'Optimization Techniques',
          'Troubleshooting Common Issues',
          'Advanced Tips from Professionals',
          'Tools and Software Recommendations'
        ],
        snippet: `Learn ${topic} best practices from industry experts. Proven strategies and actionable tips for success.`,
        ranking: 2,
        wordCount: 2800,
        backlinks: 189,
        domain: 'techblog.com'
      },
      {
        title: `How to Master ${topic} in 2024: A Modern Approach`,
        url: `https://moderntech.io/mastering-${topic.toLowerCase().replace(/\s+/g, '-')}`,
        metaDescription: `Stay ahead with the latest ${topic} techniques and strategies. Modern approaches for 2024 and beyond.`,
        headings: [
          'The Current State of ' + topic,
          'Why Traditional Approaches Fall Short',
          'Modern Methodologies',
          'Essential Tools and Technologies',
          'Building Your ' + topic + ' Strategy',
          'Implementation Roadmap',
          'Measuring and Optimizing Results',
          'Future-Proofing Your Approach',
          'Success Stories and Case Studies'
        ],
        snippet: `Modern approach to ${topic} with cutting-edge techniques and strategies for 2024.`,
        ranking: 3,
        wordCount: 3200,
        backlinks: 156,
        domain: 'moderntech.io'
      },
      {
        title: `${topic} Tutorial: From Beginner to Expert`,
        url: `https://learnfast.com/${topic.toLowerCase().replace(/\s+/g, '-')}-tutorial`,
        metaDescription: `Complete ${topic} tutorial for all skill levels. Start from basics and advance to expert-level techniques.`,
        headings: [
          'Getting Started with ' + topic,
          'Basic Concepts and Terminology',
          'Hands-On Practice Exercises',
          'Intermediate Techniques',
          'Advanced Strategies',
          'Real-World Projects',
          'Performance Optimization',
          'Troubleshooting Guide',
          'Resources for Continued Learning'
        ],
        snippet: `Step-by-step ${topic} tutorial from beginner to expert level. Hands-on exercises and real-world examples.`,
        ranking: 4,
        wordCount: 4100,
        backlinks: 134,
        domain: 'learnfast.com'
      },
      {
        title: `Top 10 ${topic} Strategies That Actually Work`,
        url: `https://strategyhub.com/top-${topic.toLowerCase().replace(/\s+/g, '-')}-strategies`,
        metaDescription: `Discover the most effective ${topic} strategies used by successful professionals. Proven methods that deliver results.`,
        headings: [
          'Strategy #1: Foundation Building',
          'Strategy #2: Systematic Approach',
          'Strategy #3: Data-Driven Decisions',
          'Strategy #4: Automation and Efficiency',
          'Strategy #5: Continuous Improvement',
          'Strategy #6: Risk Management',
          'Strategy #7: Scalability Planning',
          'Strategy #8: Performance Monitoring',
          'Strategy #9: Innovation Integration',
          'Strategy #10: Long-term Sustainability'
        ],
        snippet: `Top 10 proven ${topic} strategies that deliver real results. Learn what works and what doesn't.`,
        ranking: 5,
        wordCount: 2600,
        backlinks: 98,
        domain: 'strategyhub.com'
      }
    ];

    return competitors;
  }

  // Validate user has AI configuration before proceeding
  validateUserAIConfig(user) {
    if (!user.aiSettings?.apiKey) {
      throw new Error('Please configure your AI API key in Settings before generating content.');
    }

    if (!user.aiSettings?.provider) {
      throw new Error('Please select an AI provider in Settings.');
    }

    return true;
  }

  // Generate competitive outline using AI
  async generateCompetitiveOutline(params, user) {
    const { title, competitors, seoKeywords, tone, targetAudience } = params;

    // Validate user AI configuration
    this.validateUserAIConfig(user);

    try {
      const client = this.aiService.initializeClient(user.aiSettings.apiKey, user.aiSettings.provider);
      
      // Analyze competitor content
      const competitorAnalysis = competitors.map(comp => ({
        title: comp.title,
        headings: comp.headings,
        ranking: comp.ranking,
        wordCount: comp.wordCount,
        domain: comp.domain,
        metaDescription: comp.metaDescription
      }));

      const prompt = `Analyze the top-ranking competitors and create a superior blog outline for "${title}" that can outrank them.

COMPETITOR ANALYSIS:
${competitorAnalysis.map(comp => `
🏆 Rank #${comp.ranking}: ${comp.title}
📊 Domain: ${comp.domain} | Words: ${comp.wordCount}
📝 Meta: ${comp.metaDescription}
📋 Structure: ${comp.headings.slice(0, 8).join(' → ')}
`).join('\n')}

TARGET REQUIREMENTS:
- Audience: ${targetAudience || 'general professionals'}
- Tone: ${tone || 'professional and engaging'}
- SEO Focus: ${seoKeywords || 'extract from title and competitors'}
- Goal: Rank #1 and capture featured snippets

COMPETITIVE ADVANTAGES TO INCLUDE:
1. More comprehensive coverage than competitors
2. Better structure for user experience
3. Unique angles competitors are missing
4. Actionable insights and practical examples
5. Modern, up-to-date information
6. Clear, scannable format for featured snippets

Generate a detailed outline that beats all competitors by being more comprehensive, better structured, and more valuable to users.

Format as JSON:
{
  "outline": [
    {
      "title": "Section Title (H2)",
      "description": "Detailed description of section content and approach",
      "wordCount": 600,
      "competitiveAdvantage": "Specific advantage over competitors",
      "seoValue": "How this helps with SEO and rankings"
    }
  ],
  "seoStrategy": "Overall strategy to outrank competitors",
  "targetKeywords": ["primary keyword", "secondary keyword"],
  "contentGaps": ["gaps in competitor content we'll fill"],
  "uniqueValue": "What makes this content superior"
}`;

      let response;
      
      switch (user.aiSettings.provider) {
        case 'openai':
          const completion = await client.chat.completions.create({
            model: user.aiSettings.model || 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 3000,
            temperature: 0.7
          });
          response = completion.choices[0].message.content;
          break;
          
        case 'anthropic':
          const message = await client.messages.create({
            model: user.aiSettings.model || 'claude-3-sonnet-20240229',
            max_tokens: 3000,
            messages: [{ role: 'user', content: prompt }]
          });
          response = message.content[0].text;
          break;
          
        case 'google':
          const model = client.getGenerativeModel({ model: user.aiSettings.model || 'gemini-pro' });
          const result = await model.generateContent(prompt);
          response = result.response.text();
          break;
          
        default:
          throw new Error(`Unsupported AI provider: ${user.aiSettings.provider}`);
      }

      // Parse JSON response
      let parsedResponse;
      try {
        // Extract JSON from response if it's wrapped in markdown
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
        parsedResponse = JSON.parse(jsonString);
      } catch (parseError) {
        logger.warn('Failed to parse JSON response, using fallback parser');
        parsedResponse = this.parseOutlineFromText(response, title);
      }

      return {
        outline: parsedResponse.outline || [],
        seoStrategy: parsedResponse.seoStrategy || 'Comprehensive coverage with better user experience',
        targetKeywords: parsedResponse.targetKeywords || [title],
        contentGaps: parsedResponse.contentGaps || [],
        uniqueValue: parsedResponse.uniqueValue || 'More comprehensive and actionable content',
        competitorAnalysis: competitorAnalysis,
        researchMethod: this.serpApiKey ? 'Real SerpAPI data' : 'Mock data (configure SerpAPI for real research)'
      };

    } catch (error) {
      logger.error('Competitive outline generation error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('API key')) {
        throw new Error('Please configure your AI API key in Settings before generating content.');
      } else if (error.message.includes('provider')) {
        throw new Error('Please select a valid AI provider in Settings.');
      } else if (error.message.includes('Invalid API key') || error.message.includes('Unauthorized')) {
        throw new Error('Your AI API key appears to be invalid. Please check your Settings and update your API key.');
      } else {
        throw new Error(`Failed to generate competitive outline: ${error.message}`);
      }
    }
  }

  // Generate content for a specific section
  async generateSectionContent(params, user) {
    const { title, description, wordCount, tone, seoKeywords, context } = params;

    // Validate user AI configuration
    this.validateUserAIConfig(user);

    try {
      const client = this.aiService.initializeClient(user.aiSettings.apiKey, user.aiSettings.provider);
      
      // Extract competitor insights for this section
      const competitorInsights = context.competitors.map(comp => ({
        title: comp.title,
        relevantHeadings: comp.headings.filter(h => 
          h.toLowerCase().includes(title.toLowerCase().split(' ')[0]) ||
          title.toLowerCase().includes(h.toLowerCase().split(' ')[0])
        ).slice(0, 3),
        domain: comp.domain,
        ranking: comp.ranking
      })).filter(comp => comp.relevantHeadings.length > 0);

      const prompt = `Write a comprehensive ${wordCount}-word section for "${title}" that outperforms competitors.

SECTION CONTEXT:
📝 Blog Title: ${context.blogTitle}
🎯 Section: ${title}
📋 Description: ${description}
🎨 Tone: ${tone}
🔍 SEO Keywords: ${seoKeywords || 'N/A'}
📊 Target Length: ${wordCount} words

PREVIOUS SECTIONS:
${context.previousSections.map(s => `• ${s.title}`).join('\n') || 'None (this is the first section)'}

COMPETITOR ANALYSIS:
${competitorInsights.map(comp => `
🏆 ${comp.domain} (Rank #${comp.ranking}):
   Related headings: ${comp.relevantHeadings.join(', ') || 'None directly related'}
`).join('\n')}

CONTENT REQUIREMENTS:
✅ Exceed competitor depth and quality
✅ Include actionable insights and practical examples
✅ Use clear, scannable formatting (headers, lists, code blocks)
✅ Naturally incorporate SEO keywords
✅ Provide unique value not found in competitors
✅ Include real-world applications and case studies
✅ Use engaging, ${tone} tone throughout
✅ Structure for featured snippet potential
✅ Add specific, measurable tips and strategies

FORMATTING GUIDELINES:
- Use markdown formatting (##, ###, -, *, \`code\`, etc.)
- Include relevant subheadings for better structure
- Add bullet points and numbered lists for readability
- Include code examples or practical snippets where relevant
- Use tables for comparisons when appropriate
- Add callout boxes with > for important tips

Write the complete section that will help this blog outrank all competitors:`;

      let content;
      
      switch (user.aiSettings.provider) {
        case 'openai':
          const completion = await client.chat.completions.create({
            model: user.aiSettings.model || 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: Math.min(wordCount * 3, 4000),
            temperature: 0.7
          });
          content = completion.choices[0].message.content;
          break;
          
        case 'anthropic':
          const message = await client.messages.create({
            model: user.aiSettings.model || 'claude-3-sonnet-20240229',
            max_tokens: Math.min(wordCount * 3, 4000),
            messages: [{ role: 'user', content: prompt }]
          });
          content = message.content[0].text;
          break;
          
        case 'google':
          const model = client.getGenerativeModel({ model: user.aiSettings.model || 'gemini-pro' });
          const result = await model.generateContent(prompt);
          content = result.response.text();
          break;
          
        default:
          throw new Error(`Unsupported AI provider: ${user.aiSettings.provider}`);
      }

      const actualWordCount = content.split(/\s+/).filter(word => word.length > 0).length;

      return {
        content,
        wordCount: actualWordCount,
        generatedAt: new Date().toISOString(),
        competitorInsights: competitorInsights.length,
        researchMethod: this.serpApiKey ? 'Real competitor data' : 'Mock competitor data'
      };

    } catch (error) {
      logger.error('Section content generation error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('API key')) {
        throw new Error('Please configure your AI API key in Settings before generating content.');
      } else if (error.message.includes('provider')) {
        throw new Error('Please select a valid AI provider in Settings.');
      } else if (error.message.includes('Invalid API key') || error.message.includes('Unauthorized')) {
        throw new Error('Your AI API key appears to be invalid. Please check your Settings and update your API key.');
      } else {
        throw new Error(`Failed to generate section content: ${error.message}`);
      }
    }
  }

  // Fallback parser for non-JSON responses
  parseOutlineFromText(text, title) {
    const lines = text.split('\n').filter(line => line.trim());
    const outline = [];
    
    let currentSection = null;
    
    for (const line of lines) {
      // Look for section headers (numbered, bulleted, or markdown headers)
      const sectionMatch = line.match(/^\d+\.\s*(.+)/) || 
                          line.match(/^[-*]\s*(.+)/) ||
                          line.match(/^#{2,3}\s*(.+)/);
      
      if (sectionMatch) {
        if (currentSection) {
          outline.push(currentSection);
        }
        
        currentSection = {
          title: sectionMatch[1].trim().replace(/[*_]/g, ''),
          description: '',
          wordCount: 600,
          competitiveAdvantage: 'Comprehensive coverage with unique insights',
          seoValue: 'Optimized for search rankings and user engagement'
        };
      } else if (currentSection && line.trim() && !line.includes('{') && !line.includes('}')) {
        currentSection.description += line.trim() + ' ';
      }
    }
    
    if (currentSection) {
      outline.push(currentSection);
    }
    
    // If no sections found, create a comprehensive outline
    if (outline.length === 0) {
      outline.push(
        {
          title: `Introduction to ${title}`,
          description: `Comprehensive introduction covering the importance and overview of ${title}`,
          wordCount: 500,
          competitiveAdvantage: 'More engaging and comprehensive introduction than competitors',
          seoValue: 'Optimized for featured snippets and user engagement'
        },
        {
          title: `Understanding ${title}: Core Concepts`,
          description: `Deep dive into the fundamental concepts and principles of ${title}`,
          wordCount: 800,
          competitiveAdvantage: 'Clearer explanations with practical examples',
          seoValue: 'Targets informational search queries'
        },
        {
          title: `Step-by-Step Implementation Guide`,
          description: `Practical, actionable steps for implementing ${title} successfully`,
          wordCount: 1000,
          competitiveAdvantage: 'More detailed and actionable than competitor guides',
          seoValue: 'Targets how-to search queries'
        },
        {
          title: `Advanced Strategies and Best Practices`,
          description: `Expert-level techniques and industry best practices for ${title}`,
          wordCount: 800,
          competitiveAdvantage: 'Unique advanced insights not found in competitor content',
          seoValue: 'Targets advanced user queries'
        },
        {
          title: `Common Mistakes and How to Avoid Them`,
          description: `Comprehensive guide to avoiding pitfalls and common errors in ${title}`,
          wordCount: 600,
          competitiveAdvantage: 'More comprehensive mistake prevention guide',
          seoValue: 'Targets problem-solving queries'
        },
        {
          title: `Tools, Resources, and Recommendations`,
          description: `Curated list of the best tools and resources for ${title}`,
          wordCount: 500,
          competitiveAdvantage: 'More up-to-date and comprehensive tool recommendations',
          seoValue: 'Targets tool comparison queries'
        },
        {
          title: `Future Trends and Conclusion`,
          description: `Analysis of future trends and actionable next steps for ${title}`,
          wordCount: 400,
          competitiveAdvantage: 'Forward-looking insights and clear action items',
          seoValue: 'Provides comprehensive conclusion for better user experience'
        }
      );
    }
    
    return { 
      outline,
      seoStrategy: 'Comprehensive coverage designed to outrank competitors',
      targetKeywords: [title],
      contentGaps: ['More detailed explanations', 'Better practical examples', 'Up-to-date information'],
      uniqueValue: 'More comprehensive and actionable than existing content'
    };
  }
}