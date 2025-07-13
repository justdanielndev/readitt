# Readitt

Readitt is a website that enables users to create, read, and interact with AI-generated stories across various fandoms. In addition, it is able to record user interactions and use them to fill a dataset for research purposes. Readitt uses Claude as the main AI model.

## Features

- AI Story Generation
- Chapter voting to decide story direction
- Multi-fandom and language support
- Slack auth
- Chapter management for creators
- Social features like comments, reactions, and playlists
- Content warnings and age ratings
- User analytics and research capabilities

## Tech Stack

### Frontend
- Next.js 15.3.4
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React

### Backend
- Supabase
- Claude
- Slack API
- AI Horde
- Airtable

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/justdanielndev/readitt
   cd readitt
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:

   NEXT_PUBLIC_SUPABASE_URL

   NEXT_PUBLIC_SUPABASE_ANON_KEY

   ANTHROPIC_API_KEY

   SLACK_CLIENT_ID

   SLACK_CLIENT_SECRET

   SLACK_STATE_SECRET

   JWT_SECRET

   NEXTAUTH_URL

   AI_HORDE_API_KEY

   AIRTABLE_API_KEY

   AIRTABLE_BASE_ID

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor as well as migrations

5. **Configure Slack App**
   - Create a Slack app at api.slack.com
   - Configure OAuth redirect URLs
   - Add required OAuth scopes

6. **Run the development server**
   ```bash
   pnpm dev
   ```

   Readitt will be available at `http://localhost:3001`

   ### Warning

   Readitt is not in a state in which I can recommend it being run in a big production environment, as many features are in development, constantly change and can have some inconsistencies.
