import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TaskManager.css';

// Get backend URL from environment variable or default to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tasks`);
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Failed to fetch tasks. Make sure backend is running.');
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/tasks`, {
        title,
        description,
        completed: false
      });
      
      setTasks([...tasks, response.data]);
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const toggleComplete = async (task) => {
    try {
      const response = await axios.put(`${API_URL}/api/tasks/${task.id}`, {
        ...task,
        completed: !task.completed
      });
      
      setTasks(tasks.map(t => t.id === task.id ? response.data : t));
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  return (
    <div className="task-manager">
      <div className="container">
        <h1>📝 Task Manager</h1>
        <p className="subtitle">Manage your tasks efficiently</p>

        {/* Create Task Form */}
        <form onSubmit={createTask} className="task-form">
          <input
            type="text"
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />
          <textarea
            placeholder="Task description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            rows="3"
          />
          <button type="submit" className="btn-primary">
            ➕ Add Task
          </button>
        </form>

        {/* Task List */}
        <div className="task-list">
          <h2>Your Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="no-tasks">No tasks yet. Create one above! 🚀</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <div className="task-content">
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                </div>
                <div className="task-actions">
                  <button
                    onClick={() => toggleComplete(task)}
                    className="btn-toggle"
                  >
                    {task.completed ? '✅ Completed' : '⭕ Mark Complete'}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn-delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskManager;