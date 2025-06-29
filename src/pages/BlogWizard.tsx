import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, FileText, Sparkles, Upload, Settings, Languages, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocumentUpload from '../components/DocumentUpload';
import ProgressBar from '../components/ProgressBar';

const BlogWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    topic: '',
    keywords: '',
    tone: 'professional',
    length: '3000',
    language: 'english',
    includeImages: true,
    seoOptimize: true,
    uploadedFiles: [] as File[]
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  const steps = [
    { number: 1, title: 'Topic & Settings', icon: Settings },
    { number: 2, title: 'Upload Documents', icon: Upload },
    { number: 3, title: 'Generate Content', icon: Bot }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      generateContent();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateContent = async () => {
    setIsGenerating(true);
    const steps = [
      'Analyzing topic and keywords...',
      'Researching current data...',
      'Generating outline...',
      'Creating content sections...',
      'Optimizing for SEO...',
      'Generating images...',
      'Finalizing content...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenerationStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsGenerating(false);
    // Redirect to editor with generated content
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Topic or Title
              </label>
              <textarea
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="Enter your blog topic, title, or describe what you want to write about..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Keywords (SEO)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                placeholder="e.g., react hooks, javascript, web development"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Content Tone
                </label>
                <select
                  value={formData.tone}
                  onChange={(e) => handleInputChange('tone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Target Length
                </label>
                <select
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1500">Short (1,500 words)</option>
                  <option value="3000">Medium (3,000 words)</option>
                  <option value="5000">Long (5,000 words)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Languages className="w-4 h-4 inline mr-1" />
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="italian">Italian</option>
                <option value="portuguese">Portuguese</option>
                <option value="chinese">Chinese</option>
                <option value="japanese">Japanese</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">AI-Generated Images</h4>
                  <p className="text-sm text-gray-600">Include relevant images for each section</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.includeImages}
                    onChange={(e) => handleInputChange('includeImages', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">SEO Optimization</h4>
                  <p className="text-sm text-gray-600">Optimize content for search engines</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.seoOptimize}
                    onChange={(e) => handleInputChange('seoOptimize', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload Reference Documents (Optional)
              </h3>
              <p className="text-gray-600 mb-6">
                Upload PDFs, DOCX, or TXT files to use as reference material for your blog content.
              </p>
            </div>
            <DocumentUpload 
              onFilesUploaded={(files) => handleInputChange('uploadedFiles', files)}
              maxFiles={5}
              acceptedTypes={['.pdf', '.docx', '.txt']}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Generate Your Content
              </h3>
              <p className="text-gray-600 mb-6">
                Review your settings and start generating your AI-powered blog content.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Topic:</span>
                  <p className="text-gray-600 mt-1">{formData.topic || 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Keywords:</span>
                  <p className="text-gray-600 mt-1">{formData.keywords || 'None'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Length:</span>
                  <p className="text-gray-600 mt-1">{formData.length} words</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Language:</span>
                  <p className="text-gray-600 mt-1 capitalize">{formData.language}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tone:</span>
                  <p className="text-gray-600 mt-1 capitalize">{formData.tone}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Files:</span>
                  <p className="text-gray-600 mt-1">{formData.uploadedFiles.length} uploaded</p>
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="space-y-4">
                <ProgressBar 
                  progress={Math.min((generationStep.length * 10), 100)} 
                  message={generationStep}
                />
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">AI is working on your content...</span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Blog Post</h1>
        <p className="text-gray-600">Follow the steps below to generate your AI-powered content</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    Step {step.number}
                  </p>
                  <p className={`text-sm ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`flex items-center px-6 py-3 rounded-lg font-medium ${
            currentStep === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={isGenerating || (currentStep === 1 && !formData.topic.trim())}
          className={`flex items-center px-6 py-3 rounded-lg font-medium ${
            isGenerating || (currentStep === 1 && !formData.topic.trim())
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {currentStep === 3 ? (
            <>
              <Bot className="w-4 h-4 mr-2" />
              Generate Content
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BlogWizard;