import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Expand, Clock, Zap, Settings } from 'lucide-react';
import { GenerationSettings } from '../types';

interface VideoExtendProps {
  currentVideoUrl?: string;
  currentDuration?: number;
  onExtend: (prompt: string, settings: GenerationSettings, direction: 'before' | 'after') => Promise<void>;
  className?: string;
}

export const VideoExtend: React.FC<VideoExtendProps> = ({
  currentVideoUrl,
  currentDuration,
  onExtend,
  className = ''
}) => {
  const [prompt, setPrompt] = useState('');
  const [direction, setDirection] = useState<'before' | 'after'>('after');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>({
    quality: 'veo3-fast',
    aspectRatio: '16:9'
  });

  const handleExtend = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for the extension.');
      return;
    }

    if (!currentVideoUrl) {
      setError('No video loaded to extend.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onExtend(prompt, settings, direction);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectionChange = (newDirection: 'before' | 'after') => {
    setDirection(newDirection);
    // Update prompt placeholder based on direction
    if (newDirection === 'before') {
      setPrompt(prompt || 'What happened before this scene...');
    } else {
      setPrompt(prompt || 'What happens next in this scene...');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-lg p-6 ${className}`}
    >
      <div className="flex items-center mb-6">
        <Expand className="w-6 h-6 mr-2 text-indigo-600" />
        <h3 className="text-xl font-bold">Extend Video</h3>
      </div>

      {!currentVideoUrl && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            Load a video first to extend it with AI-generated content.
          </p>
        </div>
      )}

      {/* Direction Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Extension Direction
        </label>
        <div className="flex space-x-4">
          <button
            onClick={() => handleDirectionChange('before')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              direction === 'before'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Before</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Generate what happened before the current video
            </p>
          </button>
          
          <button
            onClick={() => handleDirectionChange('after')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              direction === 'after'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-5 h-5" />
              <span className="font-medium">After</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Generate what happens after the current video
            </p>
          </button>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Extension Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            direction === 'before'
              ? "Describe what happened before this scene... (e.g., 'The character was walking through a forest before entering the building')"
              : "Describe what happens next... (e.g., 'The character continues walking and discovers a hidden room')"
          }
          className="w-full p-3 border border-gray-300 rounded-md h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoading || !currentVideoUrl}
        />
        <p className="text-xs text-gray-500 mt-1">
          Be specific about the continuity and style to match your existing video.
        </p>
      </div>

      {/* Settings */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Settings className="w-4 h-4 mr-2 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">Extension Settings</label>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Quality */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Quality</label>
            <select
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="veo3-fast">Fast</option>
              <option value="veo3-quality">High Quality</option>
            </select>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Aspect Ratio</label>
            <select
              value={settings.aspectRatio}
              onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
              <option value="21:9">21:9</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current Video Info */}
      {currentVideoUrl && currentDuration && (
        <div className="mb-6 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Video:</span>
            <span className="text-sm font-medium">{Math.floor(currentDuration)}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Extension:</span>
            <span className="text-sm font-medium">
              {direction === 'before' ? 'Before' : 'After'} (+8s)
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Extend Button */}
      <button
        onClick={handleExtend}
        disabled={isLoading || !currentVideoUrl || !prompt.trim()}
        className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Extending Video...</span>
          </>
        ) : (
          <>
            <Expand className="w-4 h-4" />
            <span>Extend {direction === 'before' ? 'Before' : 'After'}</span>
          </>
        )}
      </button>

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Tips for Better Extensions:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Describe the lighting, camera angle, and mood to match your video</li>
          <li>• Include specific actions or movements for continuity</li>
          <li>• Mention any objects or characters that should appear</li>
          <li>• Keep the style consistent with your original video</li>
        </ul>
      </div>
    </motion.div>
  );
};
