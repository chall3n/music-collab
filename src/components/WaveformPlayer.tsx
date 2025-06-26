"use client";
  // Only one audio file should play at once, right now there can be multiple playing simultaneously
  // Add User and Project persistence 
import { useEffect, useRef, useState } from "react";

interface WaveformPlayerProps {
  audioUrl: string;
  fileName: string;
}

const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioUrl,
  fileName,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [audioData, setAudioData] = useState<number[]>([]);

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

      // Set canvas size
      canvas.width = canvas.offsetWidth * 2; // For retina displays
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);

      // Clear canvas
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Draw waveform
      const barWidth = canvas.offsetWidth / audioData.length;
      const centerY = canvas.offsetHeight / 2;

      audioData.forEach((amplitude, i) => {
        const barHeight = amplitude * centerY;
        const x = i * barWidth;

        // Progress color or wave color
        const progress = duration > 0 ? currentTime / duration : 0;
        const isPlayed = i / audioData.length < progress;

        ctx.fillStyle = isPlayed ? "#7C3AED" : "#4F46E5";
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
      });

      // Draw progress cursor
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
      console.log("✅ Audio loaded:", fileName);
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    const handleError = (e: Event) => {
      console.error("❌ Audio error:", e);
      setIsLoading(false);
    };

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
  }, [fileName]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error("❌ Playback error:", error);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * duration;

    audio.currentTime = Math.max(0, Math.min(newTime, duration));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
          {fileName}
        </h4>
        <span className="text-xs text-gray-500 whitespace-nowrap font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Waveform Canvas */}
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
            style={{ display: "block" }}
          />
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        style={{ display: "none" }}
      />

      {/* Controls */}
      <div className="flex items-center justify-center">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full transition-colors shadow-md hover:shadow-lg"
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 ml-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default WaveformPlayer;
