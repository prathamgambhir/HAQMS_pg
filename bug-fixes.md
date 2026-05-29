# HAQMS Bug Fixes Documentation

## 1) Issues Identified

### Security
- [x] Issue: JWT validation accepted expired tokens and used a fallback hardcoded secret.
  - Location: `backend/src/middleware/auth.js`
  - Severity: Critical
  - Risk: Any leaked old token could still be used to access protected APIs; hardcoded fallback secret increases chance of token forgery.
  - Repro steps:
    1. Login and get a JWT.
    2. Manually create/modify token with expired `exp` claim.
    3. Call any protected API with old token and see it pass because `ignoreExpiration` was enabled.

- [x] Issue: Admin-only middleware allowed non-admin users to perform destructive actions.
  - Location: `backend/src/middleware/auth.js` and `backend/src/routes/patients.js`
  - Severity: Critical
  - Risk: Receptionist/doctor users could delete patient records.
  - Repro steps:
    1. Login as receptionist.
    2. Call `DELETE /api/patients/:id`.
    3. Request succeeds because role check was commented out.

- [x] Issue: Doctor search endpoint was vulnerable to SQL Injection.
  - Location: `backend/src/routes/doctors.js`
  - Severity: Critical
  - Risk: Attackers could alter query behavior and potentially exfiltrate data.
  - Repro steps:
    1. Hit `/api/doctors?search=House%' UNION SELECT ... --`
    2. Raw string interpolation runs in `$queryRawUnsafe`.

- [x] Issue: Sensitive credentials and internals leaked through logs/API responses.
  - Location: `backend/src/routes/auth.js` (login/register), multiple routes for error details
  - Severity: High
  - Risk: Plain-text password logging and stack/detail leaks expose secrets and internal implementation.
  - Repro steps:
    1. Trigger login/register and inspect server logs for password visibility.
    2. Trigger API failure and observe verbose details in response.

### Backend Performance / Concurrency
- [x] Issue: Queue token generation had read-then-create race window and artificial delay.
  - Location: `backend/src/routes/queue.js`
  - Symptom: Duplicate token numbers under concurrent check-ins.
  - Root cause: `aggregate(max)` + `setTimeout` + separate insert without transaction lock.
  - Measurement (before): Observed architecture-level race risk from non-atomic flow (no lock/transaction on token assignment).

- [x] Issue: Appointment listing endpoint had N+1 queries.
  - Location: `backend/src/routes/appointments.js`
  - Symptom: API latency grows fast with number of appointments.
  - Root cause: Separate patient/doctor query per appointment in loop.
  - Measurement (before): 1 appointment list query + 2 extra queries per appointment row.

- [x] Issue: Doctor stats and report endpoints ran independent DB operations sequentially.
  - Location: `backend/src/routes/doctors.js`, `backend/src/routes/reports.js`
  - Symptom: Longer-than-needed response times and poor scalability.
  - Root cause: Sequential `await` pattern and nested loops with extra artificial delays.
  - Measurement (before): Multiple sequential aggregate calls and loop-level sleeps in report generation path.

- [x] Issue: Patient directory endpoint was doing in-memory filtering and pagination.
  - Location: `backend/src/routes/patients.js`
  - Symptom: More memory and CPU use on API server as patient data grows.
  - Root cause: Loaded full result set first, then filtered and sliced in Node process.
  - Measurement (before): Full patient list fetched before every filtered/paginated response.

### Database / Schema
- [ ] Issue: Missing unique and index constraints.
  - Table/model: `Appointment`, `QueueToken`, `Doctor`
  - Impact: Duplicate slot booking possible; slower query patterns at scale.
  - Proposed constraint/index:
    - Add unique slot constraint for appointment booking strategy.
    - Add queue token uniqueness strategy by doctor/day.
    - Add indexes for frequent doctor/status/date filters.

### Frontend
- [x] Issue: Queue page polling memory leak.
  - Location: `frontend/src/app/queue/page.js`
  - User impact: Repeated navigation increases background timers and API load.
  - Repro steps: Navigate between dashboard and queue repeatedly, observe rising poll requests.

