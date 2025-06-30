import axios from 'axios';
import * as cheerio from 'cheerio';
import { AIService } from './aiService.js';
import { logger } from '../utils/logger.js';

export class CompetitiveResearchService {
  constructor() {
    this.aiService = new AIService();
  }

  // Perform web research to find top-ranking competitors
  async performWebResearch(topic) {
    try {
      // In a production environment, you would use:
      // 1. SerpAPI for Google search results
      // 2. ScrapingBee or similar for web scraping
      // 3. Ahrefs/SEMrush API for SEO data
      
      // For demo purposes, we'll simulate competitor data
      const mockCompetitors = await this.generateMockCompetitors(topic);
      
      // In production, uncomment and implement real web scraping:
      // const realCompetitors = await this.scrapeTopResults(topic);
      
      return mockCompetitors;
    } catch (error) {
      logger.error('Web research error:', error);
      throw new Error('Failed to perform competitive research');
    }
  }

  // Generate mock competitor data for demo
  async generateMockCompetitors(topic) {
    const competitors = [
      {
        title: `The Ultimate Guide to ${topic}`,
        url: `https://example1.com/${topic.toLowerCase().replace(/\s+/g, '-')}`,
        metaDescription: `Learn everything about ${topic} with our comprehensive guide. Expert tips, best practices, and real-world examples.`,
        headings: [
          'Introduction',
          'What is ' + topic,
          'Benefits and Advantages',
          'Step-by-Step Implementation',
          'Common Mistakes to Avoid',
          'Advanced Techniques',
          'Tools and Resources',
          'Case Studies',
          'Future Trends',
          'Conclusion'
        ],
        snippet: `Discover the complete guide to ${topic}. This comprehensive resource covers everything from basics to advanced techniques.`,
        ranking: 1,
        wordCount: 3500,
        backlinks: 245,
        domain: 'example1.com'
      },
      {
        title: `${topic}: Best Practices and Expert Tips`,
        url: `https://example2.com/blog/${topic.toLowerCase().replace(/\s+/g, '-')}-guide`,
        metaDescription: `Master ${topic} with proven strategies and expert insights. Practical tips for immediate results.`,
        headings: [
          'Getting Started',
          'Core Concepts',
          'Implementation Strategy',
          'Optimization Techniques',
          'Measuring Success',
          'Troubleshooting',
          'Expert Recommendations',
          'Final Thoughts'
        ],
        snippet: `Expert guide to ${topic} with actionable strategies and proven techniques for success.`,
        ranking: 2,
        wordCount: 2800,
        backlinks: 189,
        domain: 'example2.com'
      },
      {
        title: `How to Master ${topic} in 2024`,
        url: `https://example3.com/${topic.toLowerCase().replace(/\s+/g, '-')}-mastery`,
        metaDescription: `Complete ${topic} tutorial with modern approaches and cutting-edge techniques for 2024.`,
        headings: [
          'Why ' + topic + ' Matters',
          'Current Landscape',
          'Essential Skills',
          'Modern Approaches',
          'Tools and Technologies',
          'Real-World Applications',
          'Success Stories',
          'Next Steps'
        ],
        snippet: `Stay ahead with the latest ${topic} strategies and techniques for 2024.`,
        ranking: 3,
        wordCount: 3200,
        backlinks: 156,
        domain: 'example3.com'
      }
    ];

    return competitors;
  }

  // Real web scraping implementation (for production)
  async scrapeTopResults(topic) {
    try {
      // This would use SerpAPI or similar service
      const searchResults = await this.getSearchResults(topic);
      const competitors = [];

      for (const result of searchResults.slice(0, 10)) {
        try {
          const pageData = await this.scrapePage(result.url);
          competitors.push({
            title: result.title,
            url: result.url,
            metaDescription: result.description,
            headings: pageData.headings,
            snippet: result.snippet,
            ranking: result.position,
            wordCount: pageData.wordCount,
            backlinks: pageData.backlinks || 0,
            domain: new URL(result.url).hostname
          });
        } catch (error) {
          logger.warn(`Failed to scrape ${result.url}:`, error);
        }
      }

      return competitors;
    } catch (error) {
      logger.error('Real scraping error:', error);
      throw error;
    }
  }

  // Get search results using SerpAPI (production implementation)
  async getSearchResults(query) {
    // Implementation would use SerpAPI or similar
    // const response = await axios.get('https://serpapi.com/search', {
    //   params: {
    //     q: query,
    //     api_key: process.env.SERPAPI_KEY,
    //     engine: 'google',
    //     num: 10
    //   }
    // });
    // return response.data.organic_results;
    
    throw new Error('SerpAPI not configured');
  }

