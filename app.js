const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');

let tasks = [];

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
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

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function clearCompletedTasks() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function updateTaskCount() {
    const remaining = tasks.filter(t => !t.completed).length;
    taskCount.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.text;
        if (task.completed) {
            li.style.textDecoration = 'line-through';
            li.style.opacity = '0.6';
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
        
        li.addEventListener('click', () => toggleTask(task.id));
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
    updateTaskCount();
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

