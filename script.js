document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addTaskBtn").addEventListener("click", addTask);
  document.getElementById("taskInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

  document.getElementById("taskInput").addEventListener("input", clearError);

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      filterTasks();
    });
  });

  loadTheme();
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  loadTasks();
  updateCounter();
});

function showError(message) {
  const errorDiv = document.getElementById("validationError");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

function clearError() {
  const errorDiv = document.getElementById("validationError");
  errorDiv.textContent = "";
  errorDiv.style.display = "none";
}

function toggleTheme() {
  const body = document.body;
  const isDarkMode = body.classList.toggle("dark-mode");
  localStorage.setItem("theme", isDarkMode ? "dark" : "light");
}

function loadTheme() {
  const theme = localStorage.getItem("theme");
  const body = document.body;

  if (theme === "dark") {
    body.classList.add("dark-mode");
  } else {
    body.classList.remove("dark-mode");
  }
}

function formatDate(isoString) {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return date.toLocaleDateString("id-ID", options);
  } catch (e) {
    return isoString;
  }
}

function checkExpiry(item) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateString = item.getAttribute("data-date");
  item.classList.remove("expired");

  if (dateString) {
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);

    if (!item.classList.contains("completed") && dueDate < today) {
      item.classList.add("expired");
    }
  }
  return item.classList.contains("expired");
}

function updateCounter() {
  const taskList = document.getElementById("taskList");
  const totalCount = taskList.querySelectorAll(
    ".task-item:not(.instruction)"
  ).length;

  let pendingCount = 0;
  taskList.querySelectorAll(".task-item:not(.instruction)").forEach((item) => {
    if (!item.classList.contains("completed")) {
      pendingCount++;
    }
  });

  document.getElementById("totalCount").textContent = totalCount;
  document.getElementById("pendingCount").textContent = pendingCount;
}

function filterTasks() {
  const activeButton = document.querySelector(".filter-btn.active");
  const status = activeButton
    ? activeButton.getAttribute("data-filter")
    : "all";

  const taskList = document.getElementById("taskList");

  taskList.querySelectorAll(".task-item:not(.instruction)").forEach((item) => {
    const isCompleted = item.classList.contains("completed");
    const isExpired = checkExpiry(item);

    item.classList.remove("hidden");

    if (status === "pending" && isCompleted) {
      item.classList.add("hidden");
    } else if (status === "completed" && !isCompleted) {
      item.classList.add("hidden");
    } else if (status === "expired") {
      if (!isExpired || isCompleted) {
        item.classList.add("hidden");
      }
    }
  });
}

function isTaskDuplicate(newTaskText) {
  const taskList = document.getElementById("taskList");
  let isDuplicate = false;
  const cleanNewText = newTaskText.trim().toLowerCase();

  taskList.querySelectorAll(".task-item:not(.instruction)").forEach((item) => {
    const existingText = item
      .querySelector(".task-text")
      .textContent.trim()
      .toLowerCase();
    if (existingText === cleanNewText) {
      isDuplicate = true;
    }
  });
  return isDuplicate;
}

