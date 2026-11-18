const STORAGE_KEY = "spendwise-expenses-v1";
const categories = ["Food", "Transport", "Entertainment", "Utilities", "Other"];

const form = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const expenseIdInput = document.getElementById("expenseId");
const formError = document.getElementById("formError");
const rows = document.getElementById("expenseRows");
const emptyState = document.getElementById("emptyState");
const categoryFilter = document.getElementById("categoryFilter");
const dateFilter = document.getElementById("dateFilter");
const sortOrder = document.getElementById("sortOrder");

let expenses = loadExpenses();

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadExpenses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(item =>
      item && typeof item.title === "string" &&
      Number.isFinite(Number(item.amount)) && item.date
    ) : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2
  }).format(value);
}

function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function updateSummary() {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthly = expenses
    .filter(item => item.date.startsWith(monthPrefix))
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const allTime = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  document.getElementById("monthlyTotal").textContent = formatCurrency(monthly);
  document.getElementById("allTimeTotal").textContent = formatCurrency(allTime);
  document.getElementById("expenseCount").textContent = expenses.length;
  document.getElementById("monthCaption").textContent = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  document.getElementById("visibleCount").textContent = `${expenses.length} ${expenses.length === 1 ? "entry" : "entries"}`;
}

function renderExpenses() {
  const selectedCategory = categoryFilter.value;
  const selectedDate = dateFilter.value;
  const direction = sortOrder.value === "newest" ? -1 : 1;

  const visible = expenses
    .filter(item => selectedCategory === "all" || item.category === selectedCategory)
    .filter(item => !selectedDate || item.date === selectedDate)
    .sort((a, b) => a.date.localeCompare(b.date) * direction || (b.createdAt || 0) - (a.createdAt || 0));

  rows.innerHTML = "";
  document.getElementById("visibleCount").textContent = `${visible.length} ${visible.length === 1 ? "entry" : "entries"}`;
  emptyState.style.display = visible.length ? "none" : "block";

  visible.forEach(item => {
    const tr = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.date);

    const titleCell = document.createElement("td");
    titleCell.className = "expense-title";
    titleCell.textContent = item.title;

    const categoryCell = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = "category-tag";
    tag.textContent = item.category;
    categoryCell.appendChild(tag);

    const amountCell = document.createElement("td");
    amountCell.className = "amount-cell";
    amountCell.textContent = formatCurrency(Number(item.amount));

    const actionCell = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "icon-button";
    editButton.textContent = "✎";
    editButton.title = "Edit expense";
    editButton.setAttribute("aria-label", `Edit ${item.title}`);
    editButton.addEventListener("click", () => startEditing(item.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "icon-button delete";
    deleteButton.textContent = "×";
    deleteButton.title = "Delete expense";
    deleteButton.setAttribute("aria-label", `Delete ${item.title}`);
    deleteButton.addEventListener("click", () => deleteExpense(item.id));

    actionWrap.append(editButton, deleteButton);
    actionCell.appendChild(actionWrap);
    tr.append(dateCell, titleCell, categoryCell, amountCell, actionCell);
    rows.appendChild(tr);
  });
}

function refresh() {
  updateSummary();
  renderExpenses();
}

function resetForm() {
  form.reset();
  expenseIdInput.value = "";
  dateInput.value = localDateString();
  document.getElementById("formHeading").textContent = "Add an expense";
  document.getElementById("submitButton").textContent = "＋ Add expense";
  document.getElementById("cancelEdit").classList.add("hidden");
  formError.textContent = "";
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!title) {
    formError.textContent = "Please enter an expense title.";
    titleInput.focus();
    return;
  }
  if (!amountInput.value || !Number.isFinite(amount) || amount <= 0) {
    formError.textContent = "Enter an amount greater than ₹0.";
    amountInput.focus();
    return;
  }
  if (!date) {
    formError.textContent = "Please choose an expense date.";
    dateInput.focus();
    return;
  }

  const editingId = expenseIdInput.value;
  if (editingId) {
    expenses = expenses.map(item => item.id === editingId
      ? { ...item, title, amount: Math.round(amount * 100) / 100, category, date }
      : item);
  } else {
    expenses.push({
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      title, amount: Math.round(amount * 100) / 100, category, date, createdAt: Date.now()
    });
  }

  saveExpenses();
  resetForm();
  refresh();
});

function startEditing(id) {
  const item = expenses.find(expense => expense.id === id);
  if (!item) return;
  expenseIdInput.value = item.id;
  titleInput.value = item.title;
  amountInput.value = item.amount;
  categoryInput.value = categories.includes(item.category) ? item.category : "Other";
  dateInput.value = item.date;
  document.getElementById("formHeading").textContent = "Edit expense";
  document.getElementById("submitButton").textContent = "Save changes";
  document.getElementById("cancelEdit").classList.remove("hidden");
  formError.textContent = "";
  titleInput.focus();
  document.querySelector(".form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteExpense(id) {
  const item = expenses.find(expense => expense.id === id);
  if (!item || !window.confirm(`Delete "${item.title}"?`)) return;
  expenses = expenses.filter(expense => expense.id !== id);
  saveExpenses();
  if (expenseIdInput.value === id) resetForm();
  refresh();
}

document.getElementById("cancelEdit").addEventListener("click", resetForm);
categoryFilter.addEventListener("change", renderExpenses);
dateFilter.addEventListener("change", renderExpenses);
sortOrder.addEventListener("change", renderExpenses);
document.getElementById("clearFilters").addEventListener("click", () => {
  categoryFilter.value = "all";
  dateFilter.value = "";
  sortOrder.value = "newest";
  renderExpenses();
});

document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "short", day: "numeric", month: "short", year: "numeric"
});
dateInput.value = localDateString();
refresh();
