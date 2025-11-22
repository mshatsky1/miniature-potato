const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');
const emptyState = document.getElementById('emptyState');

let tasks = [];
let currentFilter = 'all';

/**
 * Saves tasks to localStorage
 * @returns {void}
 */
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (e) {
        console.error('Failed to save tasks to localStorage:', e);
    }
}

/**
 * Loads tasks from localStorage
 * @returns {void}
 */
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            // Validate that parsed data is an array
            if (Array.isArray(parsedTasks)) {
                tasks = parsedTasks;
            } else {
                console.warn('Invalid task data format, resetting to empty array');
                tasks = [];
            }
        }
    } catch (e) {
        console.error('Failed to load tasks from localStorage:', e);
        tasks = [];
    }
}

/**
 * Adds a new task to the list
 * @returns {void}
 */
function addTask() {
    if (!taskInput) {
        console.error('Task input element not found');
        return;
    }
    
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        taskInput.classList.add('error');
        setTimeout(() => taskInput.classList.remove('error'), 500);
        return;
    }
    
    // Validate task text length
    if (taskText.length > 500) {
        alert('Task text is too long. Maximum 500 characters allowed.');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false
    };
    
    tasks.push(task);
    taskInput.value = '';
    saveTasks();
    renderTasks();
}

/**
 * Deletes a task by ID
 * @param {number} id - The task ID to delete
 * @returns {void}
 */
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

/**
 * Clears all completed tasks after user confirmation
 * @returns {void}
 */
function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${completedCount} completed task${completedCount !== 1 ? 's' : ''}?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
    }
}

/**
 * Edits an existing task
 * @param {number} id - The task ID to edit
 * @returns {void}
 */
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newText = prompt('Edit task:', task.text);
    if (newText !== null && newText.trim() !== '') {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
    }
}

/**
 * Toggles the completion status of a task
 * @param {number} id - The task ID to toggle
 * @returns {void}
 */
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

/**
 * Updates the task count display
 * @returns {void}
 */
function updateTaskCount() {
    const remaining = tasks.filter(t => !t.completed).length;
    taskCount.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
}

/**
 * Gets tasks filtered by current filter setting
 * @returns {Array} Filtered array of tasks
 */
function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

/**
 * Renders all tasks to the DOM
 * @returns {void}
 */
function renderTasks() {
    taskList.innerHTML = '';
    const filteredTasks = getFilteredTasks();
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.text;
        if (task.completed) {
            li.style.textDecoration = 'line-through';
            li.style.opacity = '0.6';
        }
        
        const taskText = document.createElement('span');
        taskText.textContent = task.text;
        taskText.style.flex = '1';
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'edit-btn';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editTask(task.id);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
        
        li.addEventListener('click', () => toggleTask(task.id));
        li.appendChild(taskText);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
    updateTaskCount();
    
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
}

/**
 * Sets the current filter and updates the display
 * @param {string} filter - The filter type ('all', 'active', 'completed')
 * @returns {void}
 */
function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    renderTasks();
}

loadTasks();
renderTasks();

addButton.addEventListener('click', addTask);
clearCompleted.addEventListener('click', clearCompletedTasks);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Focus input on '/' key
    if (e.key === '/' && e.target !== taskInput) {
        e.preventDefault();
        taskInput.focus();
    }
    // Clear completed on Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearCompletedTasks();
    }
});

