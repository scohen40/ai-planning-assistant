"""
LangGraph-based Planning Workflow
Based on the brain dump planning system with task breakdown, refinement, and consolidation.
"""

import os
from typing import List, Literal, TypedDict
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langsmith import traceable

# Initialize LLM
def get_llm():
    """Get configured LLM instance."""
    return ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.2,
    )

# Pydantic Models for Structured Outputs
class Subtask(BaseModel):
    name: str
    dependencies: List[str] = Field(default_factory=list, description="Prerequisites or dependencies")

class TaskItem(BaseModel):
    name: str
    subtasks: List[Subtask] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)

class Project(BaseModel):
    name: str
    tasks: List[TaskItem]
    dependencies: List[str] = Field(default_factory=list)

class Category(BaseModel):
    name: str
    projects: List[Project]

class TaskTreeOutput(BaseModel):
    categories: List[Category]

class TaskTreeRefinementOutput(BaseModel):
    categories: List[Category]

class Task(BaseModel):
    name: str
    time: int = Field(..., description="Estimated duration in minutes")
    status: Literal["Ready", "BLOCKED", "Deferred"]

class BreakdownOutput(BaseModel):
    detailed_tasks: List[Task]
    total_time: int

class RefinementOutput(BaseModel):
    detailed_tasks: List[Task]
    total_time: int

class ConsolidationOutput(BaseModel):
    final_plan: List[Task]

# State Definition
class PlannerState(TypedDict, total=False):
    detailed_tasks: List[dict]  # will hold list[Task].dict()
    total_time: int
    brain_dump: str
    task_tree: dict  # hierarchical task tree
    refined_task_tree: dict  # task tree with broken down tasks
    final_plan: list  # for consolidation_node
    refinement_passes: int
    blocked_notified: bool

# Node Functions
@traceable(run_type="chain", name="Task Tree Node")
def task_tree_node(state: PlannerState) -> PlannerState:
    """
    Convert the brain dump into a structured, hierarchical task tree.
    Organizes items into categories, projects, tasks, and subtasks.
    """
    print("NODE: Converting brain dump into structured task tree...")

    brain_dump = state["brain_dump"]
    llm = get_llm()

    structured_llm = llm.with_structured_output(TaskTreeOutput)

    output: TaskTreeOutput = structured_llm.invoke(
        f"""
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
- Be thorough and capture ALL items from the brain dump.
"""
    )

    return {
        "task_tree": output.model_dump(),
    }

@traceable(run_type="chain", name="Task Breakdown Refinement Node")
def task_breakdown_node(state: PlannerState) -> PlannerState:
    """
    Further break down big and/or vague tasks into more manageable and actionable sub-tasks.
    """
    print("NODE: Breaking down big/vague tasks into more specific subtasks...")

    task_tree = state["task_tree"]
    llm = get_llm()

    structured_llm = llm.with_structured_output(TaskTreeRefinementOutput)

    output: TaskTreeRefinementOutput = structured_llm.invoke(
        f"""
You are a helpful executive functioning coach and personal planning assistant agent that excels in breaking down projects and tasks into more manageable sub-lists and sub-tasks.

Your primary task is to take an existing task tree and further break it down into logical, more specific to-do items.

Current task tree:
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
- Only break down tasks that would benefit from more specificity.
- Preserve all existing tasks and structure.
- Maintain any dependencies that were already noted.
"""
    )

    return {
        "refined_task_tree": output.model_dump(),
    }

@traceable(run_type="chain", name="Breakdown Node")
def breakdown_node(state: PlannerState) -> PlannerState:
    """
    Convert the refined task tree into atomic tasks with time estimates and status.
    """
    print("NODE: Converting refined task tree to atomic tasks with time estimates...")

    refined_task_tree = state["refined_task_tree"]
    llm = get_llm()

    # Ask the LLM to produce structured tasks
    structured_llm = llm.with_structured_output(BreakdownOutput)

    output: BreakdownOutput = structured_llm.invoke(
        f"""
You are a productivity and planning assistant.

Refined task tree with detailed subtasks:
---
{refined_task_tree}
---

1. Convert this hierarchical task tree into a flat list of atomic tasks that can be done in 15–120 minutes.
2. For each task (including subtasks), assign:
   - name: Clear, actionable task name (include project/category context if helpful)
   - time: Estimated time in minutes (integer)
   - status: 
     * "Ready" if it can be done now
     * "BLOCKED" if waiting on something external or has unfulfilled dependencies
     * "Deferred" if it should be done another day or is lower priority
3. Compute total_time as the sum of time for tasks with status "Ready".
4. Respect dependencies noted in the task tree.

Be thorough - extract ALL tasks and subtasks from the tree.
"""
    )

    # Convert Pydantic objects to plain dicts
    detailed_tasks = [t.model_dump() for t in output.detailed_tasks]
    total_time = output.total_time

    return {
        "detailed_tasks": detailed_tasks,
        "total_time": total_time,
    }

@traceable(run_type="chain", name="Refinement Node")
def refinement_node(state: PlannerState) -> PlannerState:
    """
    Refine the plan when total time exceeds the daily limit.
    De-prioritize or defer non-urgent tasks.
    """
    print("NODE: Total time exceeded limit. Running refinement...")

    passes = state.get("refinement_passes", 0) + 1
    llm = get_llm()

    structured_llm = llm.with_structured_output(RefinementOutput)

    output: RefinementOutput = structured_llm.invoke(
        f"""
You are refining today's task plan.

Here is the current plan (JSON list of tasks):
{state["detailed_tasks"]}

User can work at most 480 minutes (8 hours) today.

Instructions:
- De-prioritize or defer non-urgent or low priority tasks to another day (set status to "Deferred").
- Keep important/urgent tasks as "Ready".
- Update each task's status and time if needed.
- Recalculate total_time as the sum of time for tasks with status "Ready".

Focus on what MUST be done today vs. what can wait.
"""
    )

    return {
        "detailed_tasks": [t.model_dump() for t in output.detailed_tasks],
        "total_time": output.total_time,
        "refinement_passes": passes,
    }

