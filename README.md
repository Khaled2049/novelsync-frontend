# NovelSync

An AI-powered novel writing platform that helps writers create, organize, and enhance their stories with intelligent agents and collaborative features.

## Features

### Story Writing & Management
- **Rich Text Editor**: Powered by TipTap with advanced formatting options
- **Story Organization**: Create and manage multiple stories with chapters
- **Auto-save**: Automatic saving of your work
- **Writing Statistics**: Track your writing progress and statistics

### AI-Powered Writing Agents
NovelSync features three intelligent co-author agents:

1. **Brainstorming Agent**
   - Generates fresh ideas for characters, plots, places, and themes
   - Creates complex scenarios and plot twists
   - Provides instant brainstorming suggestions

2. **Context Creator Agent**
   - Generates the perfect next line of dialogue or description
   - Uses your existing lore, characters, and plot context
   - Maintains consistency throughout your story

3. **Book Recommendation Agent**
   - Analyzes your finished work
   - Suggests books and genres to your target audience
   - Connects your work to the right readers

### Story Elements Management
- **Characters**: Create detailed character profiles with roles, descriptions, and relationships
- **Plots**: Organize plotlines, conflicts, twists, and subplots
- **Places**: Track and describe locations in your story world
- **Timeline**: Visual plot timeline to organize story events

### Social & Community Features
- **Book Clubs**: Join or create book clubs for discussions
- **Explore Section**: Discover stories, categories, and writing resources
- **Comments**: Comment system for stories and chapters
- **Leaderboards**: Track achievements and rankings
- **Challenges**: Participate in writing challenges
- **Events**: Stay updated with writing events

### Library Management
- **Personal Library**: Organize your reading list
- **Book Search**: Search and add books using Google Books API
- **Book Details**: View detailed information about books

### User Experience
- **Dark/Light Theme**: Toggle between themes
- **Responsive Design**: Works seamlessly on desktop and mobile
- **AI Usage Tracking**: Monitor your AI usage with progress indicators
- **Real-time Updates**: Live updates for collaborative features

## Architecture

NovelSync is built with a modern, scalable architecture:

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **TipTap** for rich text editing
- **React Router** for navigation
- **Firebase SDK** for authentication and real-time data

### Backend
- **Firebase Functions** (TypeScript) - Serverless API endpoints
- **Firestore** - NoSQL database for stories, users, and metadata
- **Firebase Authentication** - User authentication and authorization
- **Firebase Hosting** - Static site hosting

### AI Agents
- **Python FastAPI** service deployed on Google Cloud Run
- **Google AI Studio API** - Uses Gemini models (gemini-2.0-flash-exp)
- **Asynchronous Job Processing** - Handles long-running AI generation tasks
- **Context-Aware Generation** - Uses story context for consistent output

### Infrastructure
- **GitHub Actions** - CI/CD pipelines for automated deployments
- **Cloud Run** - Containerized Python agents with auto-scaling
- **Firebase Hosting** - CDN-backed static hosting with preview deployments

## Documentation

Comprehensive documentation is available for different aspects of the project:

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete guide for setting up CI/CD and deploying all components
- **[CI/CD Setup Summary](./CI_CD_SETUP.md)** - Overview of GitHub Actions workflows and deployment process
- **[Cloud Build Costs](./CLOUD_BUILD_COSTS.md)** - Cost analysis and optimization recommendations
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference for all endpoints
- **[Agent API](./functions/AGENT_API.md)** - Documentation for AI agent endpoints
- **[Workflows Documentation](./.github/workflows/README.md)** - GitHub Actions workflows guide
- **[Local Development](./python/LOCAL_DEVELOPMENT.md)** - Guide for local development setup

## Tech Stack

### Frontend
- React 18.3
- TypeScript 5.2
- Vite 5.3
- TailwindCSS 3.4
- TipTap 2.5
- React Router 6.25
- Firebase 10.14

### Backend
- Firebase Functions 6.0
- Node.js 22
- TypeScript 5.7
- Firestore

