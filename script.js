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

// Cloud Elements
const cloudBtn = document.getElementById('cloudBtn');
const cloudModal = document.getElementById('cloudModal');
const syncBtn = document.getElementById('syncBtn');

// Clipboard Elements
const clipboardBtn = document.getElementById('clipboardBtn');
const clipboardModal = document.getElementById('clipboardModal');
const clipboardText = document.getElementById('clipboardText');
const closeClipboardBtn = document.getElementById('closeClipboardBtn');
const copyClipboardBtn = document.getElementById('copyClipboardBtn');
const closeClipboardFooterBtn = document.getElementById('closeClipboardFooterBtn');

// Status Elements
const statusPill = document.getElementById('statusPill');
const statusDot = statusPill.querySelector('.status-dot');
const statusText = document.getElementById('statusText');

// Clock Element
const clockElement = document.getElementById('clock');

// --- INIT ---
function init() {
  applyTheme();
  renderTasks();
  clipboardText.value = AppData.clipboard; 
  if (AppData.cloudUrl) pullFromCloud();
  
  // Start Clock
  setInterval(updateClock, 1000); // Update every second to stay accurate
  updateClock();
}

// --- CLOCK FUNCTION (Updated) ---
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  // Removed seconds to match the requested image style
  clockElement.textContent = `${hours}:${minutes}`;
}

// --- CORE FUNCTIONS ---
function saveData() {
  localStorage.setItem('checklist_tasks', JSON.stringify(AppData.tasks));
  localStorage.setItem('checklist_theme', JSON.stringify(AppData.isDarkMode));
  localStorage.setItem('checklist_cloud_url', AppData.cloudUrl);
  localStorage.setItem('checklist_clipboard', AppData.clipboard);

  if (AppData.cloudUrl) {
    showSyncStatus('syncing');
    clearTimeout(window.syncTimeout);
    window.syncTimeout = setTimeout(pushToCloud, 2000);
  }
}

// Helper to save ONLY theme locally without triggering sync
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

function addTask(text) {
  if (!text) return;
  AppData.tasks.push({ id: Date.now(), text: text, completed: false });
  renderTasks();
  saveData();
}

// --- LISTENERS ---
document.getElementById('addTaskBtn').addEventListener('click', () => {
  addTask(taskInput.value.trim());
  taskInput.value = '';
});

document.getElementById('addPredefinedBtn').addEventListener('click', () => {
  ['Lenovo Office laptop', 'Office Laptop Charger', 'Mouse & Dongle', 'Airtel Router', 'Realme earbuds', 'Redmi Phone', 'Portronics Magclick', 'Lenskart Pouch', 'Diary & Pen', 'Wallet', 'Pouch - Headphone, Type B/C Cable', 'iPhone Charger', 'Office icard', 'Umbrella'].forEach(text => addTask(text));
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

// Manual Sync (Pull)
syncBtn.onclick = () => {
  if (AppData.cloudUrl) {
    pullFromCloud();
  } else {
    alert("Connect to Drive first!");
    cloudBtn.click();
  }
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
    setTimeout(() => {
        copyClipboardBtn.textContent = originalText;
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy', err);
    alert('Copy failed. Please copy manually.');
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

// --- CLOUD SYNC ---
async function pushToCloud() {
  try {
    const payload = JSON.stringify({ 
      tasks: AppData.tasks, 
      clipboard: AppData.clipboard 
    });
    const res = await fetch(AppData.cloudUrl, { method: 'POST', body: payload });
    const result = await res.json();
    if (result.status === 'success') showSyncStatus('success');
    else throw new Error("Save Error");
  } catch (e) {
    showSyncStatus('error');
  }
}

async function pullFromCloud() {
  if (!AppData.cloudUrl) return;
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
      applyTheme();
      renderTasks();
      showSyncStatus('success');
    }
  } catch (e) {
    showSyncStatus('error');
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

// --- MODAL ---
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
