# Upcoming Enhancements Plan

This document captures the planned changes for three requested features: inventory validation, user disable/enable safeguards, and transaction-history UI refinements. The plan is organized by feature with backend/frontend scopes.

## 1. Inventory safeguards (sell quantity & quantity type)
- **Backend**
  - Extend `TransactionRepository` with helpers to compute available inventory per product + quantity type.
  - Update `TransactionService.create_transaction` and `.update_transaction` to verify:
    - Sell quantity does not exceed available inventory (buys - sells).
    - Sell `quantity_type` matches the one used for buys; reject otherwise.
  - Return meaningful 400 errors so the UI can display the reason.
- **Frontend**
  - In `useTransactions.ts` / `AddEntryPage.tsx`, pre-validate sell entries:
    - Derive current inventory from context transactions to give instant feedback.
    - Ensure quantity type dropdown only offers the type previously used for the selected product.
  - Surface backend validation errors via toast when server rejects the request.

## 2. User self-disable prevention & toggle UX
- **Backend**
  - Update `UserService.update_role_status` to reject attempts where the actor equals `user_id`.
  - Allow toggling `disabled` without requiring `role` changes; clarify via error message if self-disable attempted.
- **Frontend**
  - In the user management page (e.g., `NewAccountPage.tsx`), disable the “Disable” control for the logged-in user by comparing emails.
  - Replace the static “Disable” button with a toggle that switches between Active/Inactive states, calling a new context helper (`toggleUserDisabled`).
  - Update UI badges to reflect the current status immediately after toggling.

## 3. Transactions history filter layout
- **Frontend only**
  - Adjust the filter toolbar in `TransactionsPage.tsx` so inputs (Search, Type, Date From, Date To) share a single row on medium screens:
    - Wrap date inputs in a flex container to keep them on one line.
    - Shrink or convert the search action into an inline button / icon so it doesn’t stretch the layout.
  - Ensure responsiveness down to mobile (stack gracefully when width is limited).
