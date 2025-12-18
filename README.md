# AI Planning Assistant

A powerful web application that uses AI to transform brain dumps and ideas into organized, hierarchical task trees. Perfect for project planning, task management, and turning chaotic thoughts into actionable plans.

## Project Structure

```
ai_planning_assistant/
├── backend/                      # Python FastAPI backend
│   ├── main.py                  # Main API application
│   ├── ai_client.py             # Multi-provider AI client (OpenAI/Gemini)
│   ├── interactive_planner.py   # Task tree generation logic
│   ├── planner_workflow.py      # Legacy LangGraph workflow
│   ├── ai_service.py            # AI integration utilities
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (not in git)
│   └── .env.example             # Environment variables template
├── frontend/                    # Frontend web application
│   ├── index.html              # Main HTML file
│   ├── styles.css              # Styling
│   ├── app.js                  # JavaScript application logic
│   └── images/                 # Image assets
└── README.md                    # This file
```

## Features

### Core Features
- 🤖 **AI-Powered Task Tree Generation** - Convert brain dumps into organized hierarchical structures
- 🎯 **Multi-Stage Planning** - Initial generation → User editing → Iterative refinement
- 🔄 **Interactive Editor** - Visual tree editor with collapsible categories and projects
- 📝 **Manual & AI To-Do Lists** - Generate to-do lists from your task tree (manual selection or AI-powered)
- 🎙️ **Voice Input** - Speech-to-text for hands-free brain dumping
- 📸 **Image OCR** - Extract text from handwritten notes or images using AI vision
- 📄 **File Upload** - Import text/Word documents to include in task generation
- 🔧 **JSON Editor** - Advanced editing with direct JSON manipulation
- 💾 **Local Storage** - Save task trees and to-do lists in your browser
- 📤 **Export** - Download task trees as formatted text files
- 🔌 **Multi-Provider AI** - Support for OpenAI (GPT-4o-mini) and Google Gemini (2.0 Flash)

### Unique Capabilities
- **Hierarchical Organization**: Category → Project → Task → Subtask structure
- **Dependency Tracking**: Track prerequisites and dependencies at all levels
- **Iterative Refinement**: Break down tasks that need more detail
- **ID-Based Tracking**: Unique IDs for all items, preserved across regenerations
- **Merge Functionality**: Add new brain dumps to existing task trees without losing progress

## Quick Start Guide

Follow these steps to run the AI Planning Assistant on your local machine.

### Step 1: Clone the Repository

```bash
git clone https://github.com/scohen40/ai-planning-assistant.git
cd ai-planning-assistant
```

### Step 2: Get Your API Keys

Before setting up the backend, you'll need at least one AI provider API key:

**Option A: OpenAI (Recommended for beginners)**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...`)
5. **Important:** Save it somewhere safe - you won't be able to see it again!

**Option B: Google Gemini (Free tier available)**
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the key (starts with `AIza...`)

### Step 3: Set Up the Backend

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment:**
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment:**
   
   On Mac/Linux:
   ```bash
   source venv/bin/activate
   ```
   
   On Windows:
   ```bash
   venv\Scripts\activate
   ```
   
   You should see `(venv)` appear in your terminal prompt.

4. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   This will take a minute or two.

5. **Create your environment file:**
   ```bash
   cp .env.example .env
   ```

6. **Add your API key to the .env file:**
   
   Open the `.env` file in a text editor and replace the placeholder with your actual API key:
   
   **If using OpenAI:**
   ```bash
   # AI Provider Selection (openai or gemini)
   AI_PROVIDER=openai
   
   # Model Selection
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
   ```
   
   **If using Gemini:**
   ```bash
   # AI Provider Selection (openai or gemini)
   AI_PROVIDER=gemini
   
   # Model Selection
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_API_KEY=AIzaYOUR_ACTUAL_KEY_HERE
   ```
   
   Save the file and close it.

7. **Start the backend server:**
   ```bash
   python3 -m uvicorn main:app --reload --port 8000
   ```
   
   You should see output like:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
   INFO:     Started reloader process
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   ```
   
   **Keep this terminal window open!** The backend needs to keep running.

### Step 4: Set Up the Frontend

1. **Open a NEW terminal window** (keep the backend running in the other one)

2. **Navigate to the frontend folder:**
   ```bash
   cd frontend  # If you're in the ai_planning_assistant root
   # OR
   cd ../frontend  # If you're still in the backend folder
   ```

3. **Start the frontend server:**
   ```bash
   python3 -m http.server 8080
   ```
   
   You should see:
   ```
   Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
   ```

### Step 5: Open the App

1. Open your web browser
2. Go to: **http://localhost:8080**
3. You should see the AI Planning Assistant interface!

### Step 6: Test It Out

1. Type something in the brain dump area, like:
   ```
   Learn Python
   Build a website
   Clean my room
   Study for exam
   ```

2. Click "Generate Task Tree"

3. Wait a few seconds while the AI organizes your tasks

4. You should see your tasks organized into a hierarchical tree!

### Stopping the App

