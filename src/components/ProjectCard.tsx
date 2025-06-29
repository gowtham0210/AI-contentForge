import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, BarChart3, Globe, Edit3 } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  status: 'completed' | 'draft' | 'generating';
  wordCount: number;
  createdAt: string;
  language: string;
  seoScore: number;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'draft':
        return 'Draft';
      case 'generating':
        return 'Generating...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {project.title}
          </h3>
          <div className="flex items-center space-x-2 mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
            {project.status === 'generating' && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
        <FileText className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Edit3 className="w-4 h-4" />
            <span>{project.wordCount.toLocaleString()} words</span>
          </div>
          <div className="flex items-center space-x-1">
            <Globe className="w-4 h-4" />
            <span>{project.language}</span>
          </div>
        </div>
        
        {project.seoScore > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <BarChart3 className="w-4 h-4" />
              <span>SEO Score: {project.seoScore}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        {project.status === 'completed' || project.status === 'draft' ? (
          <Link
            to={`/editor/${project.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Edit Content
          </Link>
        ) : (
          <div className="flex-1 bg-gray-100 text-gray-400 text-center py-2 px-4 rounded-lg text-sm font-medium">
            Generating...
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;