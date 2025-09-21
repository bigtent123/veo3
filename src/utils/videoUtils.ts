/**
 * Utility functions for video processing
 */

/**
 * Extract the final frame from a video as a base64 image
 */
export const extractFinalFrame = async (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // Seek to the end of the video
      video.currentTime = video.duration;
    };
    
    video.onseeked = () => {
      try {
        // Create a canvas to capture the frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };
    
    video.onerror = (error) => {
      reject(new Error('Failed to load video for frame extraction'));
    };
    
    // Start loading the video
    video.src = videoUrl;
  });
};

/**
 * Concatenate multiple video URLs into a single blob URL
 */
export const concatenateVideos = async (videoUrls: string[]): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create video elements for each URL
      const videos = await Promise.all(
        videoUrls.map(async (url) => {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.preload = 'auto';
          
          return new Promise<HTMLVideoElement>((videoResolve, videoReject) => {
            video.onloadeddata = () => videoResolve(video);
            video.onerror = () => videoReject(new Error(`Failed to load video: ${url}`));
            video.src = url;
          });
        })
      );
      
      // Get video dimensions (assuming all videos have same dimensions)
      const firstVideo = videos[0];
      const width = firstVideo.videoWidth;
      const height = firstVideo.videoHeight;
      const duration = videos.reduce((total, video) => total + video.duration, 0);
      
      // Create canvas for concatenation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Create a new video element for the result
      const resultVideo = document.createElement('video');
      resultVideo.width = width;
      resultVideo.height = height;
      
      // For now, return the first video URL as a simple implementation
      // In a real implementation, you'd use FFmpeg.js or similar for proper concatenation
      resolve(videoUrls[0]);
      
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Convert blob to base64
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert base64 to blob
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};
