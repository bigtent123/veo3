import { GenerationSettings } from '../types';

interface AuthCredentials {
  projectId: string;
  location: string;
  accessToken: string;
}

type GenerateContentRequest = {
  contents: Array<{
    role: string;
    parts: Array<Record<string, unknown>>;
  }>;
  generationConfig: Record<string, unknown>;
};

let authCredentials: AuthCredentials | null = null;

export const setAuthCredentials = (credentials: AuthCredentials) => {
  authCredentials = credentials;
  localStorage.setItem('veo3-auth', JSON.stringify(credentials));
};

export const getAuthCredentials = (): AuthCredentials | null => {
  if (authCredentials) {
    return authCredentials;
  }
  const saved = localStorage.getItem('veo3-auth');
  if (saved) {
    try {
      authCredentials = JSON.parse(saved);
      return authCredentials;
    } catch (e) {
      localStorage.removeItem('veo3-auth');
    }
  }
  return null;
};

export const isApiConfigured = (): boolean => {
    return getAuthCredentials() !== null;
}

// Function to list available models
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const buildUrl = (path: string, apiKey: string) => {
  const separator = path.includes('?') ? '&' : '?';
  return `${BASE_URL}/${path}${separator}key=${encodeURIComponent(apiKey)}`;
};

const appendApiKeyToUrl = (url: string, apiKey: string) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('key', apiKey);
    return parsed.toString();
  } catch (error) {
    return url;
  }
};

export const listAvailableModels = async () => {
  const auth = getAuthCredentials();
  if (!auth) {
    throw new Error('Authentication credentials are not set.');
  }

  const response = await fetch(buildUrl('models', auth.accessToken), {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to list models');
  }

  return response.json();
};

export const generateVideo = async (prompt: string, settings: GenerationSettings) => {
  const auth = getAuthCredentials();
  if (!auth) {
    throw new Error('Authentication credentials are not set.');
  }

  // Use the correct Veo 3 API endpoint from the documentation
  const model = settings.quality === 'veo3-quality' 
    ? 'veo-3.0-generate-001' 
    : 'veo-3.0-fast-generate-001';

  // Build the prompt with aspect ratio specification
  let enhancedPrompt = prompt;
  
  // Add aspect ratio to prompt based on documentation
  if (settings.aspectRatio === '9:16') {
    enhancedPrompt = `Portrait (9:16) ${prompt}`;
  } else if (settings.aspectRatio === '16:9') {
    enhancedPrompt = `Widescreen (16:9) ${prompt}`;
  } else if (settings.aspectRatio === '1:1') {
    enhancedPrompt = `Square (1:1) ${prompt}`;
  } else if (settings.aspectRatio === '4:3') {
    enhancedPrompt = `Standard (4:3) ${prompt}`;
  } else if (settings.aspectRatio === '3:4') {
    enhancedPrompt = `Vertical (3:4) ${prompt}`;
  } else if (settings.aspectRatio === '21:9') {
    enhancedPrompt = `Ultrawide (21:9) ${prompt}`;
  }

  // Retry mechanism for rate limits
  let retryCount = 0;
  const maxRetries = 3;
  const baseDelay = 5000; // 5 seconds

  while (retryCount <= maxRetries) {
    try {
      const requestBody: GenerateContentRequest = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: enhancedPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['VIDEO'],
        },
      };

      if (settings.aspectRatio) {
        requestBody.generationConfig.videoConfig = {
          aspectRatio: settings.aspectRatio,
        };
      }

      const response = await fetch(buildUrl(`models/${model}:generateContent`, auth.accessToken), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Handle rate limit errors with retry
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Rate limit hit, retrying in ${delay/1000} seconds... (attempt ${retryCount + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
          continue;
        }
        
        // Handle rate limit errors specifically (final attempt)
        if (response.status === 429) {
          throw new Error('429 Error - This is likely an API key permissions issue, not a quota limit. Your API key may not have access to Veo 3 models. Please check if your API key has the correct permissions for video generation.');
        }
        
        throw new Error(errorData.error?.message || 'Failed to generate video with Veo 3 API');
      }

      const result = await response.json();
      
      // Return the operation name for polling (long-running operation)
      return {
        operationName: result.name,
        model: model,
        prompt: prompt,
        settings: settings
      };
    } catch (error) {
      if (retryCount >= maxRetries) {
        throw error;
      }
      retryCount++;
    }
  }
};

