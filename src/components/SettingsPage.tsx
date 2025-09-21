import React from 'react';
import { SettingsPanel } from './SettingsPanel';
import { GenerationSettings } from '../types';

interface SettingsPageProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  onAuthSet: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSettingsChange, onAuthSet }) => {
  return (
    <div>
      <SettingsPanel
        settings={settings}
        onSettingsChange={onSettingsChange}
        onAuthSet={onAuthSet}
      />
    </div>
  );
};
