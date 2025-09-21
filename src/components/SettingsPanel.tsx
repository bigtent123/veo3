import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Zap, Shield, Monitor, Sliders } from 'lucide-react';
import { GenerationSettings, AspectRatio, VideoQuality, SafetyLevel } from '../types';
import { ApiSettings } from './ApiSettings';

interface SettingsPanelProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  onAuthSet: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, onAuthSet }) => {
  return (
    <div className="space-y-4">
        <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg"
        >
        <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 mr-2 text-indigo-600" />
            <h3 className="text-xl font-bold">Generation Settings</h3>
        </div>

        {/* Quality */}
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Quality</label>
            <div className="flex space-x-2 mt-1">
            {(['veo3-fast', 'veo3-quality'] as VideoQuality[]).map(q => (
                <button
                key={q}
                onClick={() => onSettingsChange({ ...settings, quality: q })}
                className={`flex-1 py-2 text-sm rounded-md ${settings.quality === q ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                >
                {q === 'veo3-fast' ? 'Fast' : 'Quality'}
                </button>
            ))}
            </div>
        </div>

        {/* Aspect Ratio */}
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
            {(['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'] as AspectRatio[]).map(ar => (
                <button
                key={ar}
                onClick={() => onSettingsChange({ ...settings, aspectRatio: ar })}
                className={`py-2 text-sm rounded-md ${settings.aspectRatio === ar ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                >
                {ar}
                </button>
            ))}
            </div>
        </div>
        
        {/* More settings will be added here */}

        </motion.div>
        <ApiSettings onAuthSet={onAuthSet} />
    </div>
  );
};
