import React, { useState, useRef, useEffect } from 'react';
import * as api from '../services/veo3Api';

interface AuthenticatedVideoPlayerProps {
  videoUrl: string;
  className?: string;
}

export const AuthenticatedVideoPlayer: React.FC<AuthenticatedVideoPlayerProps> = ({
  videoUrl,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

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

  if (isLoading) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height: '200px' }}>
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg flex items-center justify-center ${className}`} style={{ height: '200px' }}>
        <div className="text-center text-red-600">
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-1">Video URL: {videoUrl}</p>
        </div>
      </div>
    );
  }

  if (!videoSrc) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height: '200px' }}>
        <div className="text-center text-gray-500">
          <p>No video to display</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      controls
      className={`bg-black rounded-lg ${className}`}
      style={{ minHeight: '200px' }}
    >
      Your browser does not support the video tag.
    </video>
  );
};
