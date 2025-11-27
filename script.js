document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addTaskBtn").addEventListener("click", addTask);
  document.getElementById("taskInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

  loadTasks();
});

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

function checkExpiry() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  document.querySelectorAll(".task-item:not(.instruction)").forEach((item) => {
    const dateString = item.getAttribute("data-date");
    item.classList.remove("expired");

    if (dateString) {
      const dueDate = new Date(dateString);
      dueDate.setHours(0, 0, 0, 0);

      if (!item.classList.contains("completed") && dueDate < today) {
        item.classList.add("expired");
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
  const formattedDate = dateString ? formatDate(dateString) : "";

  listItem.setAttribute("data-date", dateString);

  listItem.innerHTML = `
        <input type="checkbox" id="${taskId}" ${
    isCompleted ? "checked" : ""
  } onclick="toggleComplete(this)">
        <label for="${taskId}">
            <span class="task-text">${text}</span>
            ${
              formattedDate
                ? `<span class="date-info">${formattedDate}</span>`
                : ""
            }
        </label>
        
        <input type="text" class="edit-input edit-text-input" value="${text}" style="display: none;">
        <input type="date" class="edit-input edit-date-input" value="${dateString}" style="display: none;">

        <div class="actions">
            <button class="edit-btn" onclick="editTask(this)" title="Edit Tugas"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" onclick="deleteTask(this)" title="Hapus Tugas"><i class="fas fa-trash"></i></button>
        </div>
    `;

  return listItem;
}

function addTask() {
  const taskInput = document.getElementById("taskInput");
  const dateInput = document.getElementById("dateInput");
  const taskList = document.getElementById("taskList");

  const taskText = taskInput.value.trim();
  const taskDate = dateInput.value;

  if (taskText === "") {
    alert("Tugas tidak boleh kosong!");
    return;
  }

  if (taskDate === "") {
    alert("⚠️ Anda harus menyetel tanggal jatuh tempo untuk tugas ini!");
    return;
  }

  if (isTaskDuplicate(taskText)) {
    alert("❌ Tugas ini sudah ada di daftar Anda!");
    taskInput.value = "";
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
  }, 10);

  saveTasks();
  taskInput.value = "";
  dateInput.value = "";
}

function toggleComplete(checkbox) {
  const listItem = checkbox.closest(".task-item");
  listItem.classList.toggle("completed");
  saveTasks();
}

function editTask(editButton) {
  const listItem = editButton.closest(".task-item");
  const taskTextSpan = listItem.querySelector(".task-text");
  const dateInfoSpan = listItem.querySelector(".date-info");

  const editText = listItem.querySelector(".edit-text-input");
  const editDate = listItem.querySelector(".edit-date-input");

  if (listItem.classList.contains("editing")) {
    const newText = editText.value.trim();
    const newDate = editDate.value;
    const originalText = taskTextSpan.textContent.trim();

    if (
      newText.toLowerCase() !== originalText.toLowerCase() &&
      isTaskDuplicate(newText)
    ) {
      alert("❌ Tugas baru ini sudah ada di daftar Anda!");
      editText.focus();
      return;
    }

    if (newText !== "") {
      if (newDate === "") {
        alert("⚠️ Tanggal tidak boleh kosong saat menyimpan tugas!");
        editDate.focus();
        return;
      }

      taskTextSpan.textContent = newText;

      if (dateInfoSpan) {
        if (!newDate) {
          dateInfoSpan.remove();
        } else {
          dateInfoSpan.textContent = formatDate(newDate);
        }
      } else if (newDate) {
        const newDateSpan = document.createElement("span");
        newDateSpan.classList.add("date-info");
        newDateSpan.textContent = formatDate(newDate);
        listItem.querySelector("label").appendChild(newDateSpan);
      }

      listItem.setAttribute("data-date", newDate);

      listItem.classList.remove("editing");
      editButton.innerHTML = '<i class="fas fa-edit"></i>';
      editButton.title = "Edit Tugas";
      editText.style.display = "none";
      editDate.style.display = "none";

      saveTasks();
    } else {
      alert("Tugas tidak boleh kosong!");
    }
  } else {
    listItem.classList.add("editing");

    editText.value = taskTextSpan.textContent;
    editText.style.display = "inline-block";

    editDate.value = listItem.getAttribute("data-date") || "";
    editDate.style.display = "inline-block";

    editButton.innerHTML = '<i class="fas fa-save"></i>';
    editButton.title = "Simpan Tugas";

    editText.focus();
  }
}

function deleteTask(deleteButton) {
  const listItem = deleteButton.closest(".task-item");
  if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
    listItem.classList.add("fade-out");

    setTimeout(() => {
      listItem.remove();
      saveTasks();
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
  checkExpiry();
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
  checkExpiry();
}