- [x] Issue: Doctor dashboard crashes when patient has null medical history.
  - Location: `frontend/src/app/dashboard/page.js`
  - User impact: Entire section crashes for valid records with missing history.
  - Repro steps: Open patient modal where `medicalHistory` is `null`.

### Incomplete Features
- [x] Missing feature: Legacy history page route implementation.
  - Location: `frontend/src/app/patients/[id]/history-records/page.js`
  - Expected behavior: Render patient history details instead of 404 page.

---

## 2) Fixes Implemented

- [x] Fix: Enforced strict JWT verification and removed fallback secret behavior.
  - Related issue: Expired token acceptance and weak secret handling.
  - Files changed: `backend/src/middleware/auth.js`, `backend/src/routes/auth.js`
  - Approach:
    - Removed hardcoded JWT secret fallback.
    - Added config guard when JWT secret is missing.
    - Removed `ignoreExpiration: true`.
    - Reduced token validity to `1d` from `365d`.
  - Why this approach:
    - Small and clear changes that improve security without introducing advanced auth complexity.
    - Easy for junior-level maintenance and review.
  - Risks/tradeoffs:
    - Existing long-lived tokens become invalid sooner.
    - Environment must provide `JWT_SECRET` in all environments.

- [x] Fix: Restored actual admin role enforcement in legacy admin middleware.
  - Related issue: Broken authorization on patient deletion.
  - Files changed: `backend/src/middleware/auth.js`
  - Approach:
    - Added explicit `req.user.role !== 'ADMIN'` check returning `403`.
  - Why this approach:
    - Minimal, targeted fix with no route contract changes.
  - Risks/tradeoffs:
    - Any workflow relying on insecure delete behavior will stop working (expected secure behavior).

- [x] Fix: Replaced raw SQL interpolation with Prisma-safe filtering.
  - Related issue: SQL injection vulnerability in doctor search.
  - Files changed: `backend/src/routes/doctors.js`
  - Approach:
    - Switched from `$queryRawUnsafe` to `prisma.doctor.findMany({ where })`.
    - Kept current API response shape (array) to avoid frontend breakage.
  - Why this approach:
    - Prisma query builder is safer and easier to maintain than handcrafted SQL strings.
  - Risks/tradeoffs:
    - Less flexibility for complex dynamic SQL (acceptable for current endpoint scope).

- [x] Fix: Removed sensitive auth logging and reduced response detail leakage.
  - Related issue: Passwords and internals exposed via logs/API.
  - Files changed: `backend/src/routes/auth.js`, `backend/src/middleware/auth.js`
  - Approach:
    - Replaced plain-text password logs with email-only logs.
    - Ensured register endpoint does not return password hash by selecting safe fields only.
    - Replaced verbose error details with generic safe messages in auth flows.
  - Why this approach:
    - Preserves useful debugging while reducing security exposure.
  - Risks/tradeoffs:
    - Debugging some production issues may require server-side logging improvements later.

- [x] Fix: Added basic input hardening for auth and patient creation APIs.
  - Related issue: Weak payload validation and account/record quality risk.
  - Files changed: `backend/src/routes/auth.js`, `backend/src/routes/patients.js`
  - Approach:
    - Added email format and password length validation in registration.
    - Normalized emails to lowercase/trimmed values for lookup consistency.
    - Restricted open registration role assignment to receptionist path.
    - Added age range and phone format checks for patient creation.
  - Why this approach:
    - Simple validation rules reduce bad data and privilege abuse without introducing extra libraries yet.
  - Risks/tradeoffs:
    - Some legacy/test payloads may now fail until adjusted to valid format.

- [x] Fix: Mitigated queue check-in race condition using transaction and retry strategy.
  - Related issue: Duplicate token assignment under concurrent requests.
  - Files changed: `backend/src/routes/queue.js`
  - Approach:
    - Removed artificial delay.
    - Wrapped max-token read + token create in one serializable transaction.
    - Added small retry loop for transaction conflicts.
  - Why this approach:
    - Keeps implementation understandable while significantly reducing duplicate allocation chance.
  - Risks/tradeoffs:
    - Without final DB-level unique constraint, absolute safety still depends on upcoming schema changes.

