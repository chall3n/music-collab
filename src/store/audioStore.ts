import { create } from "zustand";
import { supabase } from "@/lib/supabase";

// --- DATA STRUCTURES ---
interface Stem {
  id: string;
  name: string;
  url: string;
}

interface Demo {
  id: string; // This is the demoid
  name: string;
  master_url: string;
  stems: Stem[];
}

// --- ZUSTAND STATE ---
interface AudioState {
  demos: Demo[];
  isUploading: boolean;
  fetchDemos: () => Promise<void>;
  uploadDemo: (file: File) => Promise<void>;
  uploadStem: (file: File, parentDemoId: string) => Promise<void>;
}

export const useAudioStore = create<AudioState>((set) => ({
  demos: [],
  isUploading: false,

  // --- ACTIONS ---

  /**
   * Fetches all demos and their associated stems from the database.
   */
  fetchDemos: async () => {
    try {
      // 1. Fetch all demos from the 'demos' table
      const { data: demosData, error: demosError } = await supabase
        .from("demos")
        .select("*");
      if (demosError) throw demosError;

      // 2. Fetch all stems from the 'stems' table
      const { data: stemsData, error: stemsError } = await supabase
        .from("stems")
        .select("*");
      if (stemsError) throw stemsError;

      // 3. Combine the data on the client-side
      const demosWithStems = demosData.map((demo) => ({
        id: demo.id,
        name: demo.name,
        master_url: demo.master_url,
        stems: stemsData.filter((stem) => stem.demo_id === demo.id),
      }));

      set({ demos: demosWithStems });
    } catch (error) {
      console.error("Failed to fetch demos and stems:", error);
    }
  },

  /**
   * Uploads a new primary demo file.
   */
  uploadDemo: async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      throw new Error("File size must be less than 100MB");
    }
    if (!file.type.startsWith("audio/")) {
      throw new Error("File must be an audio file");
    }

    try {
      set({ isUploading: true });

      const demoId = crypto.randomUUID();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${demoId}/${cleanName}`;

      // 1. Upload the master audio file to storage
      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(filename, file);
      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: urlData } = supabase.storage
        .from("audio")
        .getPublicUrl(filename);

      const newDemo: Demo = {
        id: demoId,
        name: file.name,
        master_url: urlData.publicUrl,
        stems: [],
      };

      // 3. Insert metadata into the 'demos' table
      const { error: insertError } = await supabase.from("demos").insert({
        id: newDemo.id,
        name: newDemo.name,
        master_url: newDemo.master_url,
      });
      if (insertError) throw insertError;

      // 4. Update the local state
      set((state) => ({
        demos: [...state.demos, newDemo],
        isUploading: false,
      }));
    } catch (error) {
      set({ isUploading: false });
      console.error("Demo upload failed:", error);
      throw error;
    }
  },

  /**
   * Uploads a stem file and associates it with a parent demo.
   */
  uploadStem: async (file: File, parentDemoId: string) => {
    if (!parentDemoId) {
      throw new Error("A parent demo ID is required to upload a stem.");
    }

    try {
      set({ isUploading: true });

      const stemId = crypto.randomUUID();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      // Store stems in a subfolder named after the parent demo's ID
      const filename = `${parentDemoId}/stems/${cleanName}`;

      // 1. Upload the stem file to storage
      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(filename, file);
      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: urlData } = supabase.storage
        .from("audio")
        .getPublicUrl(filename);

      const newStem: Stem = {
        id: stemId,
        name: file.name,
        url: urlData.publicUrl,
      };

      // 3. Insert metadata into the 'stems' table
      const { error: insertError } = await supabase.from("stems").insert({
        id: newStem.id,
        demo_id: parentDemoId,
        name: newStem.name,
        url: newStem.url,
      });
      if (insertError) throw insertError;

      // 4. Update the local state
      set((state) => ({
        demos: state.demos.map((demo) =>
          demo.id === parentDemoId
            ? { ...demo, stems: [...demo.stems, newStem] }
            : demo
        ),
        isUploading: false,
      }));
    } catch (error) {
      set({ isUploading: false });
      console.error("Stem upload failed:", error);
      throw error;
    }
  },
}));

// --- GLOBAL AUDIO PLAYER STATE ---
// Ensures only one track plays at once.
interface GlobalAudioStore {
  currentAudio: HTMLAudioElement | null;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
}

export const useGlobalAudioStore = create<GlobalAudioStore>((set) => ({
  currentAudio: null,
  setCurrentAudio: (audio) => set({ currentAudio: audio }),
}));
