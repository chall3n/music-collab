"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useAudioStore } from "@/store/audioStore";
import { useRef, useState, useEffect } from "react";
import { Rnd } from "react-rnd";

export default function Whiteboard() {
  const { uploadAudio, audioFiles, isUploading } = useAudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for react-rnd component
  const [rndSize, setRndSize] = useState({ width: 320, height: 300 });
  const [rndPosition, setRndPosition] = useState({ x: 0, y: 16 });

  // Set initial position on the right side of the screen
  useEffect(() => {
    const updatePosition = () => {
      setRndPosition({
        x: window.innerWidth - rndSize.width - 16, // 16px margin from right
        y: 16, // 16px margin from top
      });
    };

    // Set initial position
    updatePosition();

    // Update position on window resize
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [rndSize.width]);

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
      </div>{" "}
      {/* Audio Files List - Resizable and Draggable */}
      {audioFiles.length > 0 && (
        <Rnd
          size={rndSize}
          position={rndPosition}
          onDragStop={(e, d) => {
            setRndPosition({ x: d.x, y: d.y });
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            setRndSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
            });
            setRndPosition(position);
          }}
          minWidth={250}
          minHeight={200}
          maxWidth={600}
          maxHeight={800}
          bounds="parent"
          dragHandleClassName="drag-handle"
          className="z-50"
        >
          <div className="bg-white p-4 rounded shadow-lg h-full flex flex-col">
            <h3 className="font-bold mb-2 truncate drag-handle cursor-move">
              {audioFiles.length === 1
                ? audioFiles[0].filename
                : `Demos (${audioFiles.length})`}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {audioFiles.map((file) => (
                <div key={file.id} className="p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium truncate">
                    {file.filename}
                  </p>
                  <audio controls src={file.url} className="w-full mt-1" />
                </div>
              ))}
            </div>
          </div>
        </Rnd>
      )}
      {/* tldraw Canvas */}
      <Tldraw />
    </div>
  );
}
