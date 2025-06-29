import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Settings, CheckCircle, AlertCircle, ExternalLink, Plus } from 'lucide-react';

const WordPressIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    siteUrl: '',
    username: '',
    password: ''
  });
  const [publishedPosts] = useState([
    {
      id: 1,
      title: 'Complete Guide to React Hooks',
      wpUrl: 'https://myblog.com/react-hooks-guide',
      publishedAt: '2024-01-15T10:30:00Z',
      status: 'published',
      views: 1240
    },
    {
      id: 2,
      title: 'Machine Learning Best Practices',
      wpUrl: 'https://myblog.com/ml-best-practices',
      publishedAt: '2024-01-14T14:20:00Z',
      status: 'published',
      views: 890
    }
  ]);

  const handleConnect = () => {
    // Simulate connection
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionForm({ siteUrl: '', username: '', password: '' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">WordPress Integration</h1>
        <p className="text-gray-600">Connect your WordPress site to publish content directly from AI ContentForge</p>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isConnected ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Globe className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">WordPress Connection</h3>
              <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-600'}`}>
                {isConnected ? 'Connected to myblog.com' : 'Not connected'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WordPress Site URL
                </label>
                <input
                  type="url"
                  value={connectionForm.siteUrl}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, siteUrl: e.target.value }))}
                  placeholder="https://yoursite.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={connectionForm.username}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Your WordPress username"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Password
              </label>
              <input
                type="password"
                value={connectionForm.password}
                onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="WordPress application password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate an application password in your WordPress admin under Users → Profile
              </p>
            </div>
            
            <button
              onClick={handleConnect}
              disabled={!connectionForm.siteUrl || !connectionForm.username || !connectionForm.password}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Connect to WordPress
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-800 font-medium">Successfully connected to WordPress!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                You can now publish your AI-generated content directly to your WordPress site.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium">
                <Plus className="w-4 h-4 inline mr-2" />
                Publish New Post
              </button>
              <button
                onClick={handleDisconnect}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Published Posts */}
      {isConnected && publishedPosts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Published Posts</h3>
          
          <div className="space-y-4">
            {publishedPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Published {new Date(post.publishedAt).toLocaleDateString()}</span>
                    <span>{post.views} views</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {post.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <a
                    href={post.wpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Post
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      {!isConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Setup Instructions</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p>Log in to your WordPress admin dashboard</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p>Go to Users → Profile and scroll down to "Application Passwords"</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p>Create a new application password with the name "AI ContentForge"</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <p>Copy the generated password and paste it in the form above</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordPressIntegration;