"""
Interactive Planning Workflow - Multi-stage with user verification
"""

import os
import json
import uuid
from typing import List, Literal, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langsmith import traceable

# Initialize LLM
def get_llm():
    """Get configured LLM instance based on AI_PROVIDER environment variable."""
    provider = os.getenv('AI_PROVIDER', 'openai')
    
    if provider == 'gemini':
        return ChatGoogleGenerativeAI(
            model=os.getenv('GEMINI_MODEL', 'gemini-2.0-flash-exp'),
            temperature=0.2,
            max_output_tokens=30000,  # Increased for large brain dumps
            google_api_key=os.getenv('GEMINI_API_KEY'),
            timeout=120,  # 2 minute timeout
            max_retries=2
        )
    else:  # default to openai
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.2,
            max_tokens=16000,  # Increased from 10000 (gpt-4o-mini max is 16384)
            timeout=120
        )

# Pydantic Models for Task Tree
class Subtask(BaseModel):
    id: Optional[str] = None
    name: str
    dependencies: List[str] = Field(default_factory=list, description="Prerequisites or dependencies")

class TaskItem(BaseModel):
    id: Optional[str] = None
    name: str
    subtasks: List[Subtask] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)

class Project(BaseModel):
    id: Optional[str] = None
    name: str
    tasks: List[TaskItem]
    dependencies: List[str] = Field(default_factory=list)

class Category(BaseModel):
    id: Optional[str] = None
    name: str
    projects: List[Project]

class TaskTreeOutput(BaseModel):
    categories: List[Category]

class TaskTreeRefinementOutput(BaseModel):
    categories: List[Category]

class TaskTreeValidationOutput(BaseModel):
    categories: List[Category]

# Stage 1: Create initial task tree from brain dump
@traceable(run_type="chain", name="Create Task Tree")
def create_task_tree(brain_dump: str, existing_task_tree: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Convert brain dump into structured task tree.
    If existing_task_tree is provided, merges new items into it.
    Returns the task tree for user verification.
    """
    print("STAGE 1: Creating task tree from brain dump...")
    print(f"Has existing task tree: {existing_task_tree is not None}")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(TaskTreeOutput)
    
    if existing_task_tree:
        print(f"Merging with existing tree that has {len(existing_task_tree.get('categories', []))} categories")
        prompt = f"""
You are a helpful personal assistant agent who is proficient in organizing to-do list brain dumps into organized and usable task trees that can be used in planning your client's schedule and getting everything on the list done.

The user has an EXISTING task tree and is adding NEW items to it. Your job is to:
1. KEEP ALL existing items unchanged
2. Add the new items from the brain dump
3. Merge logically - if new items fit into existing categories/projects, add them there
4. Create new categories/projects only if the new items don't fit existing ones

EXISTING TASK TREE (KEEP ALL OF THIS):
---
{json.dumps(existing_task_tree, indent=2)}
---

NEW ITEMS TO ADD:
---
{brain_dump}
---

Instructions:
- PRESERVE all existing categories, projects, tasks, and subtasks exactly as they are
- Add new items from the brain dump into appropriate existing categories/projects where they fit
- Only create new categories/projects if the new items don't logically fit anywhere existing
- Maintain the clear hierarchy (Category > Project > Task > Subtask)
- Indicate dependencies or prerequisites where applicable

⚠️ CRITICAL: Include EVERY item from both the existing tree and the new brain dump.
"""
    else:
        print("Creating new task tree from scratch")
        prompt = f"""
You are a helpful personal assistant agent who is proficient in organizing to-do list brain dumps into organized and usable task trees that can be used in planning your client's schedule and getting everything on the list done.

Take the following 'brain dump' of things that a user needs to get done and organize it into a structured list.

Brain dump:
---
{brain_dump}
---

Instructions:
- Group related items into projects and categories (e.g. Academic, Household, Meal Prep).
- Break each project into smaller actionable tasks and subtasks as referenced in the brain dump.
- Present the output as a clear hierarchy (Category > Project > Task > Subtask).
- Indicate dependencies or prerequisites where applicable, if referenced in the brain dump.

⚠️ CRITICAL: Be thorough and capture EVERY SINGLE ITEM from the brain dump above. Do not skip or omit anything.
⚠️ If the brain dump is long, make sure to process the ENTIRE text, not just the beginning.
⚠️ Count the items in the brain dump and make sure you've included all of them in your output.
"""
    
    output: TaskTreeOutput = structured_llm.invoke(prompt)
    task_tree = output.model_dump()
    
    # If merging with existing tree, validate that original names are preserved
    if existing_task_tree:
        task_tree = validate_name_preservation(task_tree, existing_task_tree)
    
    # Assign unique IDs (preserving IDs from existing tree if merging)
    task_tree = assign_ids_to_tree(task_tree, existing_task_tree)
    
    return task_tree

# Validation Stage: Ensure original item names are preserved
@traceable(run_type="chain", name="Validate Name Preservation")
def validate_name_preservation(new_tree: Dict[str, Any], original_tree: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate that items from the original tree maintain their exact names in the new tree.
    Uses AI to correct any renamed items back to their original names.
    """
    print("VALIDATION: Ensuring original item names are preserved...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(TaskTreeValidationOutput)
    
    output: TaskTreeValidationOutput = structured_llm.invoke(
        f"""
You are a validation agent ensuring data consistency when merging task trees.

ORIGINAL TREE (these item names MUST be preserved exactly):
---
{json.dumps(original_tree, indent=2)}
---

NEW TREE (may have renamed some original items):
---
{json.dumps(new_tree, indent=2)}
---

Your task:
1. Compare the two trees carefully
2. Identify any items in the NEW tree that appear to be the same as items in the ORIGINAL tree but have different names
3. CORRECT those names back to match the ORIGINAL tree EXACTLY
4. Keep any truly new items with their new names
5. Preserve all other aspects (structure, dependencies, subtasks)

⚠️ CRITICAL RULES:
- Original item names must match EXACTLY (character for character)
- Do NOT rename truly new items that weren't in the original tree
- If you're unsure whether an item is the same, compare context (parent category/project, similar purpose)
- Preserve the complete structure - don't drop any items

Return the corrected tree with original names preserved.
"""
    )
    
    validated_tree = output.model_dump()
    print("Validation complete - original names preserved")
    
    return validated_tree

# Stage 2: Refine task tree by breaking down big/vague tasks
@traceable(run_type="chain", name="Refine Task Tree")
def refine_task_tree(task_tree: Dict[str, Any]) -> Dict[str, Any]:
    """
    Take the user-verified task tree and break down big/vague tasks further.
    Also fixes any typos or issues from user editing.
    Returns refined task tree for final verification.
    """
    print("STAGE 2: Breaking down tasks and polishing...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(TaskTreeRefinementOutput)
    
    output: TaskTreeRefinementOutput = structured_llm.invoke(
        f"""
You are a helpful executive functioning coach and personal planning assistant agent that excels in breaking down projects and tasks into more manageable sub-lists and sub-tasks.

Your primary task is to take an existing task tree and further break it down into logical, more specific to-do items.

Current task tree (may contain user edits and only selected tasks):
---
{task_tree}
---

Instructions:
- Add, where relevant and/or helpful, breakdowns of big and/or vague tasks.
- For example, if a task is to 'clean the bathroom', the breakdown might include:
  * 'clean the toilet'
  * 'clean the shower'
  * 'clean the mirror and sink'
  * 'sweep and mop the floor'
  * 'take out the trash'
- Keep the same hierarchical structure (Category > Project > Task > Subtask).
- Break down ALL tasks provided into specific, actionable subtasks.
- If a task already has subtasks but they're too vague, add more detail.
- Maintain any dependencies that were already noted.
- Fix any typos or formatting issues from user edits.

⚠️ IMPORTANT: You may receive only a subset of tasks that need breakdown. Process all tasks you receive.
⚠️ Break down each task into clear, specific, actionable steps.
⚠️ Do not skip any tasks - every task should be broken down further.
"""
    )
    
    refined_tree = output.model_dump()
    
    # Assign IDs, preserving from original task_tree
    refined_tree = assign_ids_to_tree(refined_tree, task_tree)
    
    return refined_tree

# Helper function to assign unique IDs to all items
def assign_ids_to_tree(task_tree: Dict[str, Any], existing_tree: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Assign unique IDs to all items in the task tree.
    If existing_tree is provided, try to preserve IDs for items with matching names.
    """
    # Build a lookup map of existing items by name
    existing_map = {}
    if existing_tree:
        for cat in existing_tree.get('categories', []):
            cat_key = f"cat:{cat.get('name')}"
            existing_map[cat_key] = cat.get('id')
            
            for proj in cat.get('projects', []):
                proj_key = f"proj:{cat.get('name')}:{proj.get('name')}"
                existing_map[proj_key] = proj.get('id')
                
                for task in proj.get('tasks', []):
                    task_key = f"task:{cat.get('name')}:{proj.get('name')}:{task.get('name')}"
                    existing_map[task_key] = task.get('id')
                    
                    for subtask in task.get('subtasks', []):
                        sub_key = f"sub:{cat.get('name')}:{proj.get('name')}:{task.get('name')}:{subtask.get('name')}"
                        existing_map[sub_key] = subtask.get('id')
    
    # Assign IDs to new tree
    for cat in task_tree.get('categories', []):
        cat_key = f"cat:{cat.get('name')}"
        cat['id'] = existing_map.get(cat_key) or str(uuid.uuid4())
        
        for proj in cat.get('projects', []):
            proj_key = f"proj:{cat.get('name')}:{proj.get('name')}"
            proj['id'] = existing_map.get(proj_key) or str(uuid.uuid4())
            
            for task in proj.get('tasks', []):
                task_key = f"task:{cat.get('name')}:{proj.get('name')}:{task.get('name')}"
                task['id'] = existing_map.get(task_key) or str(uuid.uuid4())
                
                for subtask in task.get('subtasks', []):
                    sub_key = f"sub:{cat.get('name')}:{proj.get('name')}:{task.get('name')}:{subtask.get('name')}"
                    subtask['id'] = existing_map.get(sub_key) or str(uuid.uuid4())
    
    return task_tree

# Helper function to format task tree for display
def format_task_tree_for_display(task_tree: Dict[str, Any]) -> str:
    """
    Convert task tree JSON to readable hierarchical text.
    """
    lines = []
    
    for category in task_tree.get("categories", []):
        lines.append(f"📁 {category['name']}")
        
        for project in category.get("projects", []):
            lines.append(f"  📋 {project['name']}")
            if project.get("dependencies"):
                lines.append(f"     Dependencies: {', '.join(project['dependencies'])}")
            
            for task in project.get("tasks", []):
                lines.append(f"    ✓ {task['name']}")
                if task.get("dependencies"):
                    lines.append(f"       Dependencies: {', '.join(task['dependencies'])}")
                
                for subtask in task.get("subtasks", []):
                    lines.append(f"      • {subtask['name']}")
                    if subtask.get("dependencies"):
                        lines.append(f"         Dependencies: {', '.join(subtask['dependencies'])}")
        
        lines.append("")  # Blank line between categories
    
    return "\n".join(lines)
