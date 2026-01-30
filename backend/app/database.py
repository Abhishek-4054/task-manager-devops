# Simple in-memory database (list of tasks)
# In real-world, you'd use PostgreSQL, MongoDB, etc.

tasks_db = []
task_id_counter = 1

def get_all_tasks():
    return tasks_db

def get_task_by_id(task_id: int):
    for task in tasks_db:
        if task["id"] == task_id:
            return task
    return None

def create_task(task_data: dict):
    global task_id_counter
    task_data["id"] = task_id_counter
    tasks_db.append(task_data)
    task_id_counter += 1
    return task_data

def update_task(task_id: int, task_data: dict):
    for index, task in enumerate(tasks_db):
        if task["id"] == task_id:
            task_data["id"] = task_id
            tasks_db[index] = task_data
            return task_data
    return None

def delete_task(task_id: int):
    global tasks_db
    tasks_db = [task for task in tasks_db if task["id"] != task_id]
    return True