- [x] Fix: Removed N+1 pattern in appointment list endpoint.
  - Related issue: Slow appointments endpoint under load.
  - Files changed: `backend/src/routes/appointments.js`
  - Approach:
    - Replaced looped per-record patient/doctor lookups with one Prisma `findMany` + `include`.
    - Kept selected nested fields lean for predictable payload size.
  - Why this approach:
    - Straightforward ORM-native optimization with clear readability.
  - Risks/tradeoffs:
    - Slightly larger per-row payload than base appointment-only response (accepted due to existing frontend needs).

- [x] Fix: Optimized doctor statistics and reporting query flow.
  - Related issue: Sequential aggregate bottlenecks and artificial report delay.
  - Files changed: `backend/src/routes/doctors.js`, `backend/src/routes/reports.js`
  - Approach:
    - Used `Promise.all` for independent doctor stats queries.
    - Replaced per-doctor repeated counts with grouped aggregates mapped in memory once.
    - Removed artificial report delay.
  - Why this approach:
    - Improves latency while keeping code simple enough for junior-level maintenance.
  - Risks/tradeoffs:
    - Grouped aggregation logic adds mapping code that requires careful review during future schema changes.

- [x] Fix: Shifted patient listing to DB-level filtering and pagination.
  - Related issue: In-memory pagination/filtering inefficiency.
  - Files changed: `backend/src/routes/patients.js`
  - Approach:
    - Built Prisma `where` object for search/gender.
    - Used transaction with `count + findMany(skip/take)` for pagination metadata and rows.
    - Added basic pagination bounds.
  - Why this approach:
    - Scales better and preserves current API response shape.
  - Risks/tradeoffs:
    - Existing edge-case behavior for invalid page/limit params is now normalized instead of silently accepted.

- [x] Fix: Hardened global error response behavior for production safety.
  - Related issue: Internal error leakage from global handler.
  - Files changed: `backend/src/index.js`
  - Approach:
    - Returned generic error payload by default.
    - Exposed stack/details only in development mode.
  - Why this approach:
    - Keeps debugging convenience in local/dev while reducing production leakage.
  - Risks/tradeoffs:
    - Production troubleshooting now relies more on server logs.

---

## 3) Optimizations Performed

- [x] Optimization: Simplified doctor listing query execution path.
  - Area (DB/API/Frontend): API + DB
  - Baseline: Raw query string assembly with unsafe interpolation.
  - Change: Converted to structured Prisma filtering + ordering.
  - Result (after): Safer query execution and cleaner maintainability. Performance benchmark pending.

- [x] Optimization: Reduced appointment endpoint query count.
  - Area (DB/API/Frontend): API + DB
  - Baseline: 1 base query + 2 additional queries per appointment row.
  - Change: Single Prisma query with nested relation includes.
  - Result (after): Constant query count for list retrieval and lower latency growth as records increase.

- [x] Optimization: Parallelized doctor stats endpoint and reworked report aggregation.
  - Area (DB/API/Frontend): API + DB
  - Baseline: Sequential aggregation requests and loop-level delays.
  - Change: Promise-based parallel execution + grouped counts + delay removal.
  - Result (after): Reduced report and stats response time under typical workloads.

- [x] Optimization: Moved patient filtering/pagination into database.
  - Area (DB/API/Frontend): API + DB
  - Baseline: Full dataset load then in-memory filtering and slicing.
  - Change: `where`, `skip`, `take`, and `count` at query level.
  - Result (after): Better scalability and lower app server memory usage for patient listing.

- [x] Optimization: Removed artificial queue check-in delay.
  - Area (DB/API/Frontend): API
  - Baseline: Forced 350ms wait per check-in request.
  - Change: Eliminated sleep and switched to transactional write flow.
  - Result (after): Faster check-ins and narrower concurrency risk window.

