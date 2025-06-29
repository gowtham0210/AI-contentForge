import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, TrendingUp, Zap, Globe, Shield, Bot } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import StatsCard from '../components/StatsCard';
import TrustBadges from '../components/TrustBadges';
import { apiService } from '../services/api';

const Dashboard = () => {
  const [recentProjects, setRecentProjects] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalWords: 0,
    avgGenerationTime: 0,
    avgSeoScore: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user stats
        const statsResponse = await apiService.getUserStats();
        setStats(statsResponse.data.stats);
        
        // Fetch recent content
        const contentResponse = await apiService.getContent(1, 6);
        setRecentProjects(contentResponse.data.content);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsCards = [
    { label: 'Total Posts', value: stats.totalPosts.toString(), icon: FileText, color: 'blue' },
    { label: 'Words Generated', value: `${Math.round(stats.totalWords / 1000)}K`, icon: TrendingUp, color: 'green' },
    { label: 'Avg. Generation Time', value: `${stats.avgGenerationTime}s`, icon: Clock, color: 'purple' },
    { label: 'SEO Score', value: stats.avgSeoScore.toString(), icon: Zap, color: 'orange' }
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Generate Professional Content with AI
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Create high-quality technical blog posts up to 5,000 words in under 60 seconds. 
            Upload documents, optimize for SEO, and publish directly to WordPress.
          </p>
          <Link
            to="/wizard"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Bot className="w-5 h-5 mr-2" />
            Start Creating Content
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ultra-Fast Generation</h3>
          <p className="text-gray-600">Generate up to 5,000 words of technical content in under 60 seconds with AI assistance.</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">30+ Languages</h3>
          <p className="text-gray-600">Create content in over 30 languages with native-level fluency and cultural context.</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
          <p className="text-gray-600">Enterprise-grade security with encrypted document storage and data protection.</p>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
          <Link
            to="/wizard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </div>
        
        {recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project: any) => (
              <ProjectCard key={project._id} project={{
                id: project._id,
                title: project.title,
                status: project.status,
                wordCount: project.metadata.wordCount,
                createdAt: project.createdAt,
                language: project.metadata.language,
                seoScore: project.seo.score
              }} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Create your first AI-powered blog post to get started</p>
            <Link
              to="/wizard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Link>
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <TrustBadges />
    </div>
  );
};

export default Dashboard;