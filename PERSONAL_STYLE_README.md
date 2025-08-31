# Personal Style Feature - AI Lyrics Generator

## Overview

The Personal Style feature allows premium members to upload their own lyrics as reference material for AI generation. This helps the AI understand the user's writing style, vocabulary preferences, and creative approach.

## Features

### For Premium Members Only
- Upload up to 5 personal lyrics
- Each lyric has a maximum of 500 words
- Title limit: 100 characters
- Support for multiple languages
- Optional music style categorization

### AI Integration
- When generating lyrics, users can select a personal style
- The AI will use the selected style as a reference for:
  - Tone and voice
  - Vocabulary choices
  - Writing approach
  - Style consistency

## Database Schema

### SQL Execution Order

**🔴 Required (Core Functionality):**
1. Create table structure
2. Create indexes for performance
3. Enable Row Level Security (RLS)
4. Create RLS policies for security

**🟡 Recommended (Enhanced Features):**
5. Update timestamp trigger (auto-maintains `updated_at`)
6. Word count function (auto-calculates word count)
7. Word count validation trigger (enforces 500-word limit)

**🟢 Optional (Verification):**
8. Verify table creation
9. Verify RLS policies

### Complete Schema

```sql
CREATE TABLE personal_styles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  music_style TEXT,
  language TEXT DEFAULT 'English',
  word_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT max_personal_styles_per_user CHECK (
    (SELECT COUNT(*) FROM personal_styles ps2 WHERE ps2.user_id = user_id) <= 5
  ),
  CONSTRAINT max_lyrics_length CHECK (char_length(lyrics) <= 500),
  CONSTRAINT max_title_length CHECK (char_length(title) <= 100)
);
```

## API Endpoints

### GET /api/personal-styles
- Fetch all personal styles for the authenticated user
- Requires premium membership

### POST /api/personal-styles
- Create a new personal style
- Requires premium membership
- Validates limits (max 5 styles per user)

### PUT /api/personal-styles/[id]
- Update an existing personal style
- Requires premium membership
- User can only edit their own styles

### DELETE /api/personal-styles/[id]
- Delete a personal style
- Requires premium membership
- User can only delete their own styles

### GET /api/personal-styles/user
- Fetch user's personal styles for selection in generation form
- Returns minimal data (id, title, music_style, language)
- Requires premium membership

## Frontend Integration

### Personal Style Page
- Located at `/personal-style`
- Only accessible to premium members
- Features:
  - Upload form with validation
  - Edit existing styles
  - Delete styles
  - Word count display
  - Language selection

### Generation Form Integration
- Personal style dropdown in `/generate` page
- Only visible to premium members with uploaded styles
- Shows selected style information
- Passes personalStyleId to AI generation

## AI Prompt Enhancement

When a personal style is selected, the AI prompt includes:

```
PERSONAL STYLE EXAMPLE:
Title: [User's Title]
Music Style: [User's Music Style]
Language: [User's Language]
Lyrics:
[User's Complete Lyrics]

Please use this personal style as a reference for tone, vocabulary, and writing approach.
```

## Security Features

- Row Level Security (RLS) enabled
- Users can only access their own personal styles
- Premium membership verification on all endpoints
- Input validation and sanitization
- Automatic word count calculation

## Usage Flow

1. **Premium User** navigates to `/personal-style`
2. **Uploads** up to 5 personal lyrics
3. **Returns** to `/generate` page
4. **Selects** personal style from dropdown
5. **Generates** lyrics with AI using personal style reference
6. **AI** incorporates user's writing style into generation

## Benefits

- **Personalization**: AI generates lyrics that match user's style
- **Consistency**: Maintains user's unique voice across generations
- **Learning**: AI improves understanding of user preferences over time
- **Quality**: Better alignment between user expectations and AI output

## Technical Implementation

- **Database**: PostgreSQL with RLS policies
- **API**: Next.js API routes with Supabase integration
- **Frontend**: React with TypeScript and Tailwind CSS
- **AI**: Google Gemini API with enhanced prompts
- **Validation**: Client and server-side validation
- **Security**: Authentication and authorization checks

## Future Enhancements

- Style analysis and categorization
- Collaborative style sharing
- Style templates and presets
- Advanced style matching algorithms
- Style performance metrics
