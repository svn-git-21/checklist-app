let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
const predefined = ["Lenovo Office laptop", "Office Laptop Charger", "Mouse & Dongle", "Airtel Roter", "Realme earbuds" , "Redmi Phone" , "Portronics Magclick" , "Lenskart Pouch" , "Diary & Pen" , "Wallet" , "Pouch - Weired Headphone, USB Type B, Type C Cable" , "iPhone Charger" , "Office icard" , "Umbrella"];

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  tasks.forEach((task, i) => {
    const li = document.createElement("li");
    if (task.done) li.classList.add("completed");

    const toggle = document.createElement("label");
    toggle.className = "toggle-container";
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = task.done;
    toggleInput.onchange = () => toggleTask(i);
    const toggleSlider = document.createElement("span");
    toggleSlider.className = "toggle-slider";
    toggle.append(toggleInput, toggleSlider);

    const span = document.createElement("span");
    span.textContent = task.text;

    const controls = document.createElement("div");
    controls.className = "task-controls";

    const edit = document.createElement("button");
    edit.className = "edit";
    edit.textContent = "Edit";
    edit.onclick = () => editTask(i);

    const del = document.createElement("button");
    del.className = "delete";
    del.textContent = "Delete";
    del.onclick = () => deleteTask(i);

    controls.append(edit, del);

    li.append(toggle, span, controls);
    taskList.appendChild(li);
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if (text) {
    tasks.push({ text, done: false });
    input.value = "";
    renderTasks();
  }
}

function addPredefinedTasks() {
  predefined.forEach(t => tasks.push({ text: t, done: false }));
  renderTasks();
}

function completeAllTasks() {
  tasks.forEach(t => t.done = true);
  renderTasks();
}

function deleteAllTasks() {
  tasks = [];
  renderTasks();
}

function toggleTask(i) {
  tasks[i].done = !tasks[i].done;
  renderTasks();
}

function editTask(i) {
  const newText = prompt("Edit task:", tasks[i].text);
  if (newText !== null && newText.trim()) {
    tasks[i].text = newText.trim();
    renderTasks();
  }
}

function deleteTask(i) {
  tasks.splice(i, 1);
  renderTasks();
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
  document.getElementById("darkToggle").checked = true;
}

renderTasks();
