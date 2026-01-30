from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import Task
from app import database

app = FastAPI(
    title="Task Manager API",
    description="A simple task management REST API",
    version="1.0.0"
)

# CORS configuration - allows React frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Task Manager API is running!", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/tasks")
def get_tasks():
    """Get all tasks"""
    return {"tasks": database.get_all_tasks()}

@app.get("/api/tasks/{task_id}")
def get_task(task_id: int):
    """Get a specific task by ID"""
    task = database.get_task_by_id(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/tasks")
def create_task(task: Task):
    """Create a new task"""
    task_dict = task.model_dump()
    created_task = database.create_task(task_dict)
    return created_task

@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, task: Task):
    """Update an existing task"""
    task_dict = task.model_dump()
    updated_task = database.update_task(task_id, task_dict)
    if updated_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated_task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    """Delete a task"""
    database.delete_task(task_id)
    return {"message": "Task deleted successfully"}