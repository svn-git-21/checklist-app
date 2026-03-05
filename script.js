// --- STATE MANAGEMENT ---
const AppData = {
  tasks: JSON.parse(localStorage.getItem('checklist_tasks')) || [],
  isDarkMode: JSON.parse(localStorage.getItem('checklist_theme')) || false,
  cloudUrl: localStorage.getItem('checklist_cloud_url') || '',
  clipboard: localStorage.getItem('checklist_clipboard') || ''
};

// --- DOM ELEMENTS ---
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const cloudBtn = document.getElementById('cloudBtn');
const cloudModal = document.getElementById('cloudModal');
const uploadBtn = document.getElementById('uploadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clipboardBtn = document.getElementById('clipboardBtn');
const clipboardModal = document.getElementById('clipboardModal');
const clipboardText = document.getElementById('clipboardText');
const closeClipboardBtn = document.getElementById('closeClipboardBtn');
const copyClipboardBtn = document.getElementById('copyClipboardBtn');
const closeClipboardFooterBtn = document.getElementById('closeClipboardFooterBtn');
const statusPill = document.getElementById('statusPill');
const statusDot = statusPill.querySelector('.status-dot');
const statusText = document.getElementById('statusText');
const clockElement = document.getElementById('clock');

// --- INIT ---
function init() {
  applyTheme();
  renderTasks();
  clipboardText.value = AppData.clipboard; 
  
  setInterval(updateClock, 1000);
  updateClock();
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  clockElement.textContent = `${hours}:${minutes}`;
}

// --- CORE FUNCTIONS ---
function saveData() {
  localStorage.setItem('checklist_tasks', JSON.stringify(AppData.tasks));
  localStorage.setItem('checklist_theme', JSON.stringify(AppData.isDarkMode));
  localStorage.setItem('checklist_cloud_url', AppData.cloudUrl);
  localStorage.setItem('checklist_clipboard', AppData.clipboard);
}

function saveThemeOnly() {
  localStorage.setItem('checklist_theme', JSON.stringify(AppData.isDarkMode));
}

function renderTasks() {
  taskList.innerHTML = '';
  AppData.tasks.forEach(task => {
    const li = document.createElement('li');
    const leftDiv = document.createElement('div');
    leftDiv.className = 'task-left';

    const switchLabel = document.createElement('label');
    switchLabel.className = 'switch';
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = task.completed;
    
    const slider = document.createElement('span');
    slider.className = 'slider';
    switchLabel.appendChild(toggle);
    switchLabel.appendChild(slider);

    const span = document.createElement('span');
    span.textContent = task.text;
    if (task.completed) span.classList.add('completed');

    toggle.addEventListener('change', () => {
      task.completed = toggle.checked;
      renderTasks();
      saveData();
    });

    leftDiv.appendChild(switchLabel);
    leftDiv.appendChild(span);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'task-buttons';

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.onclick = () => {
      const newText = prompt('Edit task:', task.text);
      if (newText && newText.trim() !== "") {
        task.text = newText;
        renderTasks();
        saveData();
      }
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.onclick = () => {
      // FIX: This filter now works correctly because every ID is guaranteed unique
      AppData.tasks = AppData.tasks.filter(t => t.id !== task.id);
      renderTasks();
      saveData();
    };

    buttonsDiv.appendChild(editBtn);
    buttonsDiv.appendChild(deleteBtn);
    li.appendChild(leftDiv);
    li.appendChild(buttonsDiv);
    taskList.appendChild(li);
  });
}

// FIX: Added Math.random() to ensure IDs are unique even during rapid loops
function addTask(text) {
  if (!text) return;
  const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  AppData.tasks.push({ id: uniqueId, text: text, completed: false });
  renderTasks();
  saveData();
}

// --- LISTENERS ---
document.getElementById('addTaskBtn').addEventListener('click', () => {
  addTask(taskInput.value.trim());
  taskInput.value = '';
});

document.getElementById('addPredefinedBtn').addEventListener('click', () => {
  const items = [
    'Lenovo Office laptop', 'Office Laptop Charger', 'Mouse & Dongle', 
    'Airtel Router', 'Realme earbuds', 'Redmi Phone', 'Portronics Magclick', 
    'Lenskart Pouch', 'Diary & Pen', 'Wallet', 
    'Pouch - Headphone, Type B/C Cable', 'iPhone Charger', 'Office icard', 'Umbrella'
  ];
  items.forEach(text => addTask(text));
});

document.getElementById('completeAllBtn').addEventListener('click', () => {
  AppData.tasks.forEach(t => t.completed = true);
  renderTasks();
  saveData();
});

document.getElementById('deleteAllBtn').addEventListener('click', () => {
  if (confirm("Delete all?")) {
    AppData.tasks = [];
    renderTasks();
    saveData();
  }
});

toggleModeBtn.addEventListener('click', () => {
  AppData.isDarkMode = !AppData.isDarkMode;
  applyTheme();
  saveThemeOnly();
});

// Manual Upload Handler
uploadBtn.onclick = async () => {
  if (!AppData.cloudUrl) {
    alert("Connect to Drive first!");
    cloudBtn.click();
    return;
  }
  showSyncStatus('syncing');
  await pushToCloud();
};

// Manual Download Handler
downloadBtn.onclick = async () => {
  if (!AppData.cloudUrl) {
    alert("Connect to Drive first!");
    cloudBtn.click();
    return;
  }
  await pullFromCloud();
};

// Clipboard Logic
clipboardBtn.onclick = () => {
  clipboardModal.classList.remove('hidden');
  clipboardText.focus();
};
closeClipboardBtn.onclick = () => clipboardModal.classList.add('hidden');
closeClipboardFooterBtn.onclick = () => clipboardModal.classList.add('hidden');

copyClipboardBtn.onclick = () => {
  const text = clipboardText.value;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = copyClipboardBtn.textContent;
    copyClipboardBtn.textContent = 'Copied!';
    setTimeout(() => { copyClipboardBtn.textContent = originalText; }, 1500);
  });
};

