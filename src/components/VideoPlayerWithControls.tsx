import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Expand, Clock } from 'lucide-react';
import * as api from '../services/veo3Api';

interface VideoPlayerWithControlsProps {
  videoUrl: string;
  onExtend: (direction: 'before' | 'after', prompt: string) => void;
}

export const VideoPlayerWithControls: React.FC<VideoPlayerWithControlsProps> = ({
  videoUrl,
  onExtend
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showExtend, setShowExtend] = useState(false);
  const [extendPrompt, setExtendPrompt] = useState('');
  const [extendDirection, setExtendDirection] = useState<'before' | 'after'>('after');

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError('');

        const auth = api.getAuthCredentials();
        if (!auth) {
          setError('Authentication credentials not found');
          return;
        }

        // Create an authenticated blob URL for the video
        const response = await fetch(videoUrl, {
          headers: {
            'x-goog-api-key': auth.accessToken,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load video: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setVideoSrc(objectUrl);

        // Clean up the previous object URL when component unmounts or URL changes
        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoSrc]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleSkipBack = () => {
    handleSeek(Math.max(0, currentTime - 10));
  };

  const handleSkipForward = () => {
    handleSeek(Math.min(duration, currentTime + 10));
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleExtend = () => {
    if (extendPrompt.trim()) {
      onExtend(extendDirection, extendPrompt);
      setShowExtend(false);
      setExtendPrompt('');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: '300px' }}>
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
            <Play className="w-6 h-6" />
          </div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center text-red-600">
          <p className="font-semibold">Failed to load video</p>
          <p className="text-sm mt-2">{error}</p>
          <p className="text-xs mt-2 text-gray-500 break-all">{videoUrl}</p>
        </div>
      </div>
    );
  }

  if (!videoSrc) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: '300px' }}>
        <div className="text-center text-gray-500">
          <p>No video to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-black rounded-lg overflow-hidden group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-auto"
          onClick={togglePlay}
        />
        
        {/* Controls Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4"
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div 
              className="relative h-1 bg-white/30 rounded-full cursor-pointer" 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newTime = (clickX / rect.width) * duration;
                handleSeek(newTime);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-200"
                style={{ left: `${progressPercentage}%`, marginLeft: '-8px' }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSkipBack}
                className="text-white hover:text-gray-300 transition-colors"
                title="Skip back 10s"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              
              <button
                onClick={handleSkipForward}
                className="text-white hover:text-gray-300 transition-colors"
                title="Skip forward 10s"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowExtend(!showExtend)}
                className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Expand className="w-4 h-4" />
                <span>Extend</span>
              </button>
              
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              
              <button
                onClick={() => videoRef.current?.requestFullscreen()}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Extend Video Panel */}
      {showExtend && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center mb-4">
            <Expand className="w-5 h-5 mr-2 text-indigo-600" />
            <h4 className="font-semibold">Extend Video</h4>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => setExtendDirection('before')}
              className={`p-3 rounded-lg border-2 transition-all ${
                extendDirection === 'before'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <RotateCcw className="w-5 h-5 mx-auto mb-1" />
              <span className="font-medium">Before</span>
            </button>
            
            <button
              onClick={() => setExtendDirection('after')}
              className={`p-3 rounded-lg border-2 transition-all ${
                extendDirection === 'after'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <RotateCw className="w-5 h-5 mx-auto mb-1" />
              <span className="font-medium">After</span>
            </button>
          </div>

          <textarea
            value={extendPrompt}
            onChange={(e) => setExtendPrompt(e.target.value)}
            placeholder={`Describe what happens ${extendDirection === 'before' ? 'before' : 'after'} this scene...`}
            className="w-full p-3 border border-gray-300 rounded-md h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowExtend(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExtend}
              disabled={!extendPrompt.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            >
              Extend Video
            </button>
          </div>
        </motion.div>
      )}

      {/* Quick Jump Buttons */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => handleSeek(0)}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          <Clock className="w-4 h-4" />
          <span>Start</span>
        </button>
        
        <button
          onClick={() => handleSeek(duration * 0.25)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          25%
        </button>
        
        <button
          onClick={() => handleSeek(duration * 0.5)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          50%
        </button>
        
        <button
          onClick={() => handleSeek(duration * 0.75)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          75%
        </button>
        
        <button
          onClick={() => handleSeek(duration)}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          <Clock className="w-4 h-4" />
          <span>End</span>
        </button>
      </div>
    </div>
  );
};