---

## 4) Remaining Known Issues

- [ ] Issue: Database-level uniqueness constraints for appointment slots and daily queue token allocation are still missing.
  - Reason not fixed now: Requires Prisma schema update + migration + data compatibility review.
  - Suggested next step: Add required constraints/indexes in schema and test migration on seeded data.

- [ ] Issue: Some endpoints still return `details` in error responses.
  - Reason not fixed now: Focused first on critical and high-traffic backend routes.
  - Suggested next step: Standardize all route error responses through common helper.

- [ ] Issue: Appointments status update endpoint accepts any status string from request body.
  - Reason not fixed now: Out of current batch scope.
  - Suggested next step: Add enum validation before update.

---

## 5) Approach and Major Decisions

- Prioritization logic:
  - First pass focuses on critical backend security issues that can cause unauthorized access or data compromise.
  - High-impact but low-risk fixes were chosen first so the app remains functional while becoming safer.

- Security decisions:
  - Enforced strict token validation and proper role checks before any destructive action.
  - Reduced sensitive information in logs and API responses to avoid accidental leakage.
  - Replaced dangerous raw SQL interpolation with ORM-level filtering.

- Performance decisions:
  - First pass started with security blockers, then moved to high-impact API query improvements.
  - Chosen optimizations were ORM-native (`include`, `groupBy`, `Promise.all`, DB pagination) to keep code readable and maintainable.

- Tradeoffs accepted:
  - Chose straightforward guard clauses and explicit checks over abstract helper layers to keep code junior-friendly.
  - Kept existing route response shape where possible to avoid frontend regressions during early backend hardening.

- What I would do with more time:
  - Add central error handler utility for standardized safe error responses.
  - Add request validation middleware (Joi/Zod) for all route payloads and query params.
  - Add route-level integration tests for authz boundaries, SQL injection regression checks, and concurrency checks.
  - Add schema constraints and indexing migration with benchmark snapshots before/after.

---

## Frontend Bug Fixes

### 1) Queue Page Polling Memory Leak
- **Issues Identified**: 
  The `setInterval` polling hook in `frontend/src/app/queue/page.js` was initialized on mount but lacked a cleanup callback. Repeatedly navigating back and forth between the Dashboard and the Queue page spawned new background intervals without disposing of old ones. This accumulated background network requests (polling the `/api/queue` endpoint every 3 seconds), bloated client browser memory, caused React state updates on unmounted components, and placed unnecessary concurrent load on the backend database. Additionally, a stale closure on the `refreshCount` state variable caused the terminal logging output of the poll count to print outdated counts.
- **Fixes Implemented**: 
  Returned a cleanup function from the `useEffect` hook (`return () => clearInterval(intervalId);`) to clear the active timer whenever the component is unmounted. Rewrote the state updater to use a functional updater pattern: `setRefreshCount((prev) => { ... })` and logged the computed `nextCount` value, resolving the stale closure issue.
- **Optimizations Performed**: 
  By cleaning up the timers, we eliminated zombie network requests, ensuring only a single polling query runs when the page is active.
- **Remaining Known Issues**: 
  None for this polling routine.
- **Approach and Reasoning**: 
  A standard cleanup function is the most reliable, canonical React way to manage resources and asynchronous intervals. Using functional state updates inside the interval avoids hook dependency churn.

### 2) Doctor Dashboard Null Medical History Crash
- **Issues Identified**: 
  In `frontend/src/app/dashboard/page.js`, when a user clicked a patient to open their clinical detail modal, the application tried to call `.toUpperCase()` on `selectedPatientHistory.medicalHistory`. Since `medicalHistory` is defined as a nullable string field in the Prisma database schema, patients registered without historical background records have a value of `null`. Invoking string helper methods on a null reference crashed the entire React execution context, blanking the application.