clipboardText.addEventListener('input', () => {
  AppData.clipboard = clipboardText.value;
  saveData();
});

function applyTheme() {
  if (AppData.isDarkMode) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  toggleModeBtn.textContent = AppData.isDarkMode ? '☀' : '🌙';
}

// --- CLOUD SYNC FUNCTIONS ---
async function pushToCloud() {
  try {
    const payload = JSON.stringify({ 
      tasks: AppData.tasks, 
      clipboard: AppData.clipboard 
    });
    const res = await fetch(AppData.cloudUrl, { method: 'POST', body: payload });
    const result = await res.json();
    if (result.status === 'success') {
      showSyncStatus('success');
      alert("Manual Upload Successful!");
    } else {
      throw new Error("Save Error");
    }
  } catch (e) {
    showSyncStatus('error');
    alert("Upload Failed.");
  }
}

async function pullFromCloud() {
  showSyncStatus('syncing');
  try {
    const res = await fetch(AppData.cloudUrl);
    const data = await res.json();
    if (data.tasks) {
      AppData.tasks = data.tasks;
      if (data.clipboard !== undefined) {
        AppData.clipboard = data.clipboard;
        clipboardText.value = AppData.clipboard;
      }
      renderTasks();
      saveData();
      showSyncStatus('success');
      alert("Manual Download Successful!");
    }
  } catch (e) {
    showSyncStatus('error');
    alert("Download Failed.");
  }
}

function showSyncStatus(type) {
  statusPill.classList.add('show');
  if (type === 'syncing') {
    statusDot.className = 'status-dot syncing';
    statusText.textContent = 'SYNCING...';
    statusText.style.color = '#94a3b8';
  } else if (type === 'success') {
    statusDot.className = 'status-dot';
    statusText.textContent = 'DRIVE SYNCED';
    statusText.style.color = '#64748b';
  } else {
    statusDot.className = 'status-dot';
    statusDot.style.backgroundColor = '#ef4444';
    statusDot.style.boxShadow = 'none';
    statusText.textContent = 'SYNC ERROR';
    statusText.style.color = '#ef4444';
  }
}

cloudBtn.onclick = () => {
  cloudModal.classList.remove('hidden');
  document.getElementById('cloudUrlInput').value = AppData.cloudUrl;
};
document.getElementById('cancelCloudBtn').onclick = () => cloudModal.classList.add('hidden');
document.getElementById('saveCloudBtn').onclick = () => {
  const url = document.getElementById('cloudUrlInput').value.trim();
  if (url && url.includes('script.google.com')) {
    AppData.cloudUrl = url;
    saveData();
    cloudModal.classList.add('hidden');
    pullFromCloud();
  } else {
    alert("Invalid URL");
  }
};
document.getElementById('disconnectBtn').onclick = () => {
  if (confirm("Disconnect?")) {
    AppData.cloudUrl = '';
    saveData();
    cloudModal.classList.add('hidden');
    statusPill.classList.remove('show');
  }
};

init();
