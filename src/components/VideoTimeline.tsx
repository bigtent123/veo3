import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, SkipBack, SkipForward, RotateCcw, RotateCw } from 'lucide-react';

interface VideoTimelineProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onJumpTo?: (time: number) => void;
  className?: string;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  currentTime,
  duration,
  onSeek,
  onJumpTo,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showJumpTo, setShowJumpTo] = useState(false);
  const [jumpToTime, setJumpToTime] = useState('');

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    onSeek(newTime);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const time = (mouseX / rect.width) * duration;
    setHoverTime(time);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  const handleJumpTo = () => {
    const time = parseFloat(jumpToTime);
    if (!isNaN(time) && time >= 0 && time <= duration) {
      onSeek(time);
      onJumpTo?.(time);
      setJumpToTime('');
      setShowJumpTo(false);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hoverPercentage = hoverTime !== null ? (hoverTime / duration) * 100 : 0;

  const quickJumpTimes = [0, duration * 0.25, duration * 0.5, duration * 0.75, duration];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Clock className="w-5 h-5 mr-2 text-indigo-600" />
          Video Timeline
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Skip back 10s"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 10))}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Skip forward 10s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowJumpTo(!showJumpTo)}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Jump to
          </button>
        </div>
      </div>

      {/* Jump to input */}
      {showJumpTo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-3 bg-gray-50 rounded-md"
        >
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={jumpToTime}
              onChange={(e) => setJumpToTime(e.target.value)}
              placeholder="Time in seconds"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
              max={duration}
              step="0.1"
            />
            <button
              onClick={handleJumpTo}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter time in seconds (0 - {Math.floor(duration)})
          </p>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative mb-4">
        <div
          className="relative h-8 bg-gray-200 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Progress bar */}
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-600 rounded-lg transition-all duration-200"
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Hover indicator */}
          {hoverTime !== null && (
            <div 
              className="absolute top-0 h-full w-0.5 bg-white shadow-lg"
              style={{ left: `${hoverPercentage}%` }}
            />
          )}
          
          {/* Time markers */}
          <div className="absolute inset-0 flex justify-between items-center px-2">
            {quickJumpTimes.map((time, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(time);
                }}
                className="w-2 h-2 bg-white rounded-full hover:scale-125 transition-transform"
                style={{ left: `${(time / duration) * 100}%` }}
                title={`Jump to ${formatTime(time)}`}
              />
            ))}
          </div>
          
          {/* Current time indicator */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-indigo-600 cursor-pointer"
            style={{ left: `${progressPercentage}%`, marginLeft: '-8px' }}
          />
        </div>
        
        {/* Time display */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        {/* Hover time tooltip */}
        {hoverTime !== null && (
          <div 
            className="absolute bottom-full mb-2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded"
            style={{ left: `${hoverPercentage}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Quick jump buttons */}
      <div className="flex justify-between">
        {quickJumpTimes.slice(0, -1).map((time, index) => (
          <button
            key={index}
            onClick={() => onSeek(time)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded transition-colors"
          >
            {formatTime(time)}
          </button>
        ))}
        <button
          onClick={() => onSeek(duration)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded transition-colors"
        >
          End
        </button>
      </div>

      {/* Timeline controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSeek(0)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start</span>
          </button>
          
          <button
            onClick={() => onSeek(duration)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            <span>End</span>
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          {Math.floor(currentTime)}s / {Math.floor(duration)}s
        </div>
      </div>
    </motion.div>
  );
};
