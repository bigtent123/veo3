export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';
export type VideoQuality = 'veo3-quality' | 'veo3-fast';

export interface GenerationSettings {
  quality: VideoQuality;
  aspectRatio: AspectRatio;
  seed?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  negativePrompt?: string;
}

export interface VideoClip {
  id: string;
  prompt: string;
  videoUrl?: string;
  imageUrl?: string;
  duration: number;
  aspectRatio: AspectRatio;
  quality: VideoQuality;
  isExtended: boolean;
  createdAt: Date;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface VideoProject {
  id: string;
  name: string;
  clips: VideoClip[];
  createdAt: Date;
  updatedAt: Date;
  totalDuration: number;
}
