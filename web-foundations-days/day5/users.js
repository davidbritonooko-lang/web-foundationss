// day5/users.js
const loadUsersBtn = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusEl = document.getElementById("status");
const usersList = document.getElementById("users-list");

let allUsers = []; // Stores loaded users locally

function renderUsers(list) {
  usersList.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "No users match your filter.";
    usersList.appendChild(li);
    return;
  }

  list.forEach(user => {
    const li = document.createElement("li");
    li.className = "user-card";

    const nameHeading = document.createElement("h3");
    nameHeading.textContent = user.name;

    const emailP = document.createElement("p");
    emailP.textContent = `Email: ${user.email}`;

    // Safely extract nested properties (city and company name)
    const city = user.address ? user.address.city : "Unknown";
    const companyName = user.company ? user.company.name : "Independent";

    const locationP = document.createElement("p");
    locationP.textContent = `City: ${city}`;

    const companyP = document.createElement("p");
    companyP.textContent = `Company: ${companyName}`;

    li.appendChild(nameHeading);
    li.appendChild(emailP);
    li.appendChild(locationP);
    li.appendChild(companyP);

    usersList.appendChild(li);
  });
}

async function loadUsers() {
  // Disable button and show loading status
  loadUsersBtn.disabled = true;
  statusEl.textContent = "Loading users...";
  usersList.innerHTML = "";

  try {
    // To test the error path (Step 5), modify URL temporarily, e.g., ".../users-error"
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    allUsers = await response.json();
    
    statusEl.textContent = `Successfully loaded ${allUsers.length} users.`;
    
    // Apply any existing filter value if user typed before loading finished
    filterUsers();

  } catch (error) {
    statusEl.textContent = `Error: Could not load users. (${error.message})`;
    allUsers = [];
    usersList.innerHTML = "";
  } finally {
    // Re-enable button
    loadUsersBtn.disabled = false;
  }
}

function filterUsers() {
  const query = filterInput.value.trim().toLowerCase();
  
  const filtered = allUsers.filter(user => 
    user.name.toLowerCase().includes(query)
  );

  renderUsers(filtered);
}

// Event Listeners
loadUsersBtn.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
  filterUsers();
});