// api.js - Task 1, 2 & 3: GET, POST and DELETE
const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.getElementById("load-btn");
const statusEl = document.getElementById("status");
const notesList = document.getElementById("notes-list");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitBtn = document.getElementById("submit-btn");

/**
 * Reusable async function to handle fetch requests, validate status, and parse/return response.
 */
async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response;
}

/**
 * Helper function to render a single note item into the list with a Delete button.
 */
function renderNoteItem(note, prepend = false) {
  const li = document.createElement("li");
  li.className = "note-item";

  const contentDiv = document.createElement("div");
  contentDiv.className = "note-content";

  const titleHeading = document.createElement("h3");
  titleHeading.textContent = note.title;

  const bodyP = document.createElement("p");
  bodyP.textContent = note.body || "";

  contentDiv.appendChild(titleHeading);
  contentDiv.appendChild(bodyP);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete-btn";
  deleteBtn.addEventListener("click", () => deleteNote(note.id, li, deleteBtn));

  li.appendChild(contentDiv);
  li.appendChild(deleteBtn);

  if (prepend) {
    notesList.prepend(li);
  } else {
    notesList.appendChild(li);
  }
}

/**
 * Loads up to 10 notes from the server using GET.
 */
async function loadNotes() {
  loadBtn.disabled = true;
  statusEl.textContent = "Loading notes...";
  notesList.innerHTML = "";

  try {
    const response = await request(`${API_URL}?_limit=10`);
    const notes = await response.json();

    if (notes.length === 0) {
      statusEl.textContent = "No notes available.";
      const li = document.createElement("li");
      li.textContent = "There are no notes to display.";
      notesList.appendChild(li);
      return;
    }

    statusEl.textContent = `Loaded ${notes.length} notes from the server.`;

    notes.forEach(note => {
      renderNoteItem(note, false);
    });

  } catch (error) {
    statusEl.textContent = `Error: Could not load notes. (${error.message})`;
  } finally {
    loadBtn.disabled = false;
  }
}

/**
 * Creates a new note via POST.
 */
async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // Validation: Title is required and max 100 characters
  if (!title) {
    statusEl.textContent = "Error: Title is required.";
    return;
  }
  if (title.length > 100) {
    statusEl.textContent = "Error: Title must be 100 characters or fewer.";
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = "Creating note...";

  try {
    const response = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      },
      body: JSON.stringify({
        title: title,
        body: body,
        userId: 1
      })
    });

    const newNote = await response.json();

    // Add new note to the top of the list
    renderNoteItem(newNote, true);

    // Show status code and new id
    statusEl.textContent = `Note created (status ${response.status}, id ${newNote.id}).`;

    // Clear form
    titleInput.value = "";
    bodyInput.value = "";

  } catch (error) {
    statusEl.textContent = `Error: Could not create note. (${error.message})`;
  } finally {
    submitBtn.disabled = false;
  }
}

/**
 * Deletes a note by its ID using DELETE.
 * 
 * NOTE ON JSONPLACEHOLDER: 
 * JSONPlaceholder is a mock API that simulates successful requests (returning status 200) 
 * but does not actually persist deletions on its server. Therefore, to ensure proper 
 * front-end behavior, we handle the deletion by removing the list item element from the DOM.
 */
async function deleteNote(id, listItemEl, deleteBtn) {
  deleteBtn.disabled = true;
  statusEl.textContent = `Deleting note ${id}...`;

  try {
    const response = await request(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    // Remove the note element from the DOM on success
    listItemEl.remove();
    statusEl.textContent = `Note deleted successfully (status ${response.status}).`;

  } catch (error) {
    statusEl.textContent = `Error: Could not delete note. (${error.message})`;
    deleteBtn.disabled = false;
  }
}

// Event Listeners
loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);