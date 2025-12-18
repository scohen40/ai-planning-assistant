from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import base64
import json
from datetime import datetime

load_dotenv()

# Simple in-memory storage for task trees (replace with database in production)
saved_task_trees = []

app = FastAPI(title="AI Planning Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class PlanRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    existing_task_tree: Optional[Dict[str, Any]] = None

class TaskTreeRequest(BaseModel):
    task_tree: Dict[str, Any]

class TodoGenerationRequest(BaseModel):
    task_tree: Dict[str, Any]
    custom_prompt: Optional[str] = None

class TaskTreeResponse(BaseModel):
    task_tree: Dict[str, Any]
    formatted_tree: str
    stage: str  # "initial" or "refined"

class PlanResponse(BaseModel):
    plan: str
    tasks: List[str]
    timestamp: str

class TaskRequest(BaseModel):
    task: str
    priority: Optional[str] = "medium"

# Root endpoint
@app.get("/")
async def root():
    return {"message": "AI Planning Assistant API", "status": "running"}

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Image OCR endpoint
@app.post("/api/extract-text-from-image")
async def extract_text_from_image(file: UploadFile = File(...)):
    """
    Extract text from an uploaded image using OpenAI Vision API.
    Better for handwritten text than traditional OCR.
    """
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Read image file
        image_data = await file.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Determine image format from filename
        file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else 'jpeg'
        mime_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        }
        mime_type = mime_types.get(file_extension, 'image/jpeg')
        
        # Call OpenAI Vision API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all text from this image. This is likely a handwritten or typed to-do list or brain dump. Return ONLY the extracted text, preserving the structure and line breaks as much as possible. Do not add any commentary, explanations, or formatting - just the raw text content."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )
        
        extracted_text = response.choices[0].message.content.strip()
        
        return {"text": extracted_text}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")

# Stage 1: Create initial task tree from brain dump
@app.post("/api/create-task-tree", response_model=TaskTreeResponse)
async def create_initial_task_tree(request: PlanRequest):
    """
    Stage 1: Convert brain dump into structured task tree.
    Returns task tree for user verification/editing.
    If existing_task_tree is provided, merges new items into it.
    """
    try:
        from interactive_planner import create_task_tree, format_task_tree_for_display
        
        print(f"Received request with existing_task_tree: {request.existing_task_tree is not None}")
        if request.existing_task_tree:
            print(f"Existing task tree has {len(request.existing_task_tree.get('categories', []))} categories")
        
        # Combine prompt and context if provided
        brain_dump = request.prompt
        if request.context:
            brain_dump = f"{request.context}\n\n{brain_dump}"
        
        # Create task tree (with or without existing tree)
        task_tree = create_task_tree(brain_dump, request.existing_task_tree)
        formatted = format_task_tree_for_display(task_tree)
        
        return TaskTreeResponse(
            task_tree=task_tree,
            formatted_tree=formatted,
            stage="initial"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Stage 2: Refine task tree with user edits
@app.post("/api/refine-task-tree", response_model=TaskTreeResponse)
async def refine_edited_task_tree(request: TaskTreeRequest):
    """
    Stage 2: Take user-edited task tree and break down further.
    Returns refined task tree for final verification.
    """
    try:
        from interactive_planner import refine_task_tree, format_task_tree_for_display
        
        # Refine the task tree
        refined_tree = refine_task_tree(request.task_tree)
        formatted = format_task_tree_for_display(refined_tree)
        
        return TaskTreeResponse(
            task_tree=refined_tree,
            formatted_tree=formatted,
            stage="refined"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Legacy endpoint - kept for backward compatibility
@app.post("/api/generate-plan", response_model=PlanResponse)
async def generate_plan(request: PlanRequest):
    """
    LEGACY: Generate a planning response using LangGraph workflow.
    Use the new interactive endpoints instead.
    """
    try:
        from datetime import datetime
        from planner_workflow import run_planner
        
        # Combine prompt and context if provided
        brain_dump = request.prompt
        if request.context:
            brain_dump = f"{request.context}\n\n{brain_dump}"
        
        # Run the LangGraph planner workflow
        final_state = run_planner(brain_dump)
        
        # Extract final plan
        final_plan = final_state.get("final_plan", [])
        
        # Format the plan as text
        plan_text_lines = [f"Your Daily Plan ({final_state.get('total_time', 0)} minutes total)\n"]
        plan_text_lines.append("=" * 50 + "\n")
        
        ready_tasks = [t for t in final_plan if t.get("status") == "Ready"]
        blocked_tasks = [t for t in final_plan if t.get("status") == "BLOCKED"]
        
        if ready_tasks:
            plan_text_lines.append("\n✅ READY TO DO:\n")
            for i, task in enumerate(ready_tasks, 1):
                plan_text_lines.append(f"{i}. {task['name']} ({task['time']} min)\n")
        
        if blocked_tasks:
            plan_text_lines.append("\n⚠️ BLOCKED (waiting on external dependencies):\n")
            for task in blocked_tasks:
                plan_text_lines.append(f"- {task['name']} ({task['time']} min)\n")
        
        plan_text = "".join(plan_text_lines)
        
        # Extract task names for the tasks list
        tasks = [f"{t['name']} ({t['time']} min) - {t['status']}" for t in final_plan]
        
        return PlanResponse(
            plan=plan_text,
            tasks=tasks,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Add task endpoint
@app.post("/api/tasks")
async def add_task(request: TaskRequest):
    """
    Add a new task to the planning system.
    """
    try:
        # TODO: Implement task storage (database, file, etc.)
        return {
            "message": "Task added successfully",
            "task": request.task,
            "priority": request.priority
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get tasks endpoint
@app.get("/api/tasks")
async def get_tasks():
    """
    Retrieve all tasks from the planning system.
    """
    try:
        # TODO: Implement task retrieval
        return {
            "tasks": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Save task tree endpoint
@app.post("/api/save-task-tree")
async def save_task_tree(request: TaskTreeRequest):
    """
    Save a completed task tree.
    """
    try:
        task_tree_entry = {
            "id": len(saved_task_trees) + 1,
            "task_tree": request.task_tree,
            "timestamp": datetime.now().isoformat(),
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        saved_task_trees.append(task_tree_entry)
        
        return {
            "message": "Task tree saved successfully",
            "id": task_tree_entry["id"],
            "timestamp": task_tree_entry["timestamp"]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Get saved task trees endpoint
@app.get("/api/saved-task-trees")
async def get_saved_task_trees():
    """
    Retrieve all saved task trees.
    """
    try:
        return {
            "task_trees": saved_task_trees
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete task tree endpoint
@app.delete("/api/task-tree/{tree_id}")
async def delete_task_tree(tree_id: int):
    """
    Delete a saved task tree by ID.
    """
    try:
        global saved_task_trees
        saved_task_trees = [tree for tree in saved_task_trees if tree["id"] != tree_id]
        return {"message": "Task tree deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Generate AI to-do list endpoint
@app.post("/api/generate-todo")
async def generate_ai_todo_list(request: TodoGenerationRequest):
    """
    Generate a prioritized to-do list from a task tree using AI.
    """
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Convert task tree to readable format
        task_tree_str = json.dumps(request.task_tree, indent=2)
        
        # Build prompt
        system_prompt = """You are a helpful executive functioning coach and personal planning assistant agent that excels in re-organizing structured task trees into more logical to-do lists that can be tackled more easily.

Your primary task is to take an existing, broken down task tree and reorganize it so that it groups similar tasks that can be done at the same time and orders them according to logical dependencies.

For example, if the list includes separate tasks lists for each meal or event to plan and shop for, the meal planning can all be grouped into one task list to be done first and the shopping can all be grouped into another task list that can be tackled at the same time after the planning is complete.

Guidelines:
- Group similar tasks that can be done together
- Order tasks based on logical dependencies (what must be done first)
- Use clear, action-oriented language
- Keep tasks specific and actionable
- Consider efficiency and workflow optimization

Return ONLY a JSON object with an "items" key containing an array of strings, where each string is a reorganized to-do item. Example:
{"items": ["Group 1: Plan all meals for the week", "Group 2: Create consolidated shopping list", "Group 3: Shop for all groceries at once", ...]}
"""
        
        user_prompt = f"Task Tree:\n{task_tree_str}"
        
        if request.custom_prompt:
            user_prompt += f"\n\nAdditional Instructions:\n{request.custom_prompt}"
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Parse response
        result = json.loads(response.choices[0].message.content)
        print(f"AI Response: {result}")
        
        # Handle different response formats
        if isinstance(result, dict):
            todo_items = result.get('items', result.get('todo_items', result.get('tasks', [])))
        elif isinstance(result, list):
            todo_items = result
        else:
            todo_items = []
        
        print(f"Extracted todo_items: {todo_items}")
        print(f"Count: {len(todo_items)}")
        
        return {
            "todo_items": todo_items,
            "count": len(todo_items)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
