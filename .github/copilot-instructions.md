1. Core Philosophy & Guiding Principles

  This is a collaborative music application using React, TypeScript, and Supabase. The
  goal is clean, maintainable, and type-safe code.


   - Single Source of Truth: All application state should flow from our Zustand store
     (useAudioStore.ts). Avoid local useState for data that needs to be shared or persisted.
   - Immutability: Treat state as immutable. When updating state in Zustand, always create a
      new object or array (e.g., using the spread operator ...).
   - Service Abstraction: All interactions with Supabase (database, storage, auth) MUST be
     abstracted into dedicated service functions. Components should not call
     supabase.from(...) directly.

  2. Code Style & Conventions


   - Language: TypeScript. Use strict mode.
   - Formatting: Follow the Airbnb JavaScript Style Guide 
     (https://github.com/airbnb/javascript). Use Prettier on save to enforce this
     automatically.
   - Components: Use functional components with React Hooks.
   - File Naming:
       - Components: PascalCase.tsx (e.g., AudioPlayer.tsx)
       - Hooks: useCamelCase.ts (e.g., useAudioPlayer.ts)
       - Services/Types: camelCase.ts (e.g., supabaseService.ts, audioTypes.ts)


  3. Key Patterns & Architecture

  State Management (Zustand)

  All global state is managed in useAudioStore.ts.


   - DO: Define state and actions together in the store.
   - DON'T: Put Supabase client logic directly in the store's actions. Call a service
     function instead.

  Example Store Structure (`useAudioStore.ts`):


    1 import { create } from 'zustand';
    2 import { fetchAllAudio, uploadStems } from './supabaseService'; // Import 
      services
    3 import { AudioFile } from './audioTypes';
    4 
    5 interface AudioState {
    6   audioFiles: AudioFile[];
    7   isLoading: boolean;
    8   error: string | null;
    9   loadAudioFiles: () => Promise<void>;
   10   uploadStems: (demoid: string, files: FileList) => Promise<void>;
   11 }
   12 
   13 export const useAudioStore = create<AudioState>((set) => ({
   14   audioFiles: [],
   15   isLoading: false,
   16   error: null,
   17   loadAudioFiles: async () => {
   18     set({ isLoading: true, error: null });
   19     try {
   20       const files = await fetchAllAudio();
   21       set({ audioFiles: files, isLoading: false });
   22     } catch (err) {
   23       set({ error: 'Failed to fetch audio files.', isLoading: false });
   24     }
   25   },
   26   uploadStems: async (demoid, files) => {
   27     // Logic here will call the abstracted uploadStems service
   28   },
   29 }));


  Supabase Service Layer

  All Supabase logic lives in supabaseService.ts. This is our "API" for the database.


   - DO: Create small, focused functions for each database operation (e.g., fetchDemoById,
     updateStemsForDemo).
   - DO: Handle data transformation here. Components should receive data in the exact shape
     they need.
   - DO: Throw errors with a consistent format.

  Example Service Function (`supabaseService.ts`):


    1 import { supabase } from './supabaseClient'; // Your configured Supabase 
      client
    2 import { StemMetadata } from './audioTypes';
    3 
    4 // GOOD: Specific, handles data transformation, throws a clear error.
    5 export const updateStemsForDemo = async (demoid: string, stems: StemMetadata
      []): Promise<void> => {
    6   const { error } = await supabase
    7     .from('audiofiles')
    8     .update({ stems }) // `stems` is already in the correct format
    9     .eq('demoid', demoid);
   10 
   11   if (error) {
   12     console.error('Supabase Error:', error.message);
   13     throw new Error(`Failed to update stems for demo ${demoid}.`);
   14   }
   15 };
   16 
   17 // BAD: Vague, doesn't handle errors well, logic is too complex.
   18 const handleUploadStems = async (demoid, files) => { /* ... long complex 
      logic ... */ };



  Component Logic

  Components should be "dumb." Their job is to display state and report user events.


   - DO: Get all data and action functions from the useAudioStore hook.
   - DON'T: Have useEffect blocks that fetch data directly. Call an action from the store
     instead.

  Example Component (`DemoPage.tsx`):


    1 import { useAudioStore } from './stores/useAudioStore';
    2 import { useEffect } from 'react';
    3 
    4 const DemoPage = ({ demoid }) => {
    5   // GOOD: Selects only the state and actions it needs.
    6   const { audioFiles, isLoading, error, loadAudioFiles } = useAudioStore(
      state => ({
    7     audioFiles: state.audioFiles,
    8     isLoading: state.isLoading,
    9     error: state.error,
   10     loadAudioFiles: state.loadAudioFiles,
   11   }));
   12 
   13   // GOOD: Effect calls a store action, not Supabase directly.
   14   useEffect(() => {
   15     loadAudioFiles();
   16   }, [loadAudioFiles]);
   17 
   18   if (isLoading) return <div>Loading...</div>;
   19   if (error) return <div>Error: {error}</div>;
   20 
   21   // ... render audioFiles
   22 };


  4. Critical Project-Specific Rules


   - `demoid` is King: The demoid is the primary key for a track and its stems. It MUST be
     generated using crypto.randomUUID() only once when a new track is first created in the
     audiofiles table. It is then passed as a prop or URL parameter everywhere else.
   - Logging: Use a structured logging format. Prefix logs with [ServiceContext] (e.g.,
     [SupabaseService], [AudioPlayer]) to easily trace operations.
   - Error Handling: Always wrap Supabase calls in a try/catch block within the service
     functions. Log the detailed error in the service, but throw a simpler, user-friendly
     error for the store to catch.