- **Fixes Implemented**: 
  Added a defensive conditional check to ensure `.toUpperCase()` is only executed on truthy string values, adding a fallback string when the history is null: `{selectedPatientHistory.medicalHistory ? selectedPatientHistory.medicalHistory.toUpperCase() : 'NO MEDICAL HISTORY RECORDED'}`.
- **Optimizations Performed**: 
  Prevented unexpected front-end crashes on valid records with missing history.
- **Remaining Known Issues**: 
  None.
- **Approach and Reasoning**: 
  This approach prevents front-end crashes by handling optional or missing fields gracefully, which is a key stability pattern.

### 3) Missing Link Component Import
- **Issues Identified**: 
  In the doctor dashboard modal, the Next.js `<Link>` component was used to navigate to legacy history records, but `Link` was never imported at the top of `dashboard/page.js`, which threw a ReferenceError during runtime compilation when the modal opened.
- **Fixes Implemented**: 
  Added `import Link from 'next/link';` to the import list at the top of `frontend/src/app/dashboard/page.js`.
- **Optimizations Performed**: 
  Resolved compiler reference error.
- **Remaining Known Issues**: 
  None.
- **Approach and Reasoning**: 
  Ensured all used components are explicitly and correctly imported at the file level.

### 4) Missing Legacy History Records Route
- **Issues Identified**: 
  The dynamic route `/patients/[id]/history-records` referenced by the dashboard modal was missing, resulting in a 404 page when clinicians clicked "View Diagnostic Reports Details (Legacy App)".
- **Fixes Implemented**: 
  Created a new React Client Page at `frontend/src/app/patients/[id]/history-records/page.js`. Implemented loading states, auth guards, API data retrieval via `GET /api/patients/:id`, and mapped visit logs inside a clean visual design.
- **Optimizations Performed**: 
  Pre-loaded authenticated contexts and handled nullable anamnesis fields gracefully to ensure dynamic content loads without crash potential.
- **Remaining Known Issues**: 
  None.
- **Approach and Reasoning**: 
  Implemented standard App Router dynamic route parameters (`useParams`) to cleanly query patient database contexts.

### 5) Client-Side Form Inconsistencies & Validation Hardening
- **Issues Identified**: 
  The receptionist's patient registration form in `dashboard/page.js` had no client-side checking on telephone structure or age limits, allowing users to submit alphabetical values or negative/excessive ages (e.g. -5, 500) to the backend. While backend validation exists, sending malformed payloads is inefficient. In `login/page.js`, there was also no check on password lengths, allowing users to attempt logins with short or empty strings.
- **Fixes Implemented**: 
  - Added regex checks matching backend constraints `/^[0-9+\-\s()]{7,20}$/` on telephone inputs.
  - Implemented boundary checks (between 1 and 120) for patient age fields.
  - Added client-side password length checks (minimum 8 characters) on the login form to align with registration criteria.
- **Optimizations Performed**: 
  Saves backend cycles and database traffic by catching formatting issues early on the client.
- **Remaining Known Issues**: 
  None.
- **Approach and Reasoning**: 
  Simple, clear conditional checks with descriptive validation messages provide the best user experience.

### 6) Monochrome Theme & Restyling
- **Issues Identified**: 
  The visual appearance of the application used high-saturation teal and emerald accents, which clashed with the user's requirement for a professional black-and-white theme.
- **Fixes Implemented**: 
  - Restructured global CSS variables in `globals.css` to map background, foreground, primary, secondary, and accent states to neutral colors (`neutral-50` through `neutral-950`).
  - Swapped out all Tailwind teal/emerald classes with neutral monochrome equivalents (e.g., `text-teal-600` to `text-neutral-800` or `text-neutral-900`, `bg-teal-600` to `bg-neutral-900`).
  - Styled all page views (home, login, queue, dashboard, and the new history records page) in a sleek dark/light mode monochrome format.
- **Optimizations Performed**: 
  Unified styling variables to make theme management simpler and more coherent.
- **Remaining Known Issues**: 
  None.
- **Approach and Reasoning**: 
  Maintained high contrast and premium typography while respecting a strictly minimalist black-and-white visual palette.