### AI Agents
- Python 3.11
- FastAPI
- Google AI Studio API (Gemini)
- Firestore Admin SDK

### DevOps
- GitHub Actions
- Google Cloud Run
- Firebase Hosting
- Docker

## Getting Started

### Prerequisites
- Node.js 22+
- Python 3.11+
- Firebase CLI
- Google Cloud SDK (for Cloud Run deployment)
- Google AI Studio API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Khaled2049/novel-sync
   cd novel-sync
   ```

2. **Install frontend dependencies**
   ```bash
   yarn install
   ```

3. **Install Firebase Functions dependencies**
   ```bash
   cd functions
   yarn install
   ```

4. **Install Python agent dependencies**
   ```bash
   cd python/agents/storyAgent
   pip install -r requirements.txt
   ```

5. **Set up environment variables**
   - Create `.env` files as needed
   - Configure Firebase project settings
   - Set up Google AI Studio API key

6. **Run locally**
   ```bash
   # Frontend
   yarn dev
   
   # Firebase Functions (emulator)
   cd functions
   npm run emulator
   
   # Python Agents
   cd python
   python server.py
   ```

For detailed setup instructions, see the [Deployment Guide](./DEPLOYMENT.md) and [Local Development Guide](./python/LOCAL_DEVELOPMENT.md).

## 🔐 Environment Variables

**⚠️ Important**: See [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) for comprehensive secret management guidance and security best practices.

### Frontend (VITE_* - Client-Side, Publicly Visible)

**These are bundled into the client JavaScript and are publicly visible. Only use for safe, public configuration.**

- `VITE_FIREBASE_API_KEY` - Firebase API key (safe to expose - Firebase design)
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase Auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGE_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase Analytics measurement ID
- `VITE_FIREBASE_FUNCTIONS_REGION` - Firebase Functions region (default: us-central1)

**⚠️ Security**: Never expose sensitive API keys (like `BOOKS_API_KEY`) in `VITE_*` variables. Use backend proxy endpoints instead.

### Backend (Server-Side Only)

**These are only accessible in server-side code and never exposed to the client.**

#### Firebase Functions
- `AGENT_SERVICE_URL` - Cloud Run service URL
- `BOOKS_API_KEY` - Google Books API key (used by Books API proxy endpoint)

#### Cloud Run (Python Agents)
- `GOOGLE_CLOUD_PROJECT` - Google Cloud project ID
- `GOOGLE_AI_STUDIO_API_KEY` - Google AI Studio API key (⚠️ **Server-side only**)
- `GOOGLE_AI_STUDIO_MODEL` - AI model name (default: gemini-2.0-flash-exp)

## 📝 API Endpoints

### Story Generation
- `POST /generateStory` - Start asynchronous story generation
- `POST /generateChapter` - Generate a specific chapter
- `GET /jobStatus/:jobId` - Check generation job status
- `GET /storyJobs/:storyId` - Get all jobs for a story

### Brainstorming
- `POST /brainstormIdeas` - Generate brainstorming ideas (characters, plots, places, themes)
- `POST /brainstormCharacter` - Generate detailed character ideas
- `POST /brainstormPlot` - Generate plot ideas

### Context Management
- `GET /getStoryContext` - Retrieve all context for a story
- `POST /updateContext` - Update character, place, or plot context
- `GET /getData` - Get all stories with associated data

### Authentication
- `POST /authenticate` - Authenticate user and get Firebase ID token

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Deployment

NovelSync uses automated CI/CD with GitHub Actions:

- **Frontend**: Automatically deployed to Firebase Hosting on merge to `main`
- **Firebase Functions**: Deployed when `functions/**` changes
- **Python Agents**: Deployed to Cloud Run when `python/agents/**` changes
- **Preview Deployments**: Automatic preview URLs for pull requests

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[Add your license here]

## 👨‍💻 About the Developer

<!-- Fill in your information here -->
- **Name**: Khaled Hossain
- **Email**: khaledhossain.not@gmail.com
- **Resume**: https://khaled.codexn.com/
- **LinkedIn**: https://www.linkedin.com/in/khaledhossainn/

---

