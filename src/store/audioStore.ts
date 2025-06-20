import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface AudioFile {
  id: string;
  filename: string;
  url: string;
}

interface AudioState {
  audioFiles: AudioFile[];
  isUploading: boolean;
  uploadAudio: (file: File) => Promise<void>;
}

export const useAudioStore = create<AudioState>((set) => ({
  audioFiles: [],
  isUploading: false,

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
