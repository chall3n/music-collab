### Tldraw Snapshot Persistence Functionality (Next.js 15.5.0)

**Goal:** Implement real-time Tldraw editor snapshot saving and loading to/from Supabase, project-associated.

**Key Changes & Components:**

*   **`Whiteboard.tsx` (Client):**
    *   Updated `tldraw` imports (`Editor`, `TLEditorSnapshot`, `loadSnapshot`).
    *   Correctly typed `app` state and `onMount` callback with `Editor`.
    *   `debouncedSave` now sends `TLEditorSnapshot` via `PATCH` to `/api/snapshot/update` for real-time saving.
    *   New `useEffect` explicitly calls `loadSnapshot` when `activeProject?.tldraw_snapshot` changes, ensuring canvas updates.
    *   `TldrawDynamic`'s `snapshot` prop now handles `null`/`undefined` correctly.
    *   `debounce` utility function refined for better type safety.
*   **`useProjectStore.ts` (Zustand Store):**
    *   Imported `TLEditorSnapshot`.
    *   `Project` interface updated with `tldraw_snapshot: TLEditorSnapshot | null;`.
    *   `createProject`'s runtime type check now validates `newProject.tldraw_snapshot`, resolving column count mismatches.
*   **`src/app/api/snapshot/update/route.ts` (Backend API):**
    *   Handles `PATCH` requests to update `tldraw_snapshot` in Supabase `projects` table. Confirmed functional.
*   **Supabase Database:**
    *   `projects` table gained a `jsonb` `tldraw_snapshot` column.
    *   `create_new_project` RPC function (implicitly) returns this new column.

**Potential Issues:**

*   **`useCallback` Warning:** Persistent warning for `debouncedSave` in `Whiteboard.tsx` (non-critical).
*   **`debounce` `any` types:** `debounce` function still uses `any` in its generic constraint (can be addressed with ESLint disable or more complex typing).
*   **`create_new_project` RPC:** Assumed to return `tldraw_snapshot`; direct SQL verification needed if project creation issues persist.

*   Things need to work before giving demo to Fatima
    - creating new project and adding someone via email to it
    - Tldraw persistance across projects (right now if you switch between projects it doesn't save)
    - row level security (not super important)
    - linting/deployment issues, need to have functioning version deployed to Vercel