import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Key, Globe, Bell, Shield, Palette, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    profile: {
      name: '',
      email: '',
      company: ''
    },
    preferences: {
      defaultLanguage: 'english',
      defaultTone: 'professional',
      defaultLength: '3000',
      autoSave: true,
      emailNotifications: true
    },
    ai: {
      apiKey: '',
      provider: 'openai',
      model: 'gpt-4',
      creativity: 'balanced',
      includeImages: true,
      seoOptimization: true
    }
  });

  const [apiKeyValidation, setApiKeyValidation] = useState({
    isValidating: false,
    isValid: false,
    error: '',
    provider: ''
  });

  const [availableModels, setAvailableModels] = useState([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiService.getCurrentUser();
        const userData = response.data;
        
        setSettings({
          profile: {
            name: userData.name || '',
            email: userData.email || '',
            company: userData.company || ''
          },
          preferences: userData.preferences || settings.preferences,
          ai: userData.aiSettings || settings.ai
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Detect API key provider based on key format
  const detectProvider = (apiKey: string) => {
    if (apiKey.startsWith('sk-')) return 'openai';
    if (apiKey.startsWith('claude-')) return 'anthropic';
    if (apiKey.startsWith('goog-')) return 'google';
    return 'unknown';
  };

  // API key validation
  const validateApiKey = async (apiKey: string) => {
    if (!apiKey.trim()) {
      setApiKeyValidation({
        isValidating: false,
        isValid: false,
        error: '',
        provider: ''
      });
      setAvailableModels([]);
      return;
    }

    setApiKeyValidation(prev => ({ ...prev, isValidating: true, error: '' }));

    try {
      const provider = detectProvider(apiKey);
      
      // Validate API key
      const validationResponse = await apiService.validateApiKey(apiKey, provider);
      
      if (validationResponse.data.isValid) {
        // Fetch available models
        const modelsResponse = await apiService.getAvailableModels(apiKey, provider);
        
        setApiKeyValidation({
          isValidating: false,
          isValid: true,
          error: '',
          provider: provider
        });
        
        setAvailableModels(modelsResponse.data);
        
        // Set default model if current model is not available
        if (!modelsResponse.data.find((m: any) => m.id === settings.ai.model)) {
          setSettings(prev => ({
            ...prev,
            ai: { ...prev.ai, model: modelsResponse.data[0]?.id || 'gpt-4', provider }
          }));
        }
      } else {
        throw new Error(validationResponse.data.error || 'Invalid API key');
      }

    } catch (error: any) {
      setApiKeyValidation({
        isValidating: false,
        isValid: false,
        error: error.message || 'Failed to validate API key',
        provider: ''
      });
      setAvailableModels([]);
    }
  };

  // Debounced API key validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateApiKey(settings.ai.apiKey);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [settings.ai.apiKey]);

  const handleProfileChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const handlePreferenceChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const handleAIChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      ai: { ...prev.ai, [field]: value }
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save profile
      await apiService.updateProfile(settings.profile);
      
      // Save preferences
      await apiService.updatePreferences(settings.preferences);
      
      // Save AI settings
      await apiService.updateAISettings(settings.ai);
      
      // Show success message (you can add a toast notification here)
      console.log('Settings saved successfully');
      
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      // Show error message (you can add a toast notification here)
    } finally {
      setIsSaving(false);
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'anthropic': return 'Anthropic';
      case 'google': return 'Google';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and AI content generation settings</p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={settings.profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <input
                type="text"
                value={settings.profile.company}
                onChange={(e) => handleProfileChange('company', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Content Preferences</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
              <select
                value={settings.preferences.defaultLanguage}
                onChange={(e) => handlePreferenceChange('defaultLanguage', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="italian">Italian</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Tone</label>
              <select
                value={settings.preferences.defaultTone}
                onChange={(e) => handlePreferenceChange('defaultTone', e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Length</label>
              <select
                value={settings.preferences.defaultLength}
                onChange={(e) => handlePreferenceChange('defaultLength', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1500">Short (1,500 words)</option>
                <option value="3000">Medium (3,000 words)</option>
                <option value="5000">Long (5,000 words)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Auto-save drafts</h4>
                <p className="text-sm text-gray-600">Automatically save your work as you type</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preferences.autoSave}
                  onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Email notifications</h4>
                <p className="text-sm text-gray-600">Receive updates about your content generation</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preferences.emailNotifications}
                  onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">AI Generation Settings</h2>
          </div>
          
          {/* API Key Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-2 mb-4">
              <Key className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">API Key Configuration</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.ai.apiKey}
                    onChange={(e) => handleAIChange('apiKey', e.target.value)}
                    placeholder="Enter your OpenAI, Anthropic, or Google API key..."
                    className={`w-full p-3 pr-20 border rounded-lg focus:ring-2 focus:border-transparent ${
                      apiKeyValidation.isValid 
                        ? 'border-green-300 focus:ring-green-500' 
                        : apiKeyValidation.error 
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
                    {apiKeyValidation.isValidating && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {apiKeyValidation.isValid && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {apiKeyValidation.error && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {apiKeyValidation.isValid && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Valid {getProviderName(apiKeyValidation.provider)} API key detected</span>
                  </div>
                )}
                
                {apiKeyValidation.error && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{apiKeyValidation.error}</span>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Supports OpenAI (sk-...), Anthropic (claude-...), and Google (goog-...) API keys
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
              <select
                value={settings.ai.model}
                onChange={(e) => handleAIChange('model', e.target.value)}
                disabled={!apiKeyValidation.isValid || availableModels.length === 0}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {availableModels.length > 0 ? (
                  availableModels.map((model: any) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))
                ) : (
                  <option value="">No models available - Add valid API key</option>
                )}
              </select>
              {!apiKeyValidation.isValid && (
                <p className="text-xs text-gray-500 mt-1">
                  Add a valid API key to see available models
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Creativity Level</label>
              <select
                value={settings.ai.creativity}
                onChange={(e) => handleAIChange('creativity', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="creative">Creative</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Include AI-generated images</h4>
                <p className="text-sm text-gray-600">Automatically generate relevant images for content sections</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ai.includeImages}
                  onChange={(e) => handleAIChange('includeImages', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">SEO optimization</h4>
                <p className="text-sm text-gray-600">Automatically optimize content for search engines</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ai.seoOptimization}
                  onChange={(e) => handleAIChange('seoOptimization', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;