// Function to poll for video completion
export const pollVideoGeneration = async (operationName: string) => {
  const auth = getAuthCredentials();
  if (!auth) {
    throw new Error('Authentication credentials are not set.');
  }

  const response = await fetch(buildUrl(operationName, auth.accessToken), {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    // Handle rate limit errors specifically
    if (response.status === 429) {
      throw new Error('Rate limit exceeded while checking video status. Please wait before retrying.');
    }
    
    throw new Error(errorData.error?.message || 'Failed to check video generation status');
  }

  return response.json();
};

// Function to download generated video
export const downloadVideo = async (videoUri: string) => {
  const auth = getAuthCredentials();
  if (!auth) {
    throw new Error('Authentication credentials are not set.');
  }

  // The videoUri from Veo 3 API might be a Google Cloud Storage URL
  // We need to handle both direct URLs and authenticated URLs
  let fetchUrl = videoUri;
  let headers: Record<string, string> = {};

  // If it's a Google Cloud Storage URL, we might need to add the API key
  if (videoUri.includes('generativelanguage.googleapis.com') || videoUri.includes('storage.googleapis.com')) {
    fetchUrl = appendApiKeyToUrl(fetchUrl, auth.accessToken);
  }

  const response = await fetch(fetchUrl, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    // Try with different header format
    if (response.status === 403) {
      const retryResponse = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
        },
      });
      
      if (retryResponse.ok) {
        return retryResponse.blob();
      }
    }
    
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }

  return response.blob();
};

// Function to extend an existing video with proper visual continuity
export const extendVideo = async (
  originalPrompt: string,
  extensionPrompt: string,
  direction: 'before' | 'after',
  settings: GenerationSettings,
  referenceImageBase64?: string
) => {
  const auth = getAuthCredentials();
  if (!auth) {
    throw new Error('Authentication credentials are not set.');
  }

  // Use the correct Veo 3 API endpoint from the documentation
  const model = settings.quality === 'veo3-quality' 
    ? 'veo-3.0-generate-001' 
    : 'veo-3.0-fast-generate-001';

  // Build a much more detailed extension prompt that includes the original context
  let enhancedPrompt = '';
  
  if (direction === 'before') {
    enhancedPrompt = `Create a video that seamlessly leads into this scene: "${originalPrompt}". ${extensionPrompt}. The video should maintain the same visual style, lighting, camera movements, and atmosphere as the original scene. Focus on creating a natural transition that feels like one continuous video.`;
  } else {
    enhancedPrompt = `Continue this video scene seamlessly: "${originalPrompt}". ${extensionPrompt}. Maintain the exact same visual style, lighting conditions, camera angle, character appearance, and scene atmosphere. The continuation should feel like the natural next moment in the same video sequence.`;
  }

  // Add aspect ratio to prompt based on documentation
  if (settings.aspectRatio === '9:16') {
    enhancedPrompt = `Portrait (9:16) ${enhancedPrompt}`;
  } else if (settings.aspectRatio === '16:9') {
    enhancedPrompt = `Widescreen (16:9) ${enhancedPrompt}`;
  } else if (settings.aspectRatio === '1:1') {
    enhancedPrompt = `Square (1:1) ${enhancedPrompt}`;
  } else if (settings.aspectRatio === '4:3') {
    enhancedPrompt = `Standard (4:3) ${enhancedPrompt}`;
  } else if (settings.aspectRatio === '3:4') {
    enhancedPrompt = `Vertical (3:4) ${enhancedPrompt}`;
  } else if (settings.aspectRatio === '21:9') {
    enhancedPrompt = `Ultrawide (21:9) ${enhancedPrompt}`;
  }

  const requestBody: GenerateContentRequest = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: enhancedPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['VIDEO'],
    },
  };

  if (referenceImageBase64 && direction === 'after') {
    requestBody.contents[0].parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: referenceImageBase64,
      },
    });
  }

  if (settings.aspectRatio) {
    requestBody.generationConfig.videoConfig = {
      aspectRatio: settings.aspectRatio,
    };
  }

  const response = await fetch(buildUrl(`models/${model}:generateContent`, auth.accessToken), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    // Handle rate limit errors specifically
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a few minutes before extending another video. You can check your quota usage at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
    }
    
    throw new Error(errorData.error?.message || 'Failed to extend video with Veo 3 API');
  }

  const result = await response.json();
  
  // Return the operation name for polling
  return {
    operationName: result.name,
    model: model,
    prompt: enhancedPrompt,
    settings: settings,
    direction: direction,
    referenceImage: referenceImageBase64
  };
};
