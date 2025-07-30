# Music Collab App Refactor Plan

This document outlines the plan to refactor the application to properly handle demos and their associated stems.

## The Evolved Plan: Handling Demos and Stems

This requires a slight evolution of our data model and logic. The core plan is still correct, but we need to introduce the concept of a parent-child relationship.

### 1. Evolved Data Model (in Supabase)

You'll need two tables to manage this relationship cleanly:

**Table 1: `demos`** (This is what `audiofiles` should probably be renamed to)

*   `id`: `uuid` (Primary Key, your `demoid`)
*   `name`: `text` (The original filename, e.g., "cool_song_idea.wav")
*   `master_url`: `text` (The public URL to the main demo file in Storage)
*   `created_at`: `timestamp`

**Table 2: `stems`**

*   `id`: `uuid` (Primary Key, its own unique ID)
*   `demo_id`: `uuid` (A foreign key that references `demos.id`. This is the crucial link.)
*   `name`: `text` (e.g., "drums.wav", "bass.wav")
*   `url`: `text` (The public URL to the stem file in Storage)
*   `created_at`: `timestamp`

**Why two tables?** This is a classic one-to-many relationship. One `demo` can have many `stems`. This structure is far more robust and scalable than trying to cram everything into one table.

### 2. Evolved `AudioState` (in Zustand)

Your state needs to reflect this structure. Instead of a flat list, you want an object that can hold the main file and its associated stems.

```typescript
interface Stem {
  id: string;
  name: string;
  url: string;
}

interface Demo {
  id: string; // This is the demoid
  name: string;
  master_url: string;
  stems: Stem[]; // An array of its stems
}

interface AudioState {
  demos: Demo[];
  isUploading: boolean;
  fetchDemos: () => Promise<void>;
  uploadDemo: (file: File) => Promise<void>;
  uploadStem: (file: File, parentDemoId: string) => Promise<void>; // <-- New Action
}
```

### 3. Evolved Actions

**`uploadDemo` (formerly `uploadAudio`)**

This stays mostly the same as the "Write" operation we discussed, but it now creates a record in the `demos` table.

1.  Generate unique filename, upload to Storage, get URL.
2.  Generate a new `id` (demoid).
3.  Insert a new row into the `demos` table.
4.  Add the new `Demo` object (with an empty `stems` array) to the local state.

**`uploadStem` (The New Action)**

This is the key to your question.

1.  It takes two arguments: the `file` and the `parentDemoId`.
2.  Generate unique filename, upload to Storage, get URL.
3.  Generate a new `id` for the stem itself.
4.  Insert a new row into the `stems` table. Crucially, you set the `demo_id` column to the `parentDemoId` you passed into the function.
5.  Find the corresponding demo in the local Zustand state and add the new `Stem` object to its `stems` array.

**`fetchDemos` (formerly `fetchAudioFiles`)**

This becomes slightly more complex, as it needs to fetch from both tables and combine the data.

1.  First, query the `demos` table to get all the parent demos.
2.  Then, query the `stems` table to get all the stems.
3.  Now, on the client-side, loop through the demos and for each demo, find all the stems from the second query whose `demo_id` matches the current demo's `id`.
4.  Assemble the final `Demo[]` array with the nested `stems` and set the state.

This approach correctly models the relationship, ensures each entity has a stable ID, and allows you to upload and associate stems with their parent demo cleanly.

---

## Refactor Summary (Post-Implementation)

This section summarizes the changes made to implement the plan above.

### `src/store/audioStore.ts`

*   **Data Structures:** Replaced the flat `AudioFile` interface with the new nested `Demo` and `Stem` interfaces.
*   **State:** The `audioFiles` array was replaced with a `demos` array.
*   **Actions:**
    *   `fetchAudioFiles` was replaced with `fetchDemos`, which now correctly queries the `demos` and `stems` tables from the database and combines them.
    *   `uploadAudio` was replaced with `uploadDemo`, which uploads a file and creates a corresponding record in the `demos` table.
    *   A new `uploadStem` action was added to handle uploading stem files and linking them to a parent demo via a foreign key.

### `src/components/Whiteboard.tsx`

*   **Store Integration:** Updated the component to use the new `demos` state and the `fetchDemos` and `uploadDemo` actions from the `useAudioStore`.
*   **Props:** Updated the mapping logic to pass the correct props (`id`, `master_url`, `name`, `stems`) to the `WaveformPlayer` component.
*   **Functionality:** The file input now correctly calls `uploadDemo`.

### `src/components/WaveformPlayer.tsx`

*   **Props:** The component's props were updated to accept the new `Demo` structure, including the `stems` array.
*   **Upload Logic Removed:** The responsibility for uploading stems was removed from this component.
*   **Stem Upload Trigger:** A new handler (`handleStemUpload`) was added to call the `uploadStem` action from the store, cleanly separating the UI from the business logic.
*   **Display Logic:** The component now maps over the `stems` prop to display the list of associated stems.

---

## Collaboration Feature Plan

This section outlines the future plan to add multi-user collaboration features to the application.

1.  **Phase 0: User Authentication:** Implement a login/signup system using Supabase Auth. This is the foundation that gives every user a unique identity (`auth.uid()`).
2.  **Phase 1: Database Structure:** Create three new database entities:
    *   A `projects` table to hold the name of each session.
    *   A `project_users` table to link users to the projects they are members of.
    *   Add a `project_id` column to our existing `demos` table to link each audio file to a specific project.
3.  **Phase 2: State Management:** Create a new `useProjectStore` in Zustand to manage the list of projects and track the currently active one. We would then modify `useAudioStore` to only fetch and upload demos for that active project.
4.  **Phase 3: UI Integration:** Build a `ProjectSidebar` component where users can see their projects and switch between them. The main `Whiteboard` would then react to the selection, loading the correct demos.
5.  **Phase 4: Real-time Sync:** Leverage Supabase Realtime subscriptions so that when one user uploads a demo, it instantly appears for all other users in the same project without needing a page refresh.