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
    console.log("=== Starting upload process ===");
    console.log("File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    if (file.size > 104857600) {
      const error = new Error(
        `File size (${(file.size / (1024 * 1024)).toFixed(
          2
        )}MB) exceeds limit of 100MB`
      );
      console.error("File size error:", error.message);
      throw error;
    }

    try {
      set({ isUploading: true });

      // Create a clean filename
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

      console.log("Generated filename:", filename);
      console.log("Bucket name: audio");

      // Test Supabase connection first
      console.log("Testing Supabase connection...");
      const { data: buckets, error: bucketsError } =
        await supabase.storage.listBuckets();

      if (bucketsError) {
        console.error("Failed to connect to Supabase:", bucketsError);
        throw new Error(`Supabase connection error: ${bucketsError.message}`);
      }

      console.log("Raw buckets response:", buckets);
      console.log("Number of buckets found:", buckets?.length || 0);
      console.log(
        "Available buckets:",
        buckets?.map((b) => ({ name: b.name, id: b.id, public: b.public }))
      );

      // Check if audio bucket exists
      const audioBucket = buckets?.find((b) => b.name === "audio");
      if (!audioBucket) {
        console.error(
          "Audio bucket not found. Available buckets:",
          buckets?.map((b) => b.name)
        );
        throw new Error("Audio bucket not found");
      }

      console.log("Audio bucket found:", audioBucket);

      // Attempt the upload
      console.log("Starting file upload...");
      const { data, error } = await supabase.storage
        .from("audio")
        .upload(filename, file, {
          cacheControl: "3600",
          upsert: false,
        });

      console.log("Upload response:", { data, error });

      if (error) {
        console.error("Supabase upload error details:", {
          message: error.message,
          error: error,
        });
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log("Upload successful, getting public URL...");

      const { data: urlData } = supabase.storage
        .from("audio")
        .getPublicUrl(filename);

      console.log("Public URL data:", urlData);

      const newFile = {
        id: filename,
        filename: file.name,
        url: urlData.publicUrl,
      };

      console.log("Adding file to store:", newFile);

      set((state) => ({
        audioFiles: [...state.audioFiles, newFile],
      }));

      console.log("=== Upload completed successfully ===");
    } catch (error) {
      console.error("=== Upload failed ===");
      console.error("Error type:", typeof error);
      console.error("Error details:", error);

      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      throw error;
    } finally {
      set({ isUploading: false });
    }
  },
}));