@traceable(run_type="chain", name="Consolidation Node")
def consolidation_node(state: PlannerState) -> PlannerState:
    """
    Finalize the plan by consolidating and cleaning up tasks.
    """
    print("NODE: Finalizing and consolidating remaining tasks...")

    llm = get_llm()
    structured_llm = llm.with_structured_output(ConsolidationOutput)

    output: ConsolidationOutput = structured_llm.invoke(
        f"""
You are finalizing a daily plan.

Current tasks:
{state["detailed_tasks"]}

Clean up:
- Remove tasks with status "Deferred" (they're for another day).
- Keep "Ready" tasks in the final plan.
- Include "BLOCKED" tasks but clearly mark them.
- Group or rename tasks if it improves clarity, but don't lose information.
- Ensure tasks are in a logical order.

Return the final list as 'final_plan'.
"""
    )

    return {
        "final_plan": [t.model_dump() for t in output.final_plan],
        "total_time": state.get("total_time", 0),
        "detailed_tasks": state["detailed_tasks"],
    }

@traceable(run_type="chain", name="Notify Blocked Node")
def notify_blocked_node(state: PlannerState) -> PlannerState:
    """
    Identify and notify about blocked tasks.
    """
    blocked = [t for t in state.get("detailed_tasks", []) if t.get("status") == "BLOCKED"]

    print("NODE: Notifying about blocked tasks...")
    for t in blocked:
        print(f"  - BLOCKED: {t.get('name')}")

    # In a real app, you could call an LLM here to draft an email/notification
    # For now, we just log them and mark as notified
    return {"blocked_notified": True}

@traceable(run_type="chain", name="Router Node")
def router_node(state: PlannerState) -> str:
    """
    Decides the next step based on the plan's current state.
    """
    MAX_DAILY_TIME_MINUTES = 480  # 8 hours max
    MAX_REFINEMENT_PASSES = 3

    total_time = state.get("total_time", 0)
    passes = state.get("refinement_passes", 0)

    # If we tried refining multiple times and it's still over, just move on
    if passes >= MAX_REFINEMENT_PASSES and total_time > MAX_DAILY_TIME_MINUTES:
        print(
            f"ROUTER: Still over budget after {passes} refinement passes "
            f"({total_time} mins). Forcing CONSOLIDATION."
        )
        return "consolidate"

    if total_time > MAX_DAILY_TIME_MINUTES:
        print(f"ROUTER: Over budget ({total_time} mins). Routing to REFINEMENT.")
        return "refine"

    # Check for critical blockages
    tasks = state.get("detailed_tasks", []) or []
    is_blocked = any(t.get("status") == "BLOCKED" for t in tasks)

    # If blocked and we haven't handled notifications yet, do that first
    if is_blocked and not state.get("blocked_notified", False):
        print("ROUTER: Tasks are BLOCKED. Routing to NOTIFY.")
        return "notify"

    # Otherwise go to consolidation
    print("ROUTER: Plan is acceptable. Routing to CONSOLIDATION.")
    return "consolidate"

# Build the LangGraph Workflow
def create_planner_graph():
    """
    Create and compile the LangGraph workflow.
    """
    workflow = StateGraph(PlannerState)

    # Add the nodes
    workflow.add_node("task_tree", task_tree_node)
    workflow.add_node("task_breakdown", task_breakdown_node)
    workflow.add_node("breakdown", breakdown_node)
    workflow.add_node("refinement", refinement_node)
    workflow.add_node("consolidation", consolidation_node)
    workflow.add_node("notify", notify_blocked_node)

    # Set the start node
    workflow.set_entry_point("task_tree")

    # Task tree flows to task breakdown refinement
    workflow.add_edge("task_tree", "task_breakdown")
    
    # Task breakdown flows to time estimation
    workflow.add_edge("task_breakdown", "breakdown")

    # Conditional from breakdown
    workflow.add_conditional_edges(
        "breakdown",
        router_node,
        {
            "refine": "refinement",
            "notify": "notify",
            "consolidate": "consolidation",
        }
    )

    # Loop after refinement
    workflow.add_conditional_edges(
        "refinement",
        router_node,
        {
            "refine": "refinement",
            "notify": "notify",
            "consolidate": "consolidation",
        }
    )

    # After notify, go straight to consolidation
    workflow.add_edge("notify", "consolidation")

    # End after consolidation
    workflow.add_edge("consolidation", END)

    # Compile
    return workflow.compile()

# Main function to run the planner
def run_planner(brain_dump: str) -> dict:
    """
    Run the planner workflow on a brain dump.
    
    Args:
        brain_dump: The user's brain dump text
        
    Returns:
        Final state containing the plan
    """
    app = create_planner_graph()
    
    initial_state = {
        "brain_dump": brain_dump,
        "task_tree": {},
        "refined_task_tree": {},
        "detailed_tasks": [],
        "total_time": 0,
        "blocked_notified": False,
        "refinement_passes": 0,
    }

    final_state = app.invoke(initial_state)
    return final_state
