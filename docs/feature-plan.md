# Upcoming Enhancements Plan

This document captures the planned changes for three requested features: inventory validation, user disable/enable safeguards, and transaction-history UI refinements. The plan is organized by feature with backend/frontend scopes.

## 1. Inventory safeguards (sell quantity & quantity type) ✅
- **Backend**
  - `TransactionRepository` exposes `get_available_quantity` to sum buys vs sells per product/quantity-type.
  - `TransactionService` now validates sell payloads, ensuring the requested quantity/type exists and isn’t oversold; detailed 400s are returned.
- **Frontend**
  - `AddEntryPage` aggregates inventory from context transactions and, before submitting, blocks sells that exceed the available quantity or mismatch type. Sell dropdowns also display current availability to the user.

## 2. User self-disable prevention & toggle UX ✅
- **Backend**
  - Ensure `UserService.update_role_status` rejects attempts where the actor equals `user_id`, and allow toggling `disabled` without forcing role changes.
- **Frontend**
  - Remove the separate “Disable” button; instead show an Active/Inactive toggle that uses a shared `toggleUserStatus` helper.
  - Disable both the status toggle and role dropdown when the row corresponds to the logged-in user so they can’t change their own status or role.

## 3. Transactions history filter layout ✅
- **Frontend only**
  - The filter toolbar is now a responsive flex row: search, type, and both date inputs fit on one line for desktop and gracefully wrap on mobile. The search field includes an inline “Clear” action so we no longer need a full-width button, keeping the toolbar compact.
