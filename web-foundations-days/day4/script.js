const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// Helper to count words accurately
function countWords(str) {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// Update counters and apply threshold styles
function updateCounts() {
  const text = noteText.value;
  const length = text.length;
  const words = countWords(text);

  charCount.textContent = `${length} / 200 characters`;
  wordCount.textContent = `${words} words`;

  // Reset classes
  charCount.classList.remove("warning", "over");

  if (length > 200) {
    charCount.classList.add("over");
  } else if (length > 180) {
    charCount.classList.add("warning");
  }
}

// Save draft to localStorage
function saveDraft() {
  localStorage.setItem("note-draft", noteText.value);
}

// Clear note data and storage
function clearNote() {
  noteText.value = "";
  localStorage.removeItem("note-draft");
  updateCounts();
  noteText.focus();
}

// Event Listeners
noteText.addEventListener("input", () => {
  updateCounts();
  saveDraft();
});

noteText.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    clearNote();
  }
});

clearBtn.addEventListener("click", clearNote);

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Initialization: Restore saved draft and theme preference on load
function init() {
  const savedDraft = localStorage.getItem("note-draft");
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  } else {
    themeToggle.textContent = "Dark mode";
  }

  updateCounts();
}

init();