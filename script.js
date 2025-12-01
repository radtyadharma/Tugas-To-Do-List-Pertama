document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addTaskBtn").addEventListener("click", addTask);
  document.getElementById("taskInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

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

function showModal(title, message, type, onConfirm) {
  const modalOverlay = document.getElementById("customModal");
  const modalBox = modalOverlay.querySelector(".custom-modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = modalOverlay.querySelector(".modal-body");
  const confirmBtn = document.getElementById("modalConfirmBtn");
  const closeBtn = document.getElementById("modalCloseBtn");

  modalTitle.textContent = title;
  modalBody.innerHTML = `<p id="modalMessage">${message}</p>`;

  modalBox.classList.remove("modal-alert", "modal-confirm", "modal-edit");

  if (type === "confirm") {
    modalBox.classList.add("modal-confirm");
    confirmBtn.style.display = "inline-block";
    confirmBtn.textContent = "Ya, Hapus";
    closeBtn.textContent = "Batal";

    confirmBtn.onclick = () => {
      closeModal();
      if (onConfirm) onConfirm();
    };
    closeBtn.onclick = closeModal;
  } else {
    modalBox.classList.add("modal-alert");
    confirmBtn.style.display = "none";
    closeBtn.textContent = "Tutup";

    closeBtn.onclick = closeModal;
  }

  modalOverlay.classList.remove("hidden");
}

function showEditModal(listItem) {
  const modalOverlay = document.getElementById("customModal");
  const modalBox = modalOverlay.querySelector(".custom-modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = modalOverlay.querySelector(".modal-body");
  const confirmBtn = document.getElementById("modalConfirmBtn");
  const closeBtn = document.getElementById("modalCloseBtn");

  const currentText = listItem.querySelector(".task-text").textContent;
  const currentDate = listItem.getAttribute("data-date") || "";

  modalTitle.textContent = "Ubah Tugas";

  modalBody.innerHTML = `
    <div class="edit-form-group">
        <label for="editTaskText" style="display: block; margin-bottom: 5px; font-weight: bold;">Tugas:</label>
        <input type="text" id="editTaskText" class="edit-modal-input" value="${currentText}" required>
    </div>
    <div class="edit-form-group">
        <label for="editTaskDate" style="display: block; margin-bottom: 5px; font-weight: bold;">Tanggal Tenggat:</label>
        <input type="date" id="editTaskDate" class="edit-modal-input" value="${currentDate}">
    </div>
  `;

  modalBox.classList.remove("modal-alert", "modal-confirm");
  modalBox.classList.add("modal-edit");

  confirmBtn.style.display = "inline-block";
  confirmBtn.textContent = "Simpan Perubahan";
  closeBtn.textContent = "Batal";

  confirmBtn.onclick = () => {
    saveEditTask(listItem);
  };
  closeBtn.onclick = closeModal;

  document.getElementById("editTaskText").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveEditTask(listItem);
    }
  });

  modalOverlay.classList.remove("hidden");
  document.getElementById("editTaskText").focus();
}

function saveEditTask(listItem) {
  const newText = document.getElementById("editTaskText").value.trim();
  const newDate = document.getElementById("editTaskDate").value;
  const originalText = listItem.querySelector(".task-text").textContent.trim();

  if (newText === "") {
    closeModal();
    showModal(
      "⚠️ Tugas Wajib Diisi",
      "Deskripsi tugas tidak boleh kosong.",
      "alert"
    );
    return;
  }

  const isDuplicate = Array.from(
    document.querySelectorAll(".task-item:not(.instruction)")
  ).some((item) => {
    if (item !== listItem) {
      return (
        item.querySelector(".task-text").textContent.trim().toLowerCase() ===
        newText.toLowerCase()
      );
    }
    return false;
  });

  if (isDuplicate && newText.toLowerCase() !== originalText.toLowerCase()) {
    closeModal();
    showModal(
      "❌ Duplikasi Tugas",
      "Tugas baru ini sudah ada di daftar Anda. Mohon ganti deskripsi.",
      "alert"
    );
    return;
  }

  listItem.querySelector(".task-text").textContent = newText;

  const dateDisplay = newDate ? formatDate(newDate) : "Tidak ada tenggat waktu";

  listItem.querySelector(".date-info").textContent = dateDisplay;
  listItem.setAttribute("data-date", newDate);

  checkExpiry(listItem);
  saveTasks();
  filterTasks();
  closeModal();
}

function closeModal() {
  document.getElementById("customModal").classList.add("hidden");

  document.getElementById("modalConfirmBtn").onclick = null;
  document.getElementById("modalCloseBtn").onclick = null;

  document
    .getElementById("customModal")
    .querySelector(".modal-body").innerHTML = '<p id="modalMessage"></p>';
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

  if (taskText === "") {
    showModal(
      "⚠️ Tugas Wajib Diisi",
      "Anda harus mengisi deskripsi tugas sebelum menambahkannya.",
      "alert"
    );
    taskInput.focus();
    return;
  }

  if (isTaskDuplicate(taskText)) {
    showModal(
      "❌ Duplikasi Tugas",
      "Tugas ini sudah ada di daftar Anda. Masukkan tugas yang berbeda.",
      "alert"
    );
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
  showEditModal(listItem);
}

function deleteTask(deleteButton) {
  const listItem = deleteButton.closest(".task-item");

  const onConfirmDelete = () => {
    listItem.classList.add("fade-out");

    setTimeout(() => {
      listItem.remove();
      saveTasks();
      updateCounter();
      filterTasks();
    }, 300);
  };

  showModal(
    "❓ Konfirmasi Hapus",
    "Apakah anda yakin ingin menghapus tugas ini secara permanen?",
    "confirm",
    onConfirmDelete
  );
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
