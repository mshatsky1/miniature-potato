// Constants
const FILTER_ALL = 'all';
const FILTER_ACTIVE = 'active';
const FILTER_COMPLETED = 'completed';
const STORAGE_KEY = 'tasks';
const MAX_TASK_LENGTH = 500;
const MIN_TASK_LENGTH = 1;

// DOM Elements
const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');
const emptyState = document.getElementById('emptyState');
const emptyStateMessage = document.getElementById('emptyStateMessage');
const ariaLive = document.getElementById('ariaLive');
const charCount = document.getElementById('charCount');
const maxCharCount = document.getElementById('maxCharCount');

// Application state
let tasks = []; // Array to store all tasks
let currentFilter = FILTER_ALL; // Current filter state

/**
 * Utility function to safely get element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} The element or null if not found
 */
function getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}

/**
 * Utility function to pluralize text
 * @param {number} count - The count
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form (optional)
 * @returns {string} Pluralized text
 */
function pluralize(count, singular, plural = null) {
    if (count === 1) return singular;
    return plural || singular + 's';
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.textContent || div.innerText || '';
}

/**
 * Checks if localStorage is available and usable
 * @returns {boolean} True if localStorage is available
 */
function isLocalStorageAvailable() {
    try {
        if (typeof Storage === 'undefined') {
            return false;
        }
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Saves tasks to localStorage
 * @returns {boolean} True if save was successful, false otherwise
 */
function saveTasks() {
    try {
        // Check if localStorage is available
        if (!isLocalStorageAvailable()) {
            console.warn('localStorage is not available');
            return false;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (e) {
        // Handle quota exceeded or other errors
        if (e.name === 'QuotaExceededError') {
            console.error('Storage quota exceeded. Cannot save tasks.');
            alert('Storage quota exceeded. Some tasks may not be saved.');
        } else {
            console.error('Failed to save tasks to localStorage:', e);
        }
        return false;
    }
}

/**
 * Loads tasks from localStorage
 * @returns {void}
 */
function loadTasks() {
    try {
        // Check if localStorage is available
        if (!isLocalStorageAvailable()) {
            console.warn('localStorage is not available');
            tasks = [];
            return;
        }
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            // Validate that parsed data is an array
            if (Array.isArray(parsedTasks)) {
                // Validate each task has required properties
                tasks = parsedTasks.filter(task => 
                    task && typeof task.id !== 'undefined' && typeof task.text === 'string'
                );
            } else {
                console.warn('Invalid task data format detected. Expected array but got:', typeof parsedTasks, '. Resetting to empty array.');
                tasks = [];
            }
        }
    } catch (e) {
        console.error('Failed to load tasks from localStorage:', e);
        tasks = [];
    }
}

/**
 * Validates if a task object has the required structure
 * @param {Object} task - The task object to validate
 * @returns {boolean} True if task is valid
 */
function isValidTask(task) {
    return task &&
           typeof task.id !== 'undefined' &&
           typeof task.text === 'string' &&
           task.text.trim().length >= MIN_TASK_LENGTH &&
           task.text.length <= MAX_TASK_LENGTH &&
           typeof task.completed === 'boolean';
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
    
    let taskText = taskInput.value.trim();
    if (taskText === '') {
        taskInput.classList.add('error');
        setTimeout(() => taskInput.classList.remove('error'), 500);
        return;
    }
    
    // Sanitize input to prevent XSS
    taskText = sanitizeInput(taskText);
    
    // Validate task text length
    if (taskText.length > MAX_TASK_LENGTH) {
        taskInput.classList.add('error');
        setTimeout(() => taskInput.classList.remove('error'), 2000);
        alert(`Task text is too long. Maximum ${MAX_TASK_LENGTH} characters allowed.`);
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(task);
    taskInput.value = '';
    // Visual feedback
    if (addButton) {
        addButton.classList.add('saving');
        setTimeout(() => addButton.classList.remove('saving'), 300);
    }
    // Refocus input for better UX
    taskInput.focus();
    const saved = saveTasks();
    if (saved) {
        console.log('Task added successfully:', task.text);
    }
    renderTasks();
    // Announce to screen readers
    if (ariaLive) {
        ariaLive.textContent = `Task "${taskText}" added`;
        setTimeout(() => { ariaLive.textContent = ''; }, 1000);
    }
}

/**
 * Finds a task by its ID
 * @param {number|string} id - The task ID to find
 * @returns {Object|undefined} The task object or undefined if not found
 */
function findTaskById(id) {
    if (typeof id !== 'number' && typeof id !== 'string') {
        console.error('Invalid task ID provided to findTaskById');
        return undefined;
    }
    return tasks.find(t => t.id === id);
}

/**
 * Deletes a task by ID
 * @param {number} id - The task ID to delete
 * @returns {void}
 */
function deleteTask(id) {
    if (typeof id !== 'number' && typeof id !== 'string') {
        console.error('Invalid task ID provided to deleteTask');
        return;
    }
    const task = findTaskById(id);
    if (!task) {
        console.warn(`Task with ID ${id} not found`);
        return;
    }
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    // Announce to screen readers
    if (ariaLive && task) {
        ariaLive.textContent = `Task "${task.text}" deleted`;
        setTimeout(() => { ariaLive.textContent = ''; }, 1000);
    }
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
    
    if (confirm(`Are you sure you want to delete ${completedCount} completed ${pluralize(completedCount, 'task')}?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        // Return focus to input after clearing
        if (taskInput) {
            taskInput.focus();
        }
    }
}

/**
 * Exports tasks as JSON string
 * @returns {string} JSON string of tasks
 */
function exportTasks() {
    return JSON.stringify(tasks, null, 2);
}

/**
 * Edits an existing task
 * @param {number} id - The task ID to edit
 * @returns {void}
 */
function editTask(id) {
    if (typeof id !== 'number' && typeof id !== 'string') {
        console.error('Invalid task ID provided to editTask');
        return;
    }
    const task = findTaskById(id);
    if (!task) {
        console.warn(`Task with ID ${id} not found`);
        return;
    }
    
    const newText = prompt('Edit task:', task.text);
    if (newText === null) {
        // User cancelled, no action needed
        return;
    }
    const trimmedText = newText.trim();
    if (trimmedText === '') {
        alert('Task text cannot be empty.');
        return;
    }
    if (trimmedText === task.text) {
        // No change made, no need to update
        return;
    }
    // Sanitize input to prevent XSS
    const sanitizedText = sanitizeInput(trimmedText);
    if (sanitizedText.length > MAX_TASK_LENGTH) {
        alert(`Task text is too long. Maximum ${MAX_TASK_LENGTH} characters allowed.`);
        return;
    }
    task.text = sanitizedText;
    saveTasks();
    renderTasks();
}

/**
 * Toggles the completion status of a task
 * @param {number} id - The task ID to toggle
 * @returns {void}
 */
function toggleTask(id) {
    if (typeof id !== 'number' && typeof id !== 'string') {
        console.error('Invalid task ID provided to toggleTask');
        return;
    }
    const task = findTaskById(id);
    if (task) {
        const wasCompleted = task.completed;
        task.completed = !task.completed;
        // Add completion timestamp if completing, remove if uncompleting
        if (task.completed && !task.completedAt) {
            task.completedAt = new Date().toISOString();
        } else if (!task.completed) {
            delete task.completedAt;
        }
        saveTasks();
        renderTasks();
        // Announce to screen readers
        if (ariaLive) {
            ariaLive.textContent = wasCompleted 
                ? `Task "${task.text}" marked as active`
                : `Task "${task.text}" completed`;
            setTimeout(() => { ariaLive.textContent = ''; }, 1000);
        }
    }
}

/**
 * Gets task statistics
 * @returns {Object} Object containing task statistics
 */
function getTaskStatistics() {
    return {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        active: tasks.filter(t => !t.completed).length,
        completionRate: tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length * 100).toFixed(1) : 0
    };
}

/**
 * Updates the task count display
 * @returns {void}
 */
function updateTaskCount() {
    const remaining = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    if (taskCount) {
        taskCount.textContent = `${remaining} ${pluralize(remaining, 'task')} remaining`;
    }
    // Disable clear button if no completed tasks
    if (clearCompleted) {
        clearCompleted.disabled = completed === 0;
    }
}

/**
 * Gets tasks by completion status
 * @param {boolean} completed - Whether to get completed or active tasks
 * @returns {Array} Array of tasks matching the completion status
 */
function getTasksByStatus(completed) {
    return tasks.filter(t => t.completed === completed);
}

/**
 * Gets tasks filtered by current filter setting
 * @returns {Array} Filtered array of tasks
 */
function getFilteredTasks() {
    switch (currentFilter) {
        case FILTER_ACTIVE:
            return tasks.filter(t => !t.completed);
        case FILTER_COMPLETED:
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
    if (!taskList) {
        console.error('Task list element not found');
        return;
    }
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    const filteredTasks = getFilteredTasks();
    
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        if (task.completed) {
            li.classList.add('completed');
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
        fragment.appendChild(li);
    });
    
    // Clear and append fragment in one operation for better performance
    taskList.innerHTML = '';
    taskList.appendChild(fragment);
    
    updateTaskCount();
    
    if (emptyState && emptyStateMessage) {
        if (filteredTasks.length === 0) {
            // Contextual empty state messages based on filter
            if (tasks.length === 0) {
                emptyStateMessage.textContent = 'No tasks yet. Add one above to get started! 🎯';
            } else if (currentFilter === FILTER_ACTIVE) {
                emptyStateMessage.textContent = 'No active tasks. All tasks are completed! 🎉';
            } else if (currentFilter === FILTER_COMPLETED) {
                emptyStateMessage.textContent = 'No completed tasks yet. Keep going! 💪';
            } else {
                emptyStateMessage.textContent = 'No tasks found.';
            }
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }
}

/**
 * Sets the current filter and updates the display
 * @param {string} filter - The filter type ('all', 'active', 'completed')
 * @returns {void}
 */
function setFilter(filter) {
    // Validate filter value
    const validFilters = [FILTER_ALL, FILTER_ACTIVE, FILTER_COMPLETED];
    if (!validFilters.includes(filter)) {
        console.warn(`Invalid filter: ${filter}, defaulting to ${FILTER_ALL}`);
        filter = FILTER_ALL;
    }
    currentFilter = filter;
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
    }
    renderTasks();
}

// Initialize application
loadTasks();
renderTasks();
updateCharCounter();

// Event listeners setup
if (addButton) {
    addButton.addEventListener('click', addTask);
}
if (clearCompleted) {
    clearCompleted.addEventListener('click', clearCompletedTasks);
}

// Update character counter
function updateCharCounter() {
    if (charCount && taskInput) {
        const length = taskInput.value.length;
        charCount.textContent = length;
        if (maxCharCount) {
            maxCharCount.textContent = MAX_TASK_LENGTH;
        }
        // Add warning class when approaching limit
        const charCounter = charCount.parentElement;
        if (charCounter) {
            if (length > MAX_TASK_LENGTH * 0.9) {
                charCounter.classList.add('warning');
            } else {
                charCounter.classList.remove('warning');
            }
        }
    }
}

// Allow adding tasks with Enter key
if (taskInput) {
    taskInput.addEventListener('input', updateCharCounter);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
    });
}

// Filter button event listeners
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        if (filter) {
            setFilter(filter);
        }
    });
});

// Global keyboard shortcuts
// Available shortcuts:
// - '/' : Focus task input
// - Enter : Add task (when input is focused)
// - Escape : Clear input (when input is focused)
// - Ctrl+Shift+C : Clear all completed tasks
// - 1, 2, 3 : Switch filters (All, Active, Completed)
document.addEventListener('keydown', (e) => {
    // Focus input on '/' key (when not already focused)
    if (e.key === '/' && e.target !== taskInput) {
        e.preventDefault();
        taskInput.focus();
    }
    // Clear completed tasks with Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearCompletedTasks();
    }
    // Escape key to clear input
    if (e.key === 'Escape' && e.target === taskInput) {
        taskInput.value = '';
        taskInput.blur();
    }
    // Filter shortcuts: 1=All, 2=Active, 3=Completed
    if (e.key >= '1' && e.key <= '3' && !e.ctrlKey && !e.metaKey && e.target !== taskInput) {
        const filterMap = { '1': FILTER_ALL, '2': FILTER_ACTIVE, '3': FILTER_COMPLETED };
        setFilter(filterMap[e.key]);
    }
});

