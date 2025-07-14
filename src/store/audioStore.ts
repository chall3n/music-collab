import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface AudioFile {
  id: string;
  filename: string;
  url: string;
  demoId?: string; // Added demoId property
}

interface AudioState {
  audioFiles: AudioFile[];
  isUploading: boolean;
  fetchAudioFiles: () => Promise<void>;
  uploadAudio: (file: File) => Promise<void>;
}

export const useAudioStore = create<AudioState>((set) => ({
  audioFiles: [],
  isUploading: false,

  fetchAudioFiles: async () => {
    try {
      const { data, error } = await supabase.storage.from("audio").list();
      if (error) throw error;

      const audioFiles = data.map((file) => ({
        id: crypto.randomUUID(),
        filename: file.name,
        url: supabase.storage.from("audio").getPublicUrl(file.name).data.publicUrl,
      }));

      set({ audioFiles });
    } catch (error) {
      console.error("Failed to fetch audio files:", error);
    }
  },

  uploadAudio: async (file: File) => {
    // temporary file size validation
    if (file.size > 100 * 1024 * 1024) {
      throw new Error("File size must be less than 100MB");
    }

    if (!file.type.startsWith("audio/")) {
      throw new Error("File must be an audio file");
    }

    try {
      set({ isUploading: true });

      const timestamp = Date.now();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${timestamp}_${cleanName}`;

      const { data, error } = await supabase.storage
        .from("audio")
        .upload(filename, file);

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from("audio")
        .getPublicUrl(filename);

      const audioFile: AudioFile = {
        id: crypto.randomUUID(),
        filename: file.name,
        url: urlData.publicUrl,
      };

      // Insert metadata into audioFiles table
      const { data: insertData, error: insertError } = await supabase
        .from("audiofiles")
        .insert({
          id: audioFile.id,
          demoid: audioFile.id, // Updated column name to match table schema
          audiourl: audioFile.url, // Updated column name to match table schema
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      set((state) => ({
        audioFiles: [...state.audioFiles, audioFile],
        isUploading: false,
      }));
    } catch (error) {
      set({ isUploading: false });
      console.error("Upload failed:", error);
      throw error;
    }
  },
}));

//ensures only one track plays at once
//added Global interface
interface GlobalAudioStore {
  currentAudio: HTMLAudioElement | null;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
}

export const useGlobalAudioStore = create<GlobalAudioStore>((set) => ({
  currentAudio: null,
  setCurrentAudio: (audio) => set({ currentAudio: audio }),
}));