When you're done:
1. Press `Ctrl+C` in both terminal windows to stop the servers
2. Type `deactivate` in the backend terminal to exit the Python virtual environment

### Next Time You Want to Run It

1. **Terminal 1 (Backend):**
   ```bash
   cd backend
   source venv/bin/activate  # Windows: venv\Scripts\activate
   python3 -m uvicorn main:app --reload --port 8000
   ```

2. **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   python3 -m http.server 8080
   ```

3. **Browser:** Go to http://localhost:8080

---

## Detailed Setup Instructions

### Prerequisites
- Python 3.10 or higher
- A modern web browser
- API keys for OpenAI and/or Google Gemini

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
   ```
   
   Edit `.env` and configure:
   ```bash
   # Choose your AI provider (openai or gemini)
   AI_PROVIDER=openai
   
   # Add your API keys
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional: LangSmith for tracing/debugging
   LANGSMITH_API_KEY=your_langsmith_key_here
   LANGSMITH_TRACING=true
   ```

5. **Run the backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   
   Or:
   ```bash
   python3 -m uvicorn main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Serve the frontend:**
   
   **Python's built-in server (recommended):**
   ```bash
   python3 -m http.server 8080
   ```
   
   **Alternative - VS Code Live Server extension:**
   - Install the "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

3. **Access the application:**
   Open your browser and go to `http://localhost:8080`

## How to Use

### Creating a Task Tree

1. **Brain Dump Input**
   - Type or paste your thoughts, goals, and tasks into the text area
   - Use the microphone button for voice input
   - Upload image files (handwritten notes, screenshots) for OCR
   - Upload text/Word files to include their content
   - Click "Generate Task Tree" to process

2. **Review and Edit**
   - The AI organizes your input into Categories → Projects → Tasks → Subtasks
   - Use the interactive editor to:
     - Expand/collapse sections
     - Edit names inline
     - Check boxes for tasks that need more detail
     - Switch to JSON editor for advanced editing

3. **Refine Tasks**
   - Select "Break down selected tasks" to refine specific items
   - Or "Break down all tasks" for complete refinement
   - The AI will add more detail and subtasks while preserving your edits

4. **Save Your Work**
   - Click "Save My Task Tree" when satisfied
   - Your tree is saved to browser local storage
   - Export as a text file for backup or sharing

### Creating To-Do Lists

1. **From the Sidebar**
   - Click "+ Create To-Do List"
   - Choose "Manual Selection" or "AI Generate"

2. **Manual Selection**
   - Pick specific tasks from your task tree
   - Create focused to-do lists for specific projects or contexts

3. **AI Generation**
   - Provide custom instructions (e.g., "only urgent tasks", "morning routine")
   - The AI intelligently selects and organizes tasks
   - Lists are independent of the main task tree

### Managing Multiple Brain Dumps

- Click "+ Add Another Brain Dump" to add more input areas
- Each can have voice input and file uploads
- All inputs are combined when generating the task tree
- Add to existing trees without losing progress

## AI Provider Configuration

The application supports multiple AI providers. Configure in `backend/.env`:

### OpenAI (Recommended)
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### Google Gemini

