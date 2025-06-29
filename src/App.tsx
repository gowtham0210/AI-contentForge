import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import BlogWizard from './pages/BlogWizard';
import ContentEditor from './pages/ContentEditor';
import WordPressIntegration from './pages/WordPressIntegration';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthGuard>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/wizard" element={<BlogWizard />} />
                <Route path="/editor/:id" element={<ContentEditor />} />
                <Route path="/wordpress" element={<WordPressIntegration />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </AuthGuard>
      </Router>
    </AuthProvider>
  );
}

export default App;