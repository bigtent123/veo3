import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import * as api from '../services/veo3Api';
import { GenerationSettings } from '../types';
import { VideoPlayerWithControls } from './VideoPlayerWithControls';
import { extractFinalFrame, concatenateVideos } from '../utils/videoUtils';

interface VideoGenerationPanelProps {
    settings: GenerationSettings;
}

export const VideoGenerationPanel: React.FC<VideoGenerationPanelProps> = ({ settings }) => {
  const [prompt, setPrompt] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('veo3-current-prompt');
    return saved || '';
  });
  const [isLoading, setIsLoading] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('veo3-is-loading');
    return saved === 'true';
  });
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('veo3-current-result');
    return saved ? JSON.parse(saved) : null;
  });
  const [operationStatus, setOperationStatus] = useState<string>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('veo3-operation-status');
    return saved || '';
  });
  const [videoUrl, setVideoUrl] = useState<string>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('veo3-current-video');
    return saved || '';
  });
  const [originalPrompt, setOriginalPrompt] = useState<string>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('veo3-original-prompt');
    return saved || '';
  });
  const [videoHistory, setVideoHistory] = useState<string[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('veo3-video-history');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('veo3-current-video', videoUrl);
  }, [videoUrl]);

  useEffect(() => {
    localStorage.setItem('veo3-original-prompt', originalPrompt);
  }, [originalPrompt]);

  useEffect(() => {
    localStorage.setItem('veo3-video-history', JSON.stringify(videoHistory));
  }, [videoHistory]);

  useEffect(() => {
    localStorage.setItem('veo3-current-prompt', prompt);
  }, [prompt]);

  useEffect(() => {
    localStorage.setItem('veo3-is-loading', isLoading.toString());
  }, [isLoading]);

  useEffect(() => {
    localStorage.setItem('veo3-current-result', JSON.stringify(result));
  }, [result]);

  useEffect(() => {
    localStorage.setItem('veo3-operation-status', operationStatus);
  }, [operationStatus]);

  // Resume polling if we were in the middle of a generation
  useEffect(() => {
    const resumeGeneration = async () => {
      if (isLoading && result?.operationName && !videoUrl) {
        setOperationStatus('Resuming video generation...');
        
        try {
          let completed = false;
          let pollCount = 0;
          let pollInterval = 15000; // Start with 15 seconds
          
          while (!completed) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            pollCount++;
            
            try {
              const status = await api.pollVideoGeneration(result.operationName);
              
              if (status.done) {
                completed = true;
                if (status.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
                  const videoUri = status.response.generateVideoResponse.generatedSamples[0].video.uri;
                  setVideoUrl(videoUri);
                  setVideoHistory([videoUri]);
                  setOperationStatus('Video generation completed!');
                } else {
                  setError('Video generation completed but no video URL found.');
                }
              } else {
                // Increase interval gradually to reduce API calls
                if (pollCount > 3) pollInterval = Math.min(pollInterval * 1.2, 60000); // Max 60 seconds
                setOperationStatus(`Still generating... (${pollCount * Math.floor(pollInterval/1000)}s elapsed) This may take several minutes.`);
              }
            } catch (pollError) {
              if (pollError instanceof Error && pollError.message.includes('quota')) {
                setError('Rate limit reached. Please wait a few minutes and try again.');
                break;
              }
              // For other errors, continue polling but with longer intervals
              pollInterval = Math.min(pollInterval * 1.5, 120000); // Max 2 minutes
              setOperationStatus(`Polling error, retrying in ${Math.floor(pollInterval/1000)}s...`);
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
          setOperationStatus('');
        } finally {
          setIsLoading(false);
        }
      }
    };

    resumeGeneration();
  }, []); // Only run on component mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Prompt cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult(null);
    setOperationStatus('Starting video generation...');

    try {
      // Store the original prompt for extensions
      setOriginalPrompt(prompt);
      
      // Start the video generation
      const operation = await api.generateVideo(prompt, settings);
      setResult(operation);
      setOperationStatus('Video generation started. This may take several minutes...');

      // Poll for completion with exponential backoff
      let completed = false;
      let pollCount = 0;
      let pollInterval = 15000; // Start with 15 seconds
      
      while (!completed) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        pollCount++;
        
        try {
          const status = await api.pollVideoGeneration(operation.operationName);
          
          if (status.done) {
            completed = true;
            if (status.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
              const videoUri = status.response.generateVideoResponse.generatedSamples[0].video.uri;
              setVideoUrl(videoUri);
              setVideoHistory([videoUri]);
              setOperationStatus('Video generation completed!');
            } else {
              setError('Video generation completed but no video URL found.');
            }
          } else {
            // Increase interval gradually to reduce API calls
            if (pollCount > 3) pollInterval = Math.min(pollInterval * 1.2, 60000); // Max 60 seconds
            setOperationStatus(`Still generating... (${pollCount * Math.floor(pollInterval/1000)}s elapsed) This may take several minutes.`);
          }
        } catch (pollError) {
          if (pollError instanceof Error && pollError.message.includes('quota')) {
            setError('Rate limit reached. Please wait a few minutes and try again.');
            break;
          }
          // For other errors, continue polling but with longer intervals
          pollInterval = Math.min(pollInterval * 1.5, 120000); // Max 2 minutes
          setOperationStatus(`Polling error, retrying in ${Math.floor(pollInterval/1000)}s...`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setOperationStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg"
    >
        <div className="flex items-center mb-4">
            <Video className="w-6 h-6 mr-2 text-indigo-600" />
            <h3 className="text-xl font-bold">Generate Video</h3>
        </div>
        <form onSubmit={handleSubmit}>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="w-full p-2 border border-gray-300 rounded-md h-32"
                disabled={isLoading}
            />
            <button
                type="submit"
                className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300"
                disabled={isLoading}
            >
                {isLoading ? 'Generating...' : 'Generate'}
            </button>
        </form>
        
        {/* Operation Status */}
        {operationStatus && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                    {isLoading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />}
                    <p className="text-blue-800">{operationStatus}</p>
                </div>
            </div>
        )}

        {/* Error Display */}
        {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
            </div>
        )}

        {/* Video History */}
        {videoHistory.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Video Timeline ({videoHistory.length} clip{videoHistory.length > 1 ? 's' : ''}):</h4>
                    <button
                        onClick={() => {
                            setVideoHistory([]);
                            setVideoUrl('');
                            setOriginalPrompt('');
                            setPrompt('');
                            setResult(null);
                            setOperationStatus('');
                            setIsLoading(false);
                            setError('');
                        }}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                        Clear All
                    </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {videoHistory.map((url, index) => (
                        <div key={index} className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-sm">
                            <span className="font-medium">Clip {index + 1}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Generated Video */}
        {videoUrl && (
            <div className="mt-4">
                <h4 className="font-semibold mb-2">Generated Video:</h4>
                <VideoPlayerWithControls 
                    videoUrl={videoUrl}
                    onExtend={async (direction, extensionPrompt) => {
                        // Handle video extension with proper frame capture
                        setIsLoading(true);
                        setError('');
                        setOperationStatus(`Extending video ${direction === 'before' ? 'before' : 'after'}...`);

                        try {
                            let referenceImageBase64: string | undefined;

                            // For 'after' extensions, extract the final frame as reference
                            if (direction === 'after') {
                                setOperationStatus('Extracting final frame from video...');
                                try {
                                    referenceImageBase64 = await extractFinalFrame(videoUrl);
                                    setOperationStatus('Frame extracted. Starting video extension...');
                                } catch (frameError) {
                                    console.warn('Could not extract frame, proceeding without reference:', frameError);
                                    setOperationStatus('Starting video extension (without frame reference)...');
                                }
                            }

                            // Generate the extended video with reference image
                            const operation = await api.extendVideo(
                                originalPrompt, 
                                extensionPrompt, 
                                direction, 
                                settings, 
                                referenceImageBase64
                            );
                            
                            setResult(operation);
                            setOperationStatus('Video extension started. This may take several minutes...');

                            // Poll for completion with exponential backoff
                            let completed = false;
                            let pollCount = 0;
                            let pollInterval = 15000; // Start with 15 seconds
                            
                            while (!completed) {
                                await new Promise(resolve => setTimeout(resolve, pollInterval));
                                pollCount++;
                                
                                try {
                                    const status = await api.pollVideoGeneration(operation.operationName);
                                    
                                    if (status.done) {
                                        completed = true;
                                        if (status.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
                                            const extendedVideoUri = status.response.generateVideoResponse.generatedSamples[0].video.uri;
                                            
                                            // Update video history
                                            const newHistory = direction === 'before' 
                                                ? [extendedVideoUri, ...videoHistory]  // Prepend for 'before'
                                                : [...videoHistory, extendedVideoUri]; // Append for 'after'
                                            
                                            setVideoHistory(newHistory);
                                            
                                            // Concatenate videos if we have multiple clips
                                            if (newHistory.length > 1) {
                                                setOperationStatus('Concatenating video clips...');
                                                try {
                                                    const concatenatedUrl = await concatenateVideos(newHistory);
                                                    setVideoUrl(concatenatedUrl);
                                                    setOperationStatus('Video extension and concatenation completed!');
                                                } catch (concatError) {
                                                    console.warn('Could not concatenate videos, showing latest:', concatError);
                                                    setVideoUrl(extendedVideoUri);
                                                    setOperationStatus('Video extension completed! (Concatenation failed)');
                                                }
                                            } else {
                                                setVideoUrl(extendedVideoUri);
                                                setOperationStatus('Video extension completed!');
                                            }
                                        } else {
                                            setError('Video extension completed but no video URL found.');
                                        }
                                    } else {
                                        // Increase interval gradually to reduce API calls
                                        if (pollCount > 3) pollInterval = Math.min(pollInterval * 1.2, 60000); // Max 60 seconds
                                        setOperationStatus(`Still extending video... (${pollCount * Math.floor(pollInterval/1000)}s elapsed) This may take several minutes.`);
                                    }
                                } catch (pollError) {
                                    if (pollError instanceof Error && pollError.message.includes('quota')) {
                                        setError('Rate limit reached. Please wait a few minutes and try again.');
                                        break;
                                    }
                                    // For other errors, continue polling but with longer intervals
                                    pollInterval = Math.min(pollInterval * 1.5, 120000); // Max 2 minutes
                                    setOperationStatus(`Polling error, retrying in ${Math.floor(pollInterval/1000)}s...`);
                                }
                            }
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to extend video');
                            setOperationStatus('');
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                />
            </div>
        )}

        {/* Debug Info */}
        {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h4 className="font-bold">Operation Info:</h4>
                <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
        )}
    </motion.div>
  );
};
