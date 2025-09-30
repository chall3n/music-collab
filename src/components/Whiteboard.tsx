"use client";

import dynamic from "next/dynamic";
import "tldraw/tldraw.css";
import { useAudioStore } from "@/store/audioStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useRef, useState, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import WaveformPlayer from "./WaveformPlayer";
import { Editor, TLEditorSnapshot, loadSnapshot } from 'tldraw'; // Updated import

// Debounce utility to avoid saving on every single change
function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const TldrawDynamic = dynamic(() => import("tldraw").then((mod) => mod.Tldraw), {
  ssr: false,
});

export default function Whiteboard() {
  const { fetchDemos, uploadDemo, demos, isUploading } = useAudioStore();
  const { projects, activeProjectId } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State for Tldraw instance ---
  const [app, setApp] = useState<Editor | null>(null); // Updated type

  // Find the full active project object to get its snapshot
  const activeProject = projects.find(p => p.id === activeProjectId);

  // --- State for react-rnd component ---
  const [rndSize, setRndSize] = useState({ width: 440, height: 400 });
  const [rndPosition, setRndPosition] = useState({ x: 0, y: 16 });

  // --- Effects ---

  // Fetch demos whenever the active project changes
  useEffect(() => {
    if (activeProjectId) {
      fetchDemos();
    }
  }, [fetchDemos, activeProjectId]);

  // Calculate initial position for the demo list window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRndPosition({
        x: window.innerWidth - rndSize.width - 16,
        y: 16,
      });
    }
  }, [rndSize.width]);

  // --- Tldraw Persistence Logic ---

  const onMount = useCallback((app: Editor) => { // Updated type
    setApp(app);
  }, []);

  // Debounced function to save the snapshot to our new static API route
  const debouncedSave = useRef(debounce((snapshot: TLEditorSnapshot, projectId: string) => {
    if (!projectId) return;
    console.log(`Client-side: Triggering snapshot save for project ${projectId}`);
    fetch('/api/snapshot/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot: snapshot, projectId: projectId }),
    });
  }, 2000)).current;

  // Listen for changes in the tldraw store and save themz
  useEffect(() => {
    if (!app) return;

    const listener = () => {
      const currentProjectId = useProjectStore.getState().activeProjectId;
      if (currentProjectId) {
        const snapshot = app.getSnapshot();
        debouncedSave(snapshot, currentProjectId);
      }
    };

    const unsubscribe = app.store.listen(listener);

    return () => {
      unsubscribe();
    };
  }, [app, debouncedSave]);

  // NEW: Load snapshot when activeProject?.tldraw_snapshot changes
  useEffect(() => {
    if (app && activeProject?.tldraw_snapshot) {
      try {
        loadSnapshot(app.store, activeProject.tldraw_snapshot);
      } catch (error) {
        console.error("Failed to load tldraw snapshot:", error);
      }
    }
  }, [app, activeProject?.tldraw_snapshot]);


  // --- Handlers ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith("audio/")) {
        try {
          await uploadDemo(file);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
        }
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
      <div className="absolute mt-8 ml-72 z-50">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`px-4 py-2 rounded text-white font-medium transition-transform duration-200 ease-in-out hover:scale-105 ${
            isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "animated-background bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-500 cursor-pointer"
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
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <TldrawDynamic
          onMount={onMount}
          snapshot={activeProject?.tldraw_snapshot ? activeProject.tldraw_snapshot : undefined} // Updated snapshot prop
        />
      </div>
    </div>
  );
}
