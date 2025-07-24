# Todo App with AI Assistant

A modern task management application with AI integration for intelligent task planning and organization.

## Architecture Overview

This project uses a **monorepo structure** with separate frontend and backend applications:

```
yupix_challenge/
├── frontend/          # Next.js 15 application (React 19)
├── backend/           # Express.js REST API server
└── docker-compose.yml # MongoDB database container
```

### Architecture Decisions

1. **Monorepo Structure**: We chose a monorepo to keep frontend and backend code together while maintaining clear separation. This makes it easier to share types and coordinate changes.

2. **Tech Stack Choices**:
   - **Frontend**: Next.js 15 with App Router for modern React features and better performance
   - **Backend**: Express.js for a lightweight, flexible API server
   - **Database**: MongoDB for flexible document storage perfect for task data
   - **Real-time**: WebSocket integration for live AI chat functionality
   - **UI Components**: shadcn/ui for consistent, accessible components

3. **Authentication**: JWT tokens stored in HTTP-only cookies for security

4. **State Management**: 
   - Zustand for client-side state (simpler than Redux)
   - React Query for server state (automatic caching and updates)

5. **AI Integration**: OpenAI API with both REST endpoints and WebSocket for real-time streaming

## Ports

- **Frontend**: Runs on port `3000`
- **Backend**: Runs on port `5000`
- **MongoDB**: Runs on port `27017` (via Docker)

## Installation & Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Docker Desktop (for MongoDB)

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd yupix_challenge
   ```

2. **Install all dependencies** (from root directory)
   ```bash
   npm install
   ```
   This will install dependencies for both frontend and backend.

3. **Set up environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```bash
   cd backend
   cp .env.example .env  # If example exists, otherwise create new
   ```
   
   **For Development** (Local MongoDB):
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/todoapp
   JWT_SECRET=your-secret-key-here
   EMAIL_FROM=noreply@yourapp.com
   OPENAI_API_KEY=sk-your-openai-api-key
   RESEND_API_KEY=your-resend-api-key
   ```
   
   **For Production** (MongoDB Atlas):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://dloot:tom12345@kai.nyjam5o.mongodb.net/?retryWrites=true&w=majority&appName=kai
   JWT_SECRET=your-production-secret-key-here
   EMAIL_FROM=noreply@yourapp.com
   OPENAI_API_KEY=sk-your-openai-api-key
   RESEND_API_KEY=your-resend-api-key
   ```

4. **Start MongoDB with Docker**
   ```bash
   # From root directory
   npm run docker:up
   ```
   This starts MongoDB in a Docker container.

5. **Run both services**
   ```bash
   # From root directory
   npm run dev
   ```
   
   This runs:
   - Frontend dev server on http://localhost:3000
   - Backend API server on http://localhost:5000
   - MongoDB on localhost:27017

### Alternative: Run Services Separately

If you prefer to run services individually:

1. **Terminal 1 - Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2 - Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Terminal 3 - MongoDB** (if not using Docker):
   ```bash
   mongod
   ```

## Development Scripts

### Root Directory Scripts
- `npm install` - Install all dependencies for both apps
- `npm run dev` - Start all services (MongoDB, backend, frontend)
- `npm run dev:no-docker` - Start without Docker (requires local MongoDB)
- `npm run docker:up` - Start MongoDB container
- `npm run docker:down` - Stop MongoDB container
- `npm run docker:logs` - View MongoDB logs

### Frontend Scripts (in frontend/)
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend Scripts (in backend/)
- `npm run dev` - Start with nodemon (port 5000)
- `npm run start` - Start production server

## API Endpoints

All API endpoints are prefixed with `http://localhost:5000/api`

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/reorder` - Reorder tasks

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### AI Integration
- `POST /api/ai/chat` - Send message to AI
- `WS ws://localhost:5000/ws/realtime` - WebSocket for real-time AI chat

## Features

- **Task Management**: Create, edit, delete, and reorder tasks with drag-and-drop
- **Categories**: Organize tasks into custom categories
- **Calendar View**: Visualize tasks on a monthly calendar
- **AI Assistant**: Chat with AI for task planning and suggestions
- **Real-time Updates**: WebSocket connection for instant AI responses
- **Authentication**: Secure user accounts with email verification

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
```bash
# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Failed
1. Check Docker is running: `docker ps`
2. Check MongoDB logs: `npm run docker:logs`
3. Ensure port 27017 is free

### Dependencies Not Installing
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   rm -rf frontend/node_modules frontend/package-lock.json
   rm -rf backend/node_modules backend/package-lock.json
   npm install
   ```

## Production Deployment

### Using MongoDB Atlas

The app is configured to automatically switch to MongoDB Atlas when `NODE_ENV=production`. The connection string is already set up for the Atlas cluster.

To run in production mode locally:
```bash
# Backend
cd backend
NODE_ENV=production npm start

# Frontend (in another terminal)
cd frontend
npm run build
npm start
```

### Environment Switching

The app automatically detects the environment:
- **Development**: Uses local MongoDB (localhost:27017)
- **Production**: Uses MongoDB Atlas cloud database

You can verify which database is connected by checking the backend console output:
- Development: "MongoDB connected (Development)"
- Production: "MongoDB Atlas connected (Production)"

## License

MIT License
