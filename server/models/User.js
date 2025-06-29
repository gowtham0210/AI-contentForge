import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  company: {
    type: String,
    trim: true
  },
  preferences: {
    defaultLanguage: {
      type: String,
      default: 'english'
    },
    defaultTone: {
      type: String,
      default: 'professional'
    },
    defaultLength: {
      type: String,
      default: '3000'
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  aiSettings: {
    apiKey: {
      type: String,
      select: false // Don't include in queries by default
    },
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'google'],
      default: 'openai'
    },
    model: {
      type: String,
      default: 'gpt-4'
    },
    creativity: {
      type: String,
      enum: ['conservative', 'balanced', 'creative'],
      default: 'balanced'
    },
    includeImages: {
      type: Boolean,
      default: true
    },
    seoOptimization: {
      type: Boolean,
      default: true
    }
  },
  wordpressSettings: {
    siteUrl: String,
    username: String,
    applicationPassword: {
      type: String,
      select: false
    },
    isConnected: {
      type: Boolean,
      default: false
    }
  },
  usage: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalWords: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    wordsLimit: {
      type: Number,
      default: 10000
    },
    wordsUsed: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last active
userSchema.methods.updateLastActive = function() {
  this.usage.lastActive = new Date();
  return this.save();
};

export default mongoose.model('User', userSchema);