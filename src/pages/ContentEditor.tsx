import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Copy, Eye, Edit3, Save, Settings, Image, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ContentEditor = () => {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(`# Complete Guide to React Hooks

## Introduction

React Hooks revolutionized how we write React components by allowing us to use state and other React features in functional components. This comprehensive guide will walk you through everything you need to know about React Hooks.

## What are React Hooks?

React Hooks are functions that let you "hook into" React state and lifecycle features from function components. They were introduced in React 16.8 and have become the standard way to write React components.

### Key Benefits:
- **Simpler Code**: No need for class components
- **Better Reusability**: Custom hooks for sharing logic
- **Improved Performance**: Optimized re-renders
- **Modern Patterns**: Embraces functional programming

## Core Hooks

### useState Hook

The \`useState\` hook allows you to add state to functional components:

\`\`\`javascript
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

### useEffect Hook

The \`useEffect\` hook lets you perform side effects in function components:

\`\`\`javascript
import React, { useState, useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(response => response.json())
      .then(data => setData(data));
  }, []); // Empty dependency array means this runs once

  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
}
\`\`\`

## Advanced Hooks

### useMemo Hook

Optimize expensive calculations:

\`\`\`javascript
const expensiveValue = useMemo(() => {
  return expensiveCalculation(props.data);
}, [props.data]);
\`\`\`

### useCallback Hook

Memoize functions to prevent unnecessary re-renders:

\`\`\`javascript
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
\`\`\`

## Best Practices

1. **Always use the dependency array** with useEffect
2. **Extract custom hooks** for reusable logic
3. **Use multiple state variables** instead of one complex object
4. **Follow the Rules of Hooks** - only call at the top level

## Performance Comparison

| Hook Type | Performance Impact | Use Case |
|-----------|-------------------|----------|
| useState | Low | Simple state management |
| useEffect | Medium | Side effects, API calls |
| useMemo | Variable | Expensive calculations |
| useCallback | Variable | Function memoization |

## Conclusion

React Hooks provide a powerful and elegant way to manage state and side effects in functional components. By following best practices and understanding when to use each hook, you can write more maintainable and performant React applications.

The adoption of hooks has transformed the React ecosystem, making it easier to share logic between components and write more testable code. As you continue your React journey, mastering hooks will be essential for building modern applications.
`);

  const [seoData] = useState({
    score: 92,
    wordCount: 3500,
    readingTime: 14,
    keywords: ['react hooks', 'useState', 'useEffect', 'javascript'],
    suggestions: [
      'Add more internal links',
      'Include more relevant keywords',
      'Optimize meta description'
    ]
  });

  const handleSave = () => {
    // Save logic here
    console.log('Saving content...');
  };

  const handleExport = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = 'blog-post.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Guide to React Hooks</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{seoData.wordCount.toLocaleString()} words</span>
              <span>{seoData.readingTime} min read</span>
              <span className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-1" />
                SEO Score: {seoData.score}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                isEditing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isEditing ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </button>
            
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
            
            <div className="relative">
              <button className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                <Share2 className="w-4 h-4 mr-2" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 hidden group-hover:block">
                <button
                  onClick={handleExport}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Markdown
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Copy className="w-4 h-4 inline mr-2" />
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {isEditing ? (
              <div className="p-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-screen resize-none border-none outline-none font-mono text-sm"
                  placeholder="Start writing your content in Markdown..."
                />
              </div>
            ) : (
              <div className="p-8 prose prose-lg max-w-none">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={tomorrow}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* SEO Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              SEO Analysis
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">SEO Score</span>
                  <span className="text-sm font-medium text-green-600">{seoData.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${seoData.score}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Words</span>
                  <p className="font-medium">{seoData.wordCount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Read Time</span>
                  <p className="font-medium">{seoData.readingTime} min</p>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Target Keywords</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {seoData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Suggestions</span>
                <ul className="mt-2 space-y-1">
                  {seoData.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Image className="w-4 h-4 mr-3 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Generate Images</span>
              </button>
              
              <button className="w-full flex items-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Settings className="w-4 h-4 mr-3 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">SEO Settings</span>
              </button>
              
              <Link
                to="/wordpress"
                className="w-full flex items-center px-4 py-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-3 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Publish to WordPress</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;