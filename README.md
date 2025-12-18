# AI Planning Assistant

A web application that uses AI to help users plan and organize their goals, projects, and tasks.

## Project Structure

```
ai_planning_assistant/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main API application
│   ├── ai_service.py       # AI integration service
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
├── frontend/               # Frontend web application
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Styling
│   └── app.js              # JavaScript application logic
└── README.md               # This file
```

## Features

- 🤖 AI-powered planning assistance
- 📝 Generate detailed plans from user prompts
- ✅ Extract and manage tasks
- 💾 Save and organize tasks
- 📤 Export plans as text files
- 🎨 Clean, modern UI

## Setup Instructions

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

5. **Run the backend server:**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Serve the frontend:**
   
   You can use any static file server. Here are a few options:
   
   **Option 1: Python's built-in server:**
   ```bash
   python3 -m http.server 8080
   ```
   
   **Option 2: Node.js http-server (if you have Node installed):**
   ```bash
   npx http-server -p 8080
   ```
   
   **Option 3: VS Code Live Server extension**
   - Install the "Live Server" extension
   - Right-click on index.html and select "Open with Live Server"

3. **Access the application:**
   Open your browser and go to `http://localhost:8080`

## AI Integration

The backend is set up to integrate with various AI providers. To enable AI functionality:

1. **Choose your AI provider** (OpenAI, Anthropic, etc.)

2. **Install the provider's SDK:**
   ```bash
   # For OpenAI
   pip install openai
   
   # For Anthropic
   pip install anthropic
   ```

3. **Add your API key to `.env`:**
   ```
   OPENAI_API_KEY=your_key_here
   # or
   ANTHROPIC_API_KEY=your_key_here
   ```

4. **Uncomment and implement the AI calls in `ai_service.py`**

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/generate-plan` - Generate a plan from a prompt
- `POST /api/tasks` - Add a new task
- `GET /api/tasks` - Get all tasks

## Development

### Adding New Features

1. **Backend**: Add new endpoints in `main.py` or create new modules
2. **Frontend**: Extend `app.js` with new functionality
3. **AI Service**: Enhance `ai_service.py` with new AI capabilities

### Next Steps

- [ ] Implement database for persistent storage (SQLite, PostgreSQL)
- [ ] Add user authentication
- [ ] Implement task prioritization and scheduling
- [ ] Add calendar integration
- [ ] Create task dependencies and subtasks
- [ ] Add progress tracking and analytics
- [ ] Implement real-time collaboration features
- [ ] Add mobile-responsive design improvements

## Technologies Used

- **Backend**: Python, FastAPI, Pydantic
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI Integration**: OpenAI/Anthropic APIs (configurable)

## License

MIT License
