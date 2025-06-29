import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  outline: {
    type: String
  },
  status: {
    type: String,
    enum: ['generating', 'draft', 'completed', 'published'],
    default: 'draft'
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      default: 0
    },
    language: {
      type: String,
      default: 'english'
    },
    tone: {
      type: String,
      default: 'professional'
    },
    targetLength: {
      type: String,
      default: '3000'
    }
  },
  seo: {
    keywords: [String],
    metaDescription: String,
    score: {
      type: Number,
      default: 0
    },
    suggestions: [String]
  },
  generation: {
    prompt: String,
    model: String,
    provider: String,
    generationTime: Number,
    tokensUsed: Number
  },
  uploadedFiles: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    extractedText: String
  }],
  images: [{
    url: String,
    alt: String,
    caption: String,
    section: String
  }],
  wordpress: {
    postId: Number,
    url: String,
    publishedAt: Date,
    status: String
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    engagement: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Calculate word count and reading time before saving
contentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
    this.metadata.wordCount = wordCount;
    this.metadata.readingTime = Math.ceil(wordCount / 200); // Average reading speed
  }
  next();
});

// Index for search
contentSchema.index({ title: 'text', content: 'text' });
contentSchema.index({ user: 1, createdAt: -1 });
contentSchema.index({ status: 1 });

export default mongoose.model('Content', contentSchema);