function createTaskElement(
  text,
  isCompleted = false,
  dateString = "",
  isNew = false
) {
  const listItem = document.createElement("li");
  listItem.classList.add("task-item");
  if (isCompleted) {
    listItem.classList.add("completed");
  }

  if (isNew) {
    listItem.classList.add("fade-in-start");
  }

  const taskId = `task-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  const formattedDateDisplay = dateString
    ? formatDate(dateString)
    : "Tidak ada tenggat waktu";

  listItem.setAttribute("data-date", dateString);

  listItem.innerHTML = `
        <input type="checkbox" id="${taskId}" ${
    isCompleted ? "checked" : ""
  } onclick="toggleComplete(this)">
        <label for="${taskId}">
            <span class="task-text">${text}</span>
            <span class="date-info">${formattedDateDisplay}</span>
        </label>
        
        <input type="text" class="edit-input edit-text-input" value="${text}" style="display: none;">
        <input type="date" class="edit-input edit-date-input" value="${dateString}" style="display: none;">

        <div class="actions">
            <button class="edit-btn" onclick="editTask(this)" title="Edit Tugas"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" onclick="deleteTask(this)" title="Hapus Tugas"><i class="fas fa-trash"></i></button>
        </div>
    `;

  if (!isNew) {
    checkExpiry(listItem);
  }

  return listItem;
}

function addTask() {
  const taskInput = document.getElementById("taskInput");
  const dateInput = document.getElementById("dateInput");
  const taskList = document.getElementById("taskList");

  const taskText = taskInput.value.trim();
  const taskDate = dateInput.value;

  clearError();

  if (taskText === "") {
    showError("⚠️ TUGAS WAJIB DI ISI !");
    taskInput.focus();
    return;
  }

  if (isTaskDuplicate(taskText)) {
    showError("❌ TUGAS INI SUDAH ADA DI DAFTAR ANDA !");
    taskInput.focus();
    return;
  }

  const instructionItem = taskList.querySelector(".instruction");
  if (instructionItem) {
    instructionItem.remove();
  }

  const newTask = createTaskElement(taskText, false, taskDate, true);
  taskList.prepend(newTask);

  setTimeout(() => {
    newTask.classList.remove("fade-in-start");
    checkExpiry(newTask);
  }, 10);

  saveTasks();
  taskInput.value = "";
  dateInput.value = "";
  updateCounter();
  filterTasks();
}

function toggleComplete(checkbox) {
  const listItem = checkbox.closest(".task-item");
  listItem.classList.toggle("completed");
  checkExpiry(listItem);
  saveTasks();
  updateCounter();
  filterTasks();
}

function editTask(editButton) {
  const listItem = editButton.closest(".task-item");
  const taskTextSpan = listItem.querySelector(".task-text");

  const editText = listItem.querySelector(".edit-input.edit-text-input");
  const editDate = listItem.querySelector(".edit-input.edit-date-input");

  if (listItem.classList.contains("editing")) {
    const newText = editText.value.trim();
    const newDate = editDate.value;
    const originalText = taskTextSpan.textContent.trim();

    clearError();

    if (newText === "") {
      showError("⚠️ TUGAS WAJIB DI ISI !");
      editText.focus();
      return;
    }

    if (
      newText.toLowerCase() !== originalText.toLowerCase() &&
      isTaskDuplicate(newText)
    ) {
      showError("❌ TUGAS BARU INI SUDAH ADA DI DAFTAR ANDA !");
      editText.focus();
      return;
    }

    taskTextSpan.textContent = newText;

    const dateDisplay = newDate
      ? formatDate(newDate)
      : "Tidak ada tenggat waktu";

    let dateSpan = listItem.querySelector(".date-info");
    if (dateSpan) {
      dateSpan.textContent = dateDisplay;
    }

    listItem.setAttribute("data-date", newDate);

    listItem.classList.remove("editing");
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.title = "Edit Tugas";
    editText.style.display = "none";
    editDate.style.display = "none";

    checkExpiry(listItem);
    saveTasks();
    filterTasks();
  } else {
    listItem.classList.add("editing");

    editText.value = taskTextSpan.textContent;
    editText.style.display = "inline-block";

    editDate.value = listItem.getAttribute("data-date") || "";
    editDate.style.display = "inline-block";

    editText.setAttribute("required", "required");
    editDate.removeAttribute("required");

    editButton.innerHTML = '<i class="fas fa-save"></i>';
    editButton.title = "Simpan Tugas";

    editText.focus();
  }
}

function deleteTask(deleteButton) {
  const listItem = deleteButton.closest(".task-item");
  if (confirm("❓ Apakah anda yakin menghapus tugas ini?")) {
    listItem.classList.add("fade-out");

    setTimeout(() => {
      listItem.remove();
      saveTasks();
      updateCounter();
      filterTasks();
    }, 300);
  }
}

function saveTasks() {
  const taskList = document.getElementById("taskList");
  const tasks = [];

  taskList.querySelectorAll(".task-item:not(.instruction)").forEach((item) => {
    const text = item.querySelector(".task-text").textContent;
    const isCompleted = item.classList.contains("completed");
    const date = item.getAttribute("data-date") || "";

    tasks.push({
      text: text,
      completed: isCompleted,
      date: date,
    });
  });

  localStorage.setItem("todoTasks", JSON.stringify(tasks));
}

function loadTasks() {
  const taskList = document.getElementById("taskList");
  const storedTasks = localStorage.getItem("todoTasks");

  taskList.innerHTML = "";

  if (storedTasks) {
    const tasks = JSON.parse(storedTasks);
    tasks.forEach((task) => {
      const newTask = createTaskElement(
        task.text,
        task.completed,
        task.date || ""
      );
      taskList.appendChild(newTask);
    });
  }

  if (taskList.children.length === 0) {
    const instructionItem = document.createElement("li");
    instructionItem.classList.add("task-item", "instruction");
    instructionItem.innerHTML = `
            <input type="checkbox" disabled>
            <label>Coba ketik 'Bayar tagihan listrik'</label>
        `;
    taskList.appendChild(instructionItem);
  }

  updateCounter();
  filterTasks();
}