Available models (as of December 2025):
- `gemini-2.5-flash` - Latest stable, fast & versatile (Recommended)
- `gemini-2.5-pro` - Higher quality, slower
- `gemini-3-pro-preview` - Preview of next generation
- `gemini-flash-latest` - Always uses the latest Flash model

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash
```

**Note:** Free tier has rate limits. Paid Tier 1 API keys have much higher limits (1,000 RPM, 4M TPM).

## API Endpoints

### Health & Info
- `GET /` - Root endpoint with API info
- `GET /health` - Health check

### Task Tree Management
- `POST /api/create-task-tree` - Generate initial task tree from brain dump
  - Body: `{prompt: string, context?: string, existing_task_tree?: object}`
  - Returns: `{task_tree: object, formatted_tree: string, stage: "initial"}`

- `POST /api/refine-task-tree` - Refine/break down tasks in existing tree
  - Body: `{task_tree: object}`
  - Returns: `{task_tree: object, formatted_tree: string, stage: "refined"}`

### AI-Powered Features
- `POST /api/extract-text-from-image` - OCR using AI vision
  - Body: multipart/form-data with image file
  - Returns: `{text: string}`

- `POST /api/generate-todo` - Generate AI to-do list from task tree
  - Body: `{task_tree: object, custom_prompt?: string}`
  - Returns: `{todo_list: array, formatted: string}`

### Legacy
- `POST /api/generate-plan` - Legacy LangGraph workflow (deprecated)

## Architecture

### Backend (`backend/`)
- **FastAPI Framework** - Modern async Python web framework
- **ai_client.py** - Abstraction layer supporting multiple AI providers
- **interactive_planner.py** - Core task tree generation logic using structured outputs
- **planner_workflow.py** - Legacy LangGraph state machine workflow
- **Pydantic Models** - Strong typing for task tree structure

### Frontend (`frontend/`)
- **Vanilla JavaScript** - No framework dependencies
- **Web Speech API** - Browser-native voice recognition
- **LocalStorage** - Client-side persistence
- **Responsive Design** - Modern CSS with flexbox/grid

### AI Integration
- **Structured Outputs** - Uses Pydantic models for reliable JSON responses
- **Multi-Provider Support** - Abstracted client for easy provider switching
- **Automatic Fallbacks** - Handles rate limits gracefully
- **LangSmith Integration** - Optional tracing for debugging AI interactions

## Technologies Used

### Backend
- **Python 3.10+**
- **FastAPI** - Modern async web framework
- **Pydantic** - Data validation and structured outputs
- **LangChain** - AI orchestration framework
- **LangGraph** - State machine workflow (legacy feature)
- **OpenAI SDK** - GPT-4o-mini integration
- **Google Generative AI** - Gemini integration
- **Pillow** - Image processing for OCR
- **python-dotenv** - Environment configuration
- **Uvicorn** - ASGI server

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **Vanilla JavaScript** - No framework dependencies
- **Web Speech API** - Voice recognition
- **File API** - File uploads and processing
- **LocalStorage API** - Client-side persistence

### AI Providers
- **OpenAI GPT-4o-mini** - Fast, cost-effective, reliable
- **Google Gemini (2.5 Flash, 2.5 Pro, 3 Pro Preview)** - Latest generation models
- **LangSmith** - Optional AI tracing and monitoring

## Development

### Project Status
This is an actively developed personal planning tool. Recent additions include:
- ✅ Multi-provider AI support (OpenAI + Gemini)
- ✅ File upload capabilities (text, Word, images)
- ✅ Voice input for brain dumps
- ✅ AI-powered to-do list generation
- ✅ Unique ID system for item tracking
- ✅ Merge functionality for existing task trees

### Adding New Features

**Backend:**
1. Add new endpoints in `main.py`
2. Extend AI capabilities in `ai_client.py`
3. Modify task tree logic in `interactive_planner.py`

**Frontend:**
1. Update UI in `index.html`
2. Add styles to `styles.css`
3. Implement logic in `app.js`

### Future Roadmap

#### Short Term
- [ ] Improve mobile responsiveness
- [ ] Add task completion tracking
- [ ] Implement task due dates
- [ ] Add priority levels to tasks
- [ ] Export to other formats (JSON, CSV, Markdown)

#### Medium Term
- [ ] Database persistence (SQLite/PostgreSQL)
- [ ] Multi-user support with authentication
- [ ] Calendar integration
- [ ] Task scheduling and time blocking
- [ ] Progress tracking and analytics
- [ ] Recurring tasks

#### Long Term
- [ ] Real-time collaboration
- [ ] Mobile app (React Native/Flutter)
- [ ] Integration with productivity tools (Notion, Todoist, etc.)
- [ ] Advanced AI features (automatic time estimates, smart scheduling)
- [ ] Team workspaces and project sharing

## Troubleshooting

### Common Issues

**"Failed to generate task tree: API error: 500"**
- Check that your API key is correctly set in `backend/.env`
- Verify the backend server is running by visiting http://localhost:8000/health in your browser
- Make sure you've activated the virtual environment (`source venv/bin/activate`)
- For Gemini: If using free tier, rate limits are very strict - switch to OpenAI or wait a few minutes
- Check the terminal where the backend is running for detailed error messages

**"Could not parse response content as the length limit was reached"**
- Your brain dump is too large for the token limit
- Try breaking it into smaller chunks or reducing the amount of text
- The limit has been increased to 16,000 tokens for OpenAI and 30,000 for Gemini

**Backend won't start / "ModuleNotFoundError"**
- Make sure you activated the virtual environment: `source venv/bin/activate`
- Make sure you installed dependencies: `pip install -r requirements.txt`
- Make sure you're in the `backend` directory when running uvicorn

**Frontend shows blank page**
- Make sure you're accessing http://localhost:8080 (not opening the HTML file directly)
- Check that both frontend AND backend servers are running
- Check browser console for errors (F12 → Console tab)

**"CORS Error" in browser console**
- Make sure the backend is running on port 8000
- Make sure the frontend is served via HTTP server (not file://)
- Backend CORS is configured for all origins in development

**Voice input not working**
- Requires HTTPS or localhost
- Check browser permissions for microphone access
- Currently only supported in Chrome, Edge, and Safari

**Image OCR returning empty text**
- Ensure image is clear and text is legible
- Supported formats: JPG, PNG, GIF, WebP
- AI vision works best with printed text; handwriting requires clear writing

### Getting API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Add to `.env` as `OPENAI_API_KEY`

**Google Gemini:**
1. Go to https://aistudio.google.com/app/apikey
2. Create an API key
3. Add to `.env` as `GEMINI_API_KEY`

**LangSmith (Optional):**
1. Go to https://smith.langchain.com/
2. Create an account and get API key
3. Add to `.env` as `LANGSMITH_API_KEY`

## Contributing

This is a personal project, but suggestions and feedback are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests with improvements
- Share how you're using the tool

## License

MIT License - feel free to use and modify for your own purposes.
