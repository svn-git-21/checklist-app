const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const addPredefinedBtn = document.getElementById('addPredefinedBtn');
const completeAllBtn = document.getElementById('completeAllBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const taskList = document.getElementById('taskList');

let isDarkMode = false;

function createTaskElement(text) {
  const li = document.createElement('li');

  const leftDiv = document.createElement('div');
  leftDiv.className = 'task-left';

  // Toggle switch
  const switchLabel = document.createElement('label');
  switchLabel.className = 'switch';
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  const slider = document.createElement('span');
  slider.className = 'slider';
  switchLabel.appendChild(toggle);
  switchLabel.appendChild(slider);

  const span = document.createElement('span');
  span.textContent = text;

  toggle.addEventListener('change', () => {
    if (toggle.checked) span.classList.add('completed');
    else span.classList.remove('completed');
  });

  leftDiv.appendChild(switchLabel);
  leftDiv.appendChild(span);

  const buttonsDiv = document.createElement('div');
  buttonsDiv.className = 'task-buttons';

  const editBtn = document.createElement('button');
  editBtn.innerHTML = '✏️';
  editBtn.onclick = () => {
    const newTask = prompt('Edit task:', span.textContent);
    if (newTask !== null) span.textContent = newTask;
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.onclick = () => taskList.removeChild(li);

  buttonsDiv.appendChild(editBtn);
  buttonsDiv.appendChild(deleteBtn);

  li.appendChild(leftDiv);
  li.appendChild(buttonsDiv);

  taskList.appendChild(li);
}

addTaskBtn.addEventListener('click', () => {
  const task = taskInput.value.trim();
  if (task) {
    createTaskElement(task);
    taskInput.value = '';
  }
});

addPredefinedBtn.addEventListener('click', () => {
  ['Lenovo Office laptop', 'Office Laptop Charger', 'Mouse & Dongle', 'Airtel Roter', 'Realme earbuds' , 'Redmi Phone' , 'Portronics Magclick' , 'Lenskart Pouch' , 'Diary & Pen' , 'Wallet' , 'Pouch - Headphone, Type B/C Cable' , 'iPhone Charger' , 'Office icard' , 'Umbrella'].forEach(createTaskElement);
});

completeAllBtn.addEventListener('click', () => {
  document.querySelectorAll('#taskList input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
  });
});

deleteAllBtn.addEventListener('click', () => {
  taskList.innerHTML = '';
});

toggleModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  isDarkMode = !isDarkMode;
  toggleModeBtn.textContent = isDarkMode ? '☀' : '🌙';
});
