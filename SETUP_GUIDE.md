
# Kruthika Chat App Setup Guide

## Current Setup: Supabase (with Firebase preparation for future)

### 1. Environment Variables Setup

Create a `.env.local` file in the root directory with these variables:

```env
# Supabase Configuration (Primary - Currently Active)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google AI Configuration
GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here

# Future Firebase Configuration (Keep for migration)
# NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### 2. Supabase Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Messages log table
CREATE TABLE IF NOT EXISTS messages_log (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT NOT NULL,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily activity log table
CREATE TABLE IF NOT EXISTS daily_activity_log (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, date)
);

-- App configurations table
CREATE TABLE IF NOT EXISTS app_configurations (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now - improve security later)
CREATE POLICY "Allow all operations" ON messages_log FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON daily_activity_log FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON app_configurations FOR ALL USING (true);
```

### 3. Getting Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → API
3. Copy your Project URL and anon/public key
4. Update your `.env.local` file

### 4. Current App Features

**✅ Working Features:**
- AI Chat with Maya character
- Real-time messaging
- Admin dashboard (basic)
- Multi-language support
- Responsive design
- Analytics tracking
- Ad integration ready

**🔄 Future Migration Path:**
- The app is designed to easily switch from Supabase to Firebase
- Firebase code is already present but inactive
- Database schemas are compatible

### 5. Production Deployment

The app is configured for Replit deployment with:
- Build command: `npm run build`
- Run command: `npm start`
- Port 5000 for development
- Security headers enabled
- TypeScript and ESLint validation

### 6. Performance Optimizations

- React Query for caching
- Image optimization for avatars
- Lazy loading components
- Minimal bundle size

This setup prioritizes Supabase while keeping Firebase ready for future migration.
