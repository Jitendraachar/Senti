# Sentiment Analyzer

A full-stack sentiment analysis application powered by HuggingFace AI that analyzes user text input, provides intelligent suggestions, and displays beautiful visualizations of mood trends.

## Features

✨ **AI-Powered Sentiment Analysis** - Uses HuggingFace transformers to analyze text sentiment (positive/negative/neutral)

📔 **Personal Journals** - Write daily journal entries with automatic sentiment analysis and mood tracking

🔐 **Secure Authentication** - JWT-based login and registration system

💡 **Smart Suggestions** - Context-aware recommendations based on your sentiment

📊 **Live Dashboard** - Real-time statistics with interactive charts (Pie, Line, Bar)

📈 **Trend Tracking** - Historical sentiment analysis over time

🎨 **Modern UI** - Glassmorphism design with smooth animations and dark mode

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **MongoDB** + **Mongoose** - Database and ODM
- **@xenova/transformers** - HuggingFace AI models for sentiment analysis
- **JWT** + **bcryptjs** - Authentication and security

### Frontend
- **React** + **Vite** - Fast modern UI framework
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first styling
- **Chart.js** + **react-chartjs-2** - Data visualization
- **Axios** - HTTP client

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or remote connection)
- npm or yarn

## Installation

### 1. Clone or navigate to the project
```bash
cd d:\FocusMate\sentiment_analyzer
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file (or use the existing one):
```env
MONGODB_URI=mongodb://localhost:27017/sentiment_app
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## Running the Application

### Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if installed as service)
net start MongoDB

# Or run manually
mongod
```

### Start Backend Server
```bash
cd backend
npm start
```
Server will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

## Usage

1. **Register** - Create a new account at `/register`
2. **Login** - Sign in with your credentials at `/login`
3. **Dashboard** - View your statistics and trends at `/dashboard`
4. **Journals** - Write and manage journal entries at `/journals`
5. **Analyze** - Quick sentiment analysis at `/analyzer`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Journals
- `POST /api/journals` - Create new journal entry (requires auth)
- `GET /api/journals` - Get all journals with pagination/filtering (requires auth)
- `GET /api/journals/:id` - Get single journal entry (requires auth)
- `PUT /api/journals/:id` - Update journal entry (requires auth)
- `DELETE /api/journals/:id` - Delete journal entry (requires auth)
- `GET /api/journals/stats/summary` - Get journal statistics (requires auth)

### Analysis
- `POST /api/analyze` - Analyze text sentiment (requires auth)
- `GET /api/history` - Get analysis history (requires auth)

### Dashboard
- `GET /api/dashboard/stats` - Get user statistics (requires auth)
- `GET /api/dashboard/trend?days=7` - Get sentiment trend (requires auth)

## Project Structure

```
sentiment_analyzer/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Analysis.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── analyze.js
│   │   └── dashboard.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Analyzer.jsx
    │   │   └── Dashboard.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Features in Detail

### Sentiment Analysis
- Powered by HuggingFace's pre-trained sentiment analysis models
- Returns sentiment label (positive/negative/neutral) with confidence score
- Generates contextual suggestions based on detected sentiment

### Dashboard Analytics
- **Total Analyses** - Count of all sentiment analyses performed
- **Sentiment Distribution** - Pie chart showing positive/negative/neutral breakdown
- **Sentiment Trend** - Line chart showing mood changes over time
- **Daily Breakdown** - Bar chart with daily sentiment counts
- **Auto-refresh** - Dashboard updates every 30 seconds

### Security
- Passwords hashed with bcryptjs
- JWT tokens with 7-day expiration
- Protected routes requiring authentication
- CORS enabled for cross-origin requests

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses --watch flag for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite hot module replacement
```

### Build for Production
```bash
cd frontend
npm run build
```

## Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check MONGODB_URI in `.env` file
- Verify MongoDB is accessible on the specified port

**HuggingFace Model Loading**
- First analysis may take longer as models download
- Subsequent analyses will be faster (models cached)
- Ensure stable internet connection for initial model download

**Port Already in Use**
- Change PORT in backend `.env` file
- Change port in frontend `vite.config.js`

## License

MIT

## Author

Built with ❤️ using modern web technologies
