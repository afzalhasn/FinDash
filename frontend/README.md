
  # FinDash Cash Flow Tracker

  FinDash is a browser-based cash-flow and operations tracking tool tailored for small trading businesses. It simulates how an admin, partner, or staff member can record purchases, sales, expenses, manage investors, and monitor profitability without a backend. The UI is adapted from the Figma exploration at https://www.figma.com/design/DDUrG1hYqUd3hkFgPnOpWS/FinDash-Cash-Flow-Tracker.

  ## Product goal

  FinDash gives teams a single pane of glass for:

  - Monitoring cash movement (purchases, sales, expenses) and profitability in near real time.
  - Managing investors, their contributions, withdrawals, and net capital.
  - Controlling user access based on role (admin, partner, staff) without a full auth server.
  - Reviewing trends via dashboards and insights to inform buying/selling decisions.

  Everything runs client-side, making it easy to demo without infrastructure while still modeling the future backend contracts.

  ## High-level architecture

  | Layer | Description |
  | --- | --- |
  | UI | Next.js App Router (`app/page.tsx`, `app/layout.tsx`). All “pages” are still the screens from the original React bundle (`src/app/pages/*`) rendered inside a single SPA router maintained in context. |
  | State management | `src/app/context/AppContext.tsx` holds global state for users, sessions, transactions, and investors. |
  | Persistence | Data is serialized to `localStorage` (keys prefixed with `findash_v2_*`). When the app boots we hydrate from storage and convert dates back into `Date` objects. |
  | Visualization | Recharts and Tailwind components provide dashboards, filters, and tables. |
  | Notifications | `sonner` provides toast feedback for CRUD actions. |

  ```
  app/
    layout.tsx          # root HTML shell & global CSS import
    page.tsx            # renders <App/> which holds legacy router
  src/
    app/
      App.tsx           # role-based router that swaps pages
      context/AppContext.tsx
      pages/*.tsx       # Login, Dashboard, Transactions, Add Entry, Product Insights, Add Investor, New Account
    styles/*.css
  ```

  ## Data model

  | Entity | Description |
  | --- | --- |
  | `User` | Mock login identities with role and optional disabled flag. Roles: `admin`, `partner`, `staff`. |
  | `Transaction` | A `buy`, `sell`, or `expense` entry. buys/sells store product, quantity, price per unit; expenses store category/description. |
  | `Investor` | Tracks total invested/withdrawn/net values and a history of `InvestmentActivity` (investment or withdrawal). |

  The context exposes methods such as `login`, `logout`, `addTransaction`, `addInvestor`, `addInvestment`, `addWithdrawal`, `addUser`, `disableUser`, etc., which mutate state and persist the new snapshot.

  ## Application flow

  1. **Login (`src/app/pages/LoginPage.tsx`)**  
     - Users enter email + password (`password` for all demo accounts).  
     - Successful login sets `currentPage` to `dashboard` in context.

  2. **Dashboard (`DashboardPage.tsx`)**  
     - Role-aware header (admin sees extra actions).  
     - Time range filters (today/week/month/custom) to slice transaction data.  
     - Summary cards for purchases, sales, expenses, total cash-in from investors, and profit.  
     - Recharts visualizations: doughnut for allocation, pie charts per product, bar/line combos, plus top metrics.  
     - Quick navigation to Add Entry, Insights, Transactions, Investor and Account management.

  3. **Transactions history (`TransactionsPage.tsx`)**  
     - Search by product/person, filter by type or date range.  
     - Role gating: partners can view everything; staff remain read-only.

  4. **Add Entry (`AddEntryPage.tsx`)**  
     - For admins/partners only.  
     - Toggle between buy, sell, expense.  
     - Sell validation ensures the product has prior buys (`getAvailableProducts`).  
     - On submit we call `addTransaction` and navigate back to dashboard.

  5. **Product Insights (`ProductInsightsPage.tsx`)**  
     - Uses filtered transactions to compute per-product profit/loss, profit margins, which is most/least profitable, and displays tables of winners/losers/break-even products.

  6. **Investor Management (`AddInvestorPage.tsx`)**  
     - Admin-only.  
     - Add new investors, log investments, enforce withdrawals not exceeding net capital, view activity history.

  7. **Account Management (`NewAccountPage.tsx`)**  
     - Admin-only.  
     - Create new users, change roles, disable accounts, display permission cheat-sheet.

  ### Role permissions

  | Page | Staff | Partner | Admin |
  | --- | :---: | :---: | :---: |
  | Dashboard | ✓ | ✓ | ✓ |
  | Transactions | ✓ (view only) | ✓ (view) | ✓ |
  | Add Entry | ✗ | ✓ | ✓ |
  | Product Insights | ✓ | ✓ | ✓ |
  | Investor Management | ✗ | ✗ | ✓ |
  | Account Management | ✗ | ✗ | ✓ |

  Enforcement happens in the `AppRouter` component where we map each `AppPage` to the roles allowed to access it.

  ### Persistence flow

  ```
  on load -> safeParse(localStorage)
           -> shape data, convert dates
           -> hydrate context state

  on mutation -> update state via setState
              -> useEffect serializes to localStorage
  ```

  ## Getting started

  ```bash
  npm install
  npm run dev      # Next.js dev server (defaults to http://localhost:3000)
  npm run build    # Production build
  npm start        # Serve production build after npm run build
  ```

  ### Demo credentials

  Email: `admin@findash.com`, `partner@findash.com`, or `staff@findash.com`  
  Password: `password`

  ## Extending the project

  - **Backend integration:** Replace the mock context with API calls, keep typing aligned with backend contracts, and swap localStorage persistence for remote fetch/mutations.
  - **Auth provider:** Plug in real authentication/authorization (e.g., NextAuth) and use route groups/serverside protection rather than the in-app router.
  - **Data visualizations:** If moving to server components, consider streaming charts or caching summarized metrics per role/time period.

  The current structure deliberately keeps page implementations under `src/app/pages` while Next.js handles routing through `app/page.tsx`, making it straightforward to migrate existing components while adopting modern Next tooling.
  
