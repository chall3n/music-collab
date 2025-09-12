"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { useGlobalAudioStore, useAudioStore } from "../store/audioStore";

// Updated to reflect the new data model from the store
interface Stem {
  id: string;
  name: string;
  url: string;
}

interface WaveformPlayerProps {
  audioUrl: string;
  fileName: string;
  demoid: string;
  stems: Stem[]; // Stems are now passed in as a prop
}

// Helper function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioUrl,
  fileName,
  demoid,
  stems,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { currentAudio, setCurrentAudio } = useGlobalAudioStore();
  const { uploadStem } = useAudioStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      // These options make the waveform look more like SoundCloud's
      waveColor: "#A8A8A8",
      progressColor: "#7C3AED",
      barWidth: 1,
      barGap: 3,
      barRadius: 4,
      height: 64, // Corresponds to h-16
      url: audioUrl,
      // Make the cursor invisible, as we are not using it
      cursorWidth: 0,
    });

    wavesurferRef.current = ws;

    ws.on("ready", () => {
      setDuration(ws.getDuration());
      setIsLoading(false);
    });

    ws.on("audioprocess", () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on("play", () => {
      setIsPlaying(true);
      // Set this instance as the globally playing one
      setCurrentAudio(ws);
    });

    ws.on("pause", () => {
      setIsPlaying(false);
    });

    ws.on("finish", () => {
      setIsPlaying(false);
    });

    // Cleanup
    return () => {
      ws.destroy();
    };
  }, [audioUrl, setCurrentAudio]);

  const togglePlayPause = useCallback(() => {
    if (isLoading || !wavesurferRef.current) return;

    // If another audio is playing, pause it
    if (currentAudio && currentAudio !== wavesurferRef.current) {
      currentAudio.pause();
    }

    wavesurferRef.current.playPause();
  }, [isLoading, currentAudio, setCurrentAudio]);

  const handleStemUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        await uploadStem(file, demoid);
        console.log(`✅ Successfully uploaded stem: ${file.name}`);
      } catch (error) {
        console.error(`❌ Failed to upload stem ${file.name}:`, error);
      }
    }
  };

  return (
    <div className={`p-3 bg-white rounded-lg border border-gray-200 shadow-sm ${isPlaying ? "glowing-border" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
          {fileName}
        </h4>
        <span className="text-xs text-gray-500 whitespace-nowrap font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="mb-3 relative">
        {/* This div is where the waveform will be rendered */}
        <div ref={containerRef} className="w-full h-16" />
        {isLoading && (
          <div className="absolute inset-0 h-16 bg-gray-100 rounded-md animate-pulse flex items-center justify-center">
            <span className="text-xs text-gray-500">Loading waveform...</span>
          </div>
        )}
      </div>

      {/* We no longer need the <audio> element, Wavesurfer handles it */}

      <div className="flex items-center justify-center">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="flex items-center justify-center w-12 h-12 bg-transparent text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors focus:outline-none cursor-pointer"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>
      </div>

      {/* Simplified Upload Stems Button */}
      <div className="mt-4">
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleStemUpload(e.target.files)}
          style={{ display: "none" }}
          id={`upload-stems-${demoid}`}
        />
        <button
          onClick={() => document.getElementById(`upload-stems-${demoid}`)?.click()}
          className="mt-2 w-full text-white px-4 py-2 rounded-xl text-sm animated-background bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-500 transition-transform duration-200 ease-in-out"
        >
          Upload Stems
        </button>
      </div>

      {/* Display Stems (passed in via props) */}
      {stems && stems.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Stems:</h4>
          <ul className="list-disc list-inside space-y-1">
            {stems.map((stem) => (
              <li key={stem.id} className="text-sm text-gray-700">
                {stem.name} -{" "}
                <a
                  href={`/api/download?fileUrl=${encodeURIComponent(stem.url)}`}
                  className="text-blue-500 hover:underline"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WaveformPlayer;