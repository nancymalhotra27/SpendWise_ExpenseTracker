# Spendwise — Personal Expense Tracker

A responsive, single-page expense tracker built with HTML, CSS and vanilla JavaScript.

## Run it
1. Extract the ZIP file.
2. Open `index.html` in a modern browser.
3. Add an expense using the form. No server or database setup is required.

## Features
- Add, edit and delete expenses
- Title, amount, category and date validation
- Category and exact-date filters
- Newest-first / oldest-first date sorting
- Current-month total, all-time total and transaction count
- Automatic persistence using browser `localStorage`
- Responsive layout for mobile, tablet and desktop

## Data and privacy
Expenses are stored in this browser under the localStorage key `spendwise-expenses-v1`. They remain on this device/browser and are not synced to an account. Clearing browser site data may remove them. Use the same browser profile to see saved entries.

## Files
- `index.html` — page structure
- `style.css` — responsive styling
- `script.js` — expense logic and localStorage persistence

The currency display is set to Indian Rupees (INR).
