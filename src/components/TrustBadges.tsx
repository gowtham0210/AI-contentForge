import React from 'react';
import { Shield, Award, Users, Zap } from 'lucide-react';

const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      subtitle: 'SOC 2 Compliant'
    },
    {
      icon: Award,
      title: '99.9% Uptime',
      subtitle: 'Guaranteed SLA'
    },
    {
      icon: Users,
      title: '10K+ Users',
      subtitle: 'Trusted Worldwide'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      subtitle: '<60 Second Generation'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
        Trusted by Content Creators Worldwide
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{badge.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{badge.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrustBadges;