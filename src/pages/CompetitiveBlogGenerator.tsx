import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Bot, 
  FileText, 
  Download, 
  Eye, 
  Edit3, 
  Plus, 
  Minus, 
  GripVertical,
  Target,
  Globe,
  Sparkles,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Zap
} from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import { apiService } from '../services/api';

interface OutlineSection {
  id: string;
  title: string;
  description: string;
  wordCount: number;
  selected: boolean;
  order: number;
  content?: string;
  isGenerating?: boolean;
}

interface CompetitorData {
  title: string;
  url: string;
  metaDescription: string;
  headings: string[];
  snippet: string;
  ranking: number;
}

const CompetitiveBlogGenerator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [blogTitle, setBlogTitle] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [settings, setSettings] = useState({
    tone: 'professional',
    wordsPerSection: 'medium',
    seoKeywords: '',
    targetAudience: 'general',
    contentDepth: 'comprehensive'
  });
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState('');

  const wordLimits = {
    'very-short': { label: 'Very Short', words: 300 },
    'short': { label: 'Short', words: 500 },
    'medium': { label: 'Medium', words: 800 },
    'long': { label: 'Long', words: 1200 },
    'very-long': { label: 'Very Long', words: 1500 }
  };

  const handleResearchAndOutline = async () => {
    if (!blogTitle.trim()) {
      setError('Please enter a blog title');
      return;
    }

    setIsResearching(true);
    setError('');
    setResearchProgress(0);

    try {
      // Step 1: Web research
      setResearchProgress(20);
      const researchResponse = await apiService.performWebResearch(blogTitle);
      setCompetitors(researchResponse.data.competitors);

      // Step 2: Generate competitive outline
      setResearchProgress(60);
      const outlineResponse = await apiService.generateCompetitiveOutline({
        title: blogTitle,
        competitors: researchResponse.data.competitors,
        seoKeywords: settings.seoKeywords,
        tone: settings.tone,
        targetAudience: settings.targetAudience
      });

      setResearchProgress(100);
      setOutline(outlineResponse.data.outline.map((section: any, index: number) => ({
        ...section,
        id: `section-${index}`,
        selected: true,
        order: index,
        wordCount: wordLimits[settings.wordsPerSection as keyof typeof wordLimits].words
      })));

      setCurrentStep(2);
    } catch (error: any) {
      setError(error.message || 'Failed to research and generate outline');
    } finally {
      setIsResearching(false);
      setResearchProgress(0);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setOutline(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, selected: !section.selected }
        : section
    ));
  };

  const handleSectionEdit = (sectionId: string, field: string, value: any) => {
    setOutline(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, [field]: value }
        : section
    ));
  };

  const handleReorderSection = (sectionId: string, direction: 'up' | 'down') => {
    setOutline(prev => {
      const currentIndex = prev.findIndex(s => s.id === sectionId);
      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === prev.length - 1)
      ) {
        return prev;
      }

      const newOutline = [...prev];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      [newOutline[currentIndex], newOutline[targetIndex]] = 
      [newOutline[targetIndex], newOutline[currentIndex]];

      return newOutline.map((section, index) => ({
        ...section,
        order: index
      }));
    });
  };

  const handleGenerateSection = async (sectionId: string) => {
    setOutline(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isGenerating: true }
        : section
    ));

    try {
      const section = outline.find(s => s.id === sectionId);
      if (!section) return;

      const response = await apiService.generateSectionContent({
        title: section.title,
        description: section.description,
        wordCount: section.wordCount,
        tone: settings.tone,
        seoKeywords: settings.seoKeywords,
        context: {
          blogTitle,
          previousSections: outline.slice(0, section.order).filter(s => s.content),
          competitors: competitors.slice(0, 3)
        }
      });

      setOutline(prev => prev.map(s => 
        s.id === sectionId 
          ? { ...s, content: response.data.content, isGenerating: false }
          : s
      ));
    } catch (error: any) {
      setError(`Failed to generate content for section: ${error.message}`);
      setOutline(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, isGenerating: false }
          : section
      ));
    }
  };

  const handleGenerateAllContent = async () => {
    const selectedSections = outline.filter(s => s.selected);
    if (selectedSections.length === 0) {
      setError('Please select at least one section to generate');
      return;
    }

    setIsGeneratingContent(true);
    setGenerationProgress(0);
    setError('');

    try {
      for (let i = 0; i < selectedSections.length; i++) {
        const section = selectedSections[i];
        setGenerationProgress((i / selectedSections.length) * 100);
        
        if (!section.content) {
          await handleGenerateSection(section.id);
        }
      }

      setGenerationProgress(100);
      setCurrentStep(3);
    } catch (error: any) {
      setError(error.message || 'Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
      setGenerationProgress(0);
    }
  };

  const handleExport = (format: 'markdown' | 'docx' | 'pdf') => {
    const selectedSections = outline.filter(s => s.selected && s.content);
    const fullContent = `# ${blogTitle}\n\n${selectedSections.map(section => 
      `## ${section.title}\n\n${section.content}`
    ).join('\n\n')}`;

    if (format === 'markdown') {
      const element = document.createElement('a');
      const file = new Blob([fullContent], { type: 'text/markdown' });
      element.href = URL.createObjectURL(file);
      element.download = `${blogTitle.toLowerCase().replace(/\s+/g, '-')}.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
    // Add DOCX and PDF export logic here
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Competitive Blog Generator
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Research top-ranking competitors and generate SEO-optimized content designed to rank #1 in search results
        </p>
      </div>

      {/* Blog Title Input */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Enter Your Blog Topic</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Blog Title or Topic *
            </label>
            <textarea
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              placeholder="e.g., 'Best React Hooks for State Management' or 'Complete Guide to Machine Learning'"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-2">
              Enter a specific topic or title. The more specific, the better the competitive analysis.
            </p>
          </div>

          {/* Quick Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Tone
              </label>
              <select
                value={settings.tone}
                onChange={(e) => setSettings(prev => ({ ...prev, tone: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual & Friendly</option>
                <option value="technical">Technical & Detailed</option>
                <option value="authoritative">Authoritative</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <select
                value={settings.targetAudience}
                onChange={(e) => setSettings(prev => ({ ...prev, targetAudience: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="general">General Audience</option>
                <option value="beginners">Beginners</option>
                <option value="intermediate">Intermediate</option>
                <option value="experts">Experts/Professionals</option>
                <option value="business">Business Decision Makers</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Keywords (Optional)
            </label>
            <input
              type="text"
              value={settings.seoKeywords}
              onChange={(e) => setSettings(prev => ({ ...prev, seoKeywords: e.target.value }))}
              placeholder="e.g., react hooks, state management, javascript"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate keywords with commas. Leave empty for automatic keyword extraction.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {isResearching && (
          <div className="mt-6 space-y-4">
            <ProgressBar 
              progress={researchProgress} 
              message="Researching competitors and generating outline..."
            />
            <div className="flex items-center justify-center space-x-2 text-purple-600">
              <Search className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-medium">Analyzing top-ranking content...</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleResearchAndOutline}
            disabled={!blogTitle.trim() || isResearching}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>{isResearching ? 'Researching...' : 'Research & Generate Outline'}</span>
          </button>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Competitor Analysis</h3>
          <p className="text-sm text-gray-600">
            Analyze top 10 ranking pages to understand what makes them successful
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">SEO Optimization</h3>
          <p className="text-sm text-gray-600">
            Generate content optimized to rank #1 and appear in Google snippets
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Smart Content</h3>
          <p className="text-sm text-gray-600">
            AI-powered content that outperforms competitors with better structure and depth
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Customize Your Outline</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BarChart3 className="w-4 h-4" />
            <span>{outline.filter(s => s.selected).length} sections selected</span>
          </div>
        </div>
        <p className="text-gray-600">
          Review and customize the AI-generated outline based on competitor analysis
        </p>
      </div>

      {/* Competitor Insights */}
      {competitors.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-blue-600" />
            Competitor Analysis Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.slice(0, 3).map((competitor, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600">Rank #{competitor.ranking}</span>
                  <span className="text-xs text-gray-500">{competitor.headings.length} sections</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                  {competitor.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {competitor.metaDescription}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Words per Section
            </label>
            <select
              value={settings.wordsPerSection}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, wordsPerSection: e.target.value }));
                const wordCount = wordLimits[e.target.value as keyof typeof wordLimits].words;
                setOutline(prev => prev.map(section => ({ ...section, wordCount })));
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {Object.entries(wordLimits).map(([key, { label, words }]) => (
                <option key={key} value={key}>
                  {label} (~{words} words)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Depth
            </label>
            <select
              value={settings.contentDepth}
              onChange={(e) => setSettings(prev => ({ ...prev, contentDepth: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="overview">Overview</option>
              <option value="detailed">Detailed</option>
              <option value="comprehensive">Comprehensive</option>
              <option value="expert">Expert Level</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice & Tone
            </label>
            <select
              value={settings.tone}
              onChange={(e) => setSettings(prev => ({ ...prev, tone: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual & Friendly</option>
              <option value="technical">Technical & Detailed</option>
              <option value="authoritative">Authoritative</option>
              <option value="conversational">Conversational</option>
            </select>
          </div>
        </div>
      </div>

      {/* Outline Sections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Blog Outline</h3>
          <div className="text-sm text-gray-600">
            Total: {outline.filter(s => s.selected).reduce((sum, s) => sum + s.wordCount, 0)} words
          </div>
        </div>

        <div className="space-y-4">
          {outline.map((section, index) => (
            <div
              key={section.id}
              className={`border rounded-lg p-4 transition-all ${
                section.selected 
                  ? 'border-purple-200 bg-purple-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="checkbox"
                    checked={section.selected}
                    onChange={() => handleSectionToggle(section.id)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleSectionEdit(section.id, 'title', e.target.value)}
                      className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-purple-300 focus:rounded px-2 py-1 flex-1"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{section.wordCount} words</span>
                      <input
                        type="number"
                        value={section.wordCount}
                        onChange={(e) => handleSectionEdit(section.id, 'wordCount', parseInt(e.target.value) || 300)}
                        className="w-20 p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                        min="100"
                        max="2000"
                        step="100"
                      />
                    </div>
                  </div>

                  <textarea
                    value={section.description}
                    onChange={(e) => handleSectionEdit(section.id, 'description', e.target.value)}
                    className="w-full p-2 text-sm text-gray-600 bg-transparent border border-gray-200 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={2}
                    placeholder="Section description..."
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => handleReorderSection(section.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                  <button
                    onClick={() => handleReorderSection(section.id, 'down')}
                    disabled={index === outline.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {isGeneratingContent && (
        <div className="space-y-4">
          <ProgressBar 
            progress={generationProgress} 
            message="Generating content for selected sections..."
          />
          <div className="flex items-center justify-center space-x-2 text-purple-600">
            <Bot className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">AI is creating your content...</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Research
        </button>

        <button
          onClick={handleGenerateAllContent}
          disabled={outline.filter(s => s.selected).length === 0 || isGeneratingContent}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
        >
          <Bot className="w-4 h-4" />
          <span>{isGeneratingContent ? 'Generating...' : 'Generate Content'}</span>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Generated Content</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleExport('markdown')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          Review and edit your generated content. Each section can be edited inline.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {outline.filter(s => s.selected).map((section) => (
          <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
              <div className="flex items-center space-x-2">
                {section.content ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <button
                    onClick={() => handleGenerateSection(section.id)}
                    disabled={section.isGenerating}
                    className="flex items-center px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    {section.isGenerating ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        Generate
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {section.content ? (
              <div className="prose max-w-none">
                <textarea
                  value={section.content}
                  onChange={(e) => handleSectionEdit(section.id, 'content', e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                  rows={Math.max(6, section.content.split('\n').length)}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Content will appear here once generated</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Outline
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport('markdown')}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Markdown
          </button>
          <Link
            to="/wordpress"
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <Globe className="w-4 h-4 mr-2" />
            Publish to WordPress
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[
            { number: 1, title: 'Research & Outline', icon: Search },
            { number: 2, title: 'Customize Outline', icon: Edit3 },
            { number: 3, title: 'Generate Content', icon: Bot }
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-purple-600' : 'text-gray-400'
                  }`}>
                    Step {step.number}
                  </p>
                  <p className={`text-sm ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < 2 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-purple-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </div>
  );
};

export default CompetitiveBlogGenerator;