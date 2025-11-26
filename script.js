document.addEventListener("DOMContentLoaded", () => {
  // Memuat tugas yang tersimpan saat halaman dimuat
  loadTasks();
});

// ===================================
// UTILITIES: TANGGAL DAN DUPLIKAT
// ===================================

/**
 * Mengubah format tanggal/waktu dari YYYY-MM-DDThh:mm menjadi format yang lebih mudah dibaca.
 */
// ... (Kode sebelum ini tidak berubah) ...

// ===================================
// UTILITIES: TANGGAL DAN DUPLIKAT
// ===================================

/**
 * Mengubah format tanggal dari YYYY-MM-DD menjadi format yang lebih mudah dibaca (hanya tanggal).
 */
function formatDate(isoString) {
    if (!isoString) return '';

    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;

        // Opsi hanya menyertakan tanggal, bukan jam/menit
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        
        return date.toLocaleDateString('id-ID', options);
    } catch (e) {
        return isoString;
    }
}

// ... (Sisa kode script.js sama seperti sebelumnya) ...

/**
 * Memeriksa apakah tugas sudah ada di daftar (case-insensitive).
 */
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

// ===================================
// FUNGSI UTAMA (CREATE, ADD)
// ===================================

/**
 * Membuat elemen <li> HTML untuk tugas baru.
 * @param {string} text - Teks dari tugas.
 * @param {boolean} isCompleted - Status selesai.
 * @param {string} dateString - String tanggal/waktu (baru).
 * @returns {HTMLLIElement} Elemen tugas.
 */
function createTaskElement(text, isCompleted = false, dateString = "") {
  const listItem = document.createElement("li");
  listItem.classList.add("task-item");
  if (isCompleted) {
    listItem.classList.add("completed");
  }

  const taskId = `task-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  const formattedDate = dateString ? formatDate(dateString) : "";

  // Menambahkan data-date attribute untuk menyimpan string asli
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
        
        <input type="text" class="edit-input" value="${text}" style="display: none;">

        <div class="actions">
            <button class="edit-btn" onclick="editTask(this)" title="Edit Tugas"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" onclick="deleteTask(this)" title="Hapus Tugas"><i class="fas fa-trash"></i></button>
        </div>
    `;

  return listItem;
}

/**
 * Menambahkan tugas baru ke daftar dari input field.
 */
function addTask() {
  const taskInput = document.getElementById("taskInput");
  const dateInput = document.getElementById("dateInput"); // Input tanggal
  const taskList = document.getElementById("taskList");

  const taskText = taskInput.value.trim();
  const taskDate = dateInput.value; // Nilai YYYY-MM-DDThh:mm

  if (taskText === "") {
    alert("Tugas tidak boleh kosong!");
    return;
  }

  // Pengecekan Duplikat
  if (isTaskDuplicate(taskText)) {
    alert("❌ Tugas ini sudah ada di daftar Anda!");
    taskInput.value = "";
    return;
  }

  // Hapus instruksi placeholder jika ada
  const instructionItem = taskList.querySelector(".instruction");
  if (instructionItem) {
    instructionItem.remove();
  }

  const newTask = createTaskElement(taskText, false, taskDate); // Meneruskan taskDate
  taskList.prepend(newTask);

  saveTasks();
  taskInput.value = "";
  dateInput.value = ""; // Kosongkan input tanggal
}

// ===================================
// LOGIKA SELESAI, EDIT, HAPUS
// ===================================

/**
 * Mengubah status selesai/belum selesai dari tugas.
 */
function toggleComplete(checkbox) {
  const listItem = checkbox.closest(".task-item");
  listItem.classList.toggle("completed");
  saveTasks();
}

/**
 * Memulai/Mengakhiri mode edit untuk tugas.
 */
function editTask(editButton) {
  const listItem = editButton.closest(".task-item");
  const taskTextSpan = listItem.querySelector(".task-text");
  const editInput = listItem.querySelector(".edit-input");

  // Mode Simpan (Sedang mengedit)
  if (listItem.classList.contains("editing")) {
    const newText = editInput.value.trim();
    const originalText = taskTextSpan.textContent.trim();

    // Cek duplikat
    if (
      newText.toLowerCase() !== originalText.toLowerCase() &&
      isTaskDuplicate(newText)
    ) {
      alert("❌ Tugas baru ini sudah ada di daftar Anda!");
      editInput.focus();
      return;
    }

    if (newText !== "") {
      taskTextSpan.textContent = newText;
      listItem.classList.remove("editing");
      editButton.innerHTML = '<i class="fas fa-edit"></i>';
      editButton.title = "Edit Tugas";
      editInput.style.display = "none";

      saveTasks();
    } else {
      alert("Tugas tidak boleh kosong!");
    }
  }
  // Mode Edit (Memulai edit)
  else {
    listItem.classList.add("editing");
    editInput.value = taskTextSpan.textContent;
    editInput.style.display = "inline-block";
    editButton.innerHTML = '<i class="fas fa-save"></i>';
    editButton.title = "Simpan Tugas";
    editInput.focus();
  }
}

/**
 * Menghapus tugas dari daftar.
 */
function deleteTask(deleteButton) {
  const listItem = deleteButton.closest(".task-item");
  if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
    listItem.remove();
    saveTasks();
  }
}

// ===================================
// LOGIKA LOCAL STORAGE (dengan Tanggal)
// ===================================

/**
 * Menyimpan daftar tugas saat ini ke Local Storage.
 */
function saveTasks() {
  const taskList = document.getElementById("taskList");
  const tasks = [];

  taskList.querySelectorAll(".task-item:not(.instruction)").forEach((item) => {
    const text = item.querySelector(".task-text").textContent;
    const isCompleted = item.classList.contains("completed");
    const date = item.getAttribute("data-date") || ""; // Simpan string tanggal asli

    tasks.push({
      text: text,
      completed: isCompleted,
      date: date, // Data tanggal disimpan
    });
  });

  localStorage.setItem("todoTasks", JSON.stringify(tasks));
}

/**
 * Memuat tugas dari Local Storage.
 */
function loadTasks() {
  const taskList = document.getElementById("taskList");
  const storedTasks = localStorage.getItem("todoTasks");

  taskList.innerHTML = "";

  if (storedTasks) {
    const tasks = JSON.parse(storedTasks);
    tasks.forEach((task) => {
      // Memuat data tanggal
      const newTask = createTaskElement(
        task.text,
        task.completed,
        task.date || ""
      );
      taskList.appendChild(newTask);
    });
  }

  // Tambahkan placeholder instruksi jika tidak ada tugas yang dimuat
  if (taskList.children.length === 0) {
    const instructionItem = document.createElement("li");
    instructionItem.classList.add("task-item", "instruction");
    instructionItem.innerHTML = `
            <input type="checkbox" disabled>
            <label>Try typing 'Bayar tagihan listrik'</label>
        `;
    taskList.appendChild(instructionItem);
  }
}