  // Scrape individual page content
  async scrapePage(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ContentAnalyzer/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract headings
      const headings = [];
      $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const text = $(el).text().trim();
        if (text) headings.push(text);
      });

      // Extract text content
      const textContent = $('p, div, span').text();
      const wordCount = textContent.split(/\s+/).length;

      return {
        headings,
        wordCount,
        textContent: textContent.substring(0, 5000) // Limit for analysis
      };
    } catch (error) {
      logger.error(`Failed to scrape ${url}:`, error);
      throw error;
    }
  }

  // Generate competitive outline using AI
  async generateCompetitiveOutline(params, user) {
    const { title, competitors, seoKeywords, tone, targetAudience } = params;

    // Check if user has API key configured
    if (!user.aiSettings?.apiKey) {
      throw new Error('Please configure your AI API key in Settings before generating content.');
    }

    try {
      const client = this.aiService.initializeClient(user.aiSettings.apiKey, user.aiSettings.provider);
      
      // Analyze competitor content
      const competitorAnalysis = competitors.map(comp => ({
        title: comp.title,
        headings: comp.headings,
        ranking: comp.ranking,
        wordCount: comp.wordCount
      }));

      const prompt = `Analyze the top-ranking competitors and create a superior blog outline for "${title}".

COMPETITOR ANALYSIS:
${competitorAnalysis.map(comp => `
Rank #${comp.ranking}: ${comp.title}
Headings: ${comp.headings.join(', ')}
Word Count: ${comp.wordCount}
`).join('\n')}

REQUIREMENTS:
- Create an outline that can outrank these competitors
- Target audience: ${targetAudience || 'general'}
- Tone: ${tone || 'professional'}
- SEO Keywords: ${seoKeywords || 'extract from title'}
- Include sections that competitors are missing
- Ensure comprehensive coverage of the topic
- Structure for featured snippets and rich results

Generate a detailed outline with:
1. Section titles (H2 level)
2. Brief description of what each section should cover
3. Suggested word count for each section
4. Why this section will help outrank competitors

Format as JSON with this structure:
{
  "outline": [
    {
      "title": "Section Title",
      "description": "What this section covers",
      "wordCount": 500,
      "competitiveAdvantage": "Why this beats competitors"
    }
  ],
  "seoStrategy": "Overall SEO strategy",
  "targetKeywords": ["keyword1", "keyword2"]
}`;

      let response;
      
      switch (user.aiSettings.provider) {
        case 'openai':
          const completion = await client.chat.completions.create({
            model: user.aiSettings.model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.7
          });
          response = completion.choices[0].message.content;
          break;
          
        case 'anthropic':
          const message = await client.messages.create({
            model: user.aiSettings.model || 'claude-3-haiku-20240307',
            max_tokens: 2000,
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
        // Fallback: create structured response from text
        parsedResponse = this.parseOutlineFromText(response, title);
      }

      return {
        outline: parsedResponse.outline || [],
        seoStrategy: parsedResponse.seoStrategy || 'Focus on comprehensive coverage and user intent',
        targetKeywords: parsedResponse.targetKeywords || [title],
        competitorAnalysis: competitorAnalysis
      };

    } catch (error) {
      logger.error('Competitive outline generation error:', error);
      throw new Error(`Failed to generate competitive outline: ${error.message}`);
    }
  }

  // Generate content for a specific section
  async generateSectionContent(params, user) {
    const { title, description, wordCount, tone, seoKeywords, context } = params;

    // Check if user has API key configured
    if (!user.aiSettings?.apiKey) {
      throw new Error('Please configure your AI API key in Settings before generating content.');
    }

    try {
      const client = this.aiService.initializeClient(user.aiSettings.apiKey, user.aiSettings.provider);
      
      const prompt = `Write a ${wordCount}-word section for a blog post titled "${context.blogTitle}".

SECTION DETAILS:
Title: ${title}
Description: ${description}
Target word count: ${wordCount}
Tone: ${tone}
SEO Keywords: ${seoKeywords || 'N/A'}

CONTEXT:
Blog Title: ${context.blogTitle}
Previous Sections: ${context.previousSections.map(s => s.title).join(', ') || 'None'}

COMPETITOR INSIGHTS:
${context.competitors.map(comp => `- ${comp.title}: ${comp.headings.slice(0, 3).join(', ')}`).join('\n')}

REQUIREMENTS:
- Write engaging, informative content
- Include relevant examples and actionable insights
- Use markdown formatting (headers, lists, code blocks where appropriate)
- Naturally incorporate SEO keywords
- Ensure content flows well with previous sections
- Add unique value that competitors don't provide
- Include practical tips and real-world applications

Write the complete section content in markdown format:`;

      let content;
      
      switch (user.aiSettings.provider) {
        case 'openai':
          const completion = await client.chat.completions.create({
            model: user.aiSettings.model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: Math.min(wordCount * 2, 4000),
            temperature: 0.7
          });
          content = completion.choices[0].message.content;
          break;
          
        case 'anthropic':
          const message = await client.messages.create({
            model: user.aiSettings.model || 'claude-3-haiku-20240307',
            max_tokens: Math.min(wordCount * 2, 4000),
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

      return {
        content,
        wordCount: content.split(/\s+/).length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Section content generation error:', error);
      throw new Error(`Failed to generate section content: ${error.message}`);
    }
  }

  // Fallback parser for non-JSON responses
  parseOutlineFromText(text, title) {
    const lines = text.split('\n').filter(line => line.trim());
    const outline = [];
    
    let currentSection = null;
    
    for (const line of lines) {
      // Look for section headers (numbered or bulleted)
      const sectionMatch = line.match(/^\d+\.\s*(.+)/) || line.match(/^[-*]\s*(.+)/);
      
      if (sectionMatch) {
        if (currentSection) {
          outline.push(currentSection);
        }
        
        currentSection = {
          title: sectionMatch[1].trim(),
          description: '',
          wordCount: 500,
          competitiveAdvantage: 'Comprehensive coverage of the topic'
        };
      } else if (currentSection && line.trim()) {
        currentSection.description += line.trim() + ' ';
      }
    }
    
    if (currentSection) {
      outline.push(currentSection);
    }
    
    // If no sections found, create a basic outline
    if (outline.length === 0) {
      outline.push(
        {
          title: 'Introduction',
          description: `Introduction to ${title}`,
          wordCount: 400,
          competitiveAdvantage: 'Clear and engaging introduction'
        },
        {
          title: 'Main Content',
          description: `Detailed explanation of ${title}`,
          wordCount: 800,
          competitiveAdvantage: 'Comprehensive coverage'
        },
        {
          title: 'Conclusion',
          description: `Summary and next steps for ${title}`,
          wordCount: 300,
          competitiveAdvantage: 'Actionable takeaways'
        }
      );
    }
    
    return { outline };
  }
}