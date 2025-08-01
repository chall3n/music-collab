"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
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

const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioUrl,
  fileName,
  demoid,
  stems,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [audioData, setAudioData] = useState<number[]>([]);

  const { currentAudio, setCurrentAudio } = useGlobalAudioStore();
  const { uploadStem } = useAudioStore(); // Get the uploadStem function

  // Generate fake waveform data for visualization
  useEffect(() => {
    const generateWaveform = () => {
      const data: number[] = [];
      for (let i = 0; i < 100; i++) {
        data.push(Math.random() * 0.8 + 0.1);
      }
      setAudioData(data);
    };
    generateWaveform();
  }, []);

  // Draw waveform on canvas
  useEffect(() => {
    if (canvasRef.current && audioData.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);

      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const barWidth = canvas.offsetWidth / audioData.length;
      const centerY = canvas.offsetHeight / 2;

      audioData.forEach((amplitude, i) => {
        const barHeight = amplitude * centerY;
        const x = i * barWidth;
        const progress = duration > 0 ? currentTime / duration : 0;
        const isPlayed = i / audioData.length < progress;
        ctx.fillStyle = isPlayed ? "#7C3AED" : "#4F46E5";
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
      });

      if (duration > 0) {
        const progress = currentTime / duration;
        const cursorX = progress * canvas.offsetWidth;
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cursorX, 0);
        ctx.lineTo(cursorX, canvas.offsetHeight);
        ctx.stroke();
      }
    }
  }, [audioData, currentTime, duration]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => setIsLoading(false);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
      }
      setCurrentAudio(audio);
      await audio.play();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    audio.currentTime = progress * duration;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // New handler that calls the store action
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
    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
          {fileName}
        </h4>
        <span className="text-xs text-gray-500 whitespace-nowrap font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="mb-3 relative">
        {isLoading ? (
          <div className="h-16 bg-gray-100 rounded-md animate-pulse flex items-center justify-center">
            <span className="text-xs text-gray-500">Loading audio...</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-16 cursor-pointer rounded-md border border-gray-200 hover:border-blue-300 transition-colors"
          />
        )}
      </div>

      <audio ref={audioRef} src={audioUrl} preload="metadata" style={{ display: "none" }} />

      <div className="flex items-center justify-center">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="flex items-center justify-center w-12 h-12 bg-transparent text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors focus:outline-none"
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
          className="mt-2 w-full text-white px-4 py-2 rounded-xl text-sm animated-background bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-500 transition-transform duration-200 ease-in-out hover:scale-102"
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
                <a href={stem.url} download className="text-blue-500 hover:underline">
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
