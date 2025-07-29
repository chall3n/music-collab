"use client";

import dynamic from "next/dynamic";
import "tldraw/tldraw.css";
import { useAudioStore } from "@/store/audioStore";
import { useRef, useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import WaveformPlayer from "./WaveformPlayer";

const Tldraw = dynamic(() => import("tldraw").then((mod) => mod.Tldraw), {
  ssr: false,
});

export default function Whiteboard() {
  // Updated to use the new store structure and function names
  const { fetchDemos, uploadDemo, demos, isUploading } = useAudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for react-rnd component
  const [rndSize, setRndSize] = useState({ width: 440, height: 400 });
  const [rndPosition, setRndPosition] = useState({ x: 0, y: 16 });

  // Set initial position on the right side of the screen
  useEffect(() => {
    // Fetch demos when the component mounts
    fetchDemos();

    const updatePosition = () => {
      setRndPosition({
        x: window.innerWidth - rndSize.width - 16,
        y: 16,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => window.removeEventListener("resize", updatePosition);
  }, [rndSize.width, fetchDemos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log(`Selected ${files.length} files for demo upload`);

    for (const file of Array.from(files)) {
      if (file.type.startsWith("audio/")) {
        try {
          // Use the new uploadDemo function
          await uploadDemo(file);
          console.log(`✅ Successfully uploaded demo: ${file.name}`);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
        }
      } else {
        console.log(`⚠️ Skipped non-audio file: ${file.name} (${file.type})`);
      }
    }
    e.target.value = "";
  };

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      {/* Hidden file input for uploading demos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      {/* Upload Button for Demos */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`px-4 py-2 rounded text-white font-medium ${
            isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isUploading ? "Uploading..." : "📁 Upload Demo"}
        </button>
      </div>

      {/* Demos List with Waveforms - Resizable and Draggable */}
      {demos.length > 0 && (
        <Rnd
          size={rndSize}
          position={rndPosition}
          onDragStop={(e, d) => setRndPosition({ x: d.x, y: d.y })}
          onResizeStop={(e, direction, ref, delta, position) => {
            setRndSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
            });
            setRndPosition(position);
          }}
          minWidth={350}
          minHeight={250}
          maxWidth={800}
          maxHeight={900}
          bounds="parent"
          dragHandleClassName="drag-handle"
          className="z-50"
        >
          <div className="bg-white p-4 rounded shadow-lg h-full flex flex-col">
            <h3 className="font-bold mb-2 truncate drag-handle cursor-move">
              {demos.length === 1
                ? demos[0].name
                : `Audio Demos (${demos.length})`}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {/* Map over demos and render a player for each */}
              {demos.map((demo) => (
                <WaveformPlayer
                  key={demo.id}
                  audioUrl={demo.master_url}
                  fileName={demo.name}
                  demoid={demo.id}
                  stems={demo.stems}
                />
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
