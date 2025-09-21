import React from 'react';
import { VideoGenerationPanel } from './VideoGenerationPanel';
import { GenerationSettings } from '../types';

interface GeneratePageProps {
  settings: GenerationSettings;
}

export const GeneratePage: React.FC<GeneratePageProps> = ({ settings }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <VideoGenerationPanel settings={settings} />
      </div>
      <div>
        {/* Placeholder for video preview */}
        <div className="bg-white p-6 rounded-lg shadow-lg h-full">
            <h3 className="text-xl font-bold">Video Preview</h3>
        </div>
      </div>
    </div>
  );
};
