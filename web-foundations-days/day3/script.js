let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" }
];

// 1. searchNotes(word) - returns an array of matching notes case-insensitively
function searchNotes(word) {
  const query = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(query));
}

// 2. longestNote() - returns the note object with the most characters, or null if empty
function longestNote() {
  if (notes.length === 0) return null;
  return notes.reduce((longest, current) => 
    current.text.length > longest.text.length ? current : longest
  );
}

// 3. countByCategory() - returns an object counting notes per category
function countByCategory() {
  const counts = {};
  for (let note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

// 4. getSummary() - returns a formatted summary sentence with correct pluralization
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";
  
  const details = Object.entries(counts)
    .map(([category, count]) => `${count} ${category}`)
    .join(", ");
    
  return `${total} ${noteWord}: ${details}.`;
}

// 5. isDuplicate(text) - checks if normalized text already exists
function isDuplicate(text) {
  const normalizedText = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === normalizedText);
}

// 6. addNote(text, category) - adds a note if valid and unique
function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];
  const trimmedText = text ? text.trim() : "";

  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Validation failed: Note text must be between 1 and 200 characters.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Validation failed: Category must be personal, work, or study.");
    return false;
  }

  if (isDuplicate(trimmedText)) {
    console.log("Validation failed: A note with this text already exists.");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: newId, text: trimmedText, category });
  console.log(`Successfully added note: "${trimmedText}" (${category})`);
  return true;
}

// ==========================================
// TESTS & CONSOLE LOGS
// ==========================================

// Test 1: searchNotes
console.log(searchNotes("study")); 
// Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }, { id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("xyz")); 
// Expected: []


// Test 2: longestNote
console.log(longestNote()); 
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

console.log((() => { 
  const backup = notes; 
  notes = []; 
  const res = longestNote(); 
  notes = backup; 
  return res; 
})()); 
// Expected: null (Edge case: empty array)


// Test 3: countByCategory
console.log(countByCategory()); 
// Expected: { personal: 2, study: 2, work: 1 }


// Test 4: getSummary
console.log(getSummary()); 
// Expected: "5 notes: 2 personal, 2 study, 1 work."


// Test 5: isDuplicate
console.log(isDuplicate("call mum")); 
// Expected: true (Ignores case and spacing differences)

console.log(isDuplicate("Learn a new language")); 
// Expected: false


// Test 6: addNote
console.log(addNote("  Learn CSS Grid  ", "study")); 
// Expected: true (Logs success message and pushes to array)

console.log(addNote("Call mum", "personal")); 
// Expected: false (Logs duplicate reason message)