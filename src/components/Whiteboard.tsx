"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useAudioStore } from "@/store/audioStore";
import { useRef } from "react";

export default function Whiteboard() {
  const { uploadAudio, audioFiles, isUploading } = useAudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log(`Selected ${files.length} files`);

    for (const file of Array.from(files)) {
      if (file.type.startsWith("audio/")) {
        console.log(
          `Processing: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(
            2
          )}MB, Type: ${file.type}`
        );
        try {
          await uploadAudio(file);
          console.log(`✅ Successfully uploaded: ${file.name}`);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
        }
      } else {
        console.log(`⚠️ Skipped non-audio file: ${file.name} (${file.type})`);
      }
    }

    // Clear input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {/* Simple Upload Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => {
            console.log("Upload button clicked");
            fileInputRef.current?.click();
          }}
          disabled={isUploading}
          className={`px-4 py-2 rounded text-white font-medium ${
            isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isUploading ? "Uploading..." : "📁 Upload Audio"}
        </button>
      </div>

      {/* Audio Files List */}
      {audioFiles.length > 0 && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded shadow-lg z-50 max-w-80">
          <h3 className="font-bold mb-2">
            Uploaded Files ({audioFiles.length})
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {audioFiles.map((file) => (
              <div key={file.id} className="p-2 bg-gray-50 rounded">
                <p className="text-sm font-medium truncate">{file.filename}</p>
                <audio controls src={file.url} className="w-full mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* tldraw Canvas */}
      <Tldraw />
    </div>
  );
}
