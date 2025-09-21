import React, { useState, useEffect } from 'react';
import { AuthSetup } from './components/AuthSetup';
import { Layout } from './components/Layout';
import { GeneratePage } from './components/GeneratePage';
import { SettingsPage } from './components/SettingsPage';
import * as api from './services/veo3Api';
import { GenerationSettings } from './types';

type Tab = 'generate' | 'settings';

function App() {
  const [isAuthSet, setIsAuthSet] = useState(api.isApiConfigured());
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [settings, setSettings] = useState<GenerationSettings>(() => {
    const saved = localStorage.getItem('veo3-settings');
    return saved ? JSON.parse(saved) : {
      quality: 'veo3-fast',
      aspectRatio: '16:9',
    };
  });

  useEffect(() => {
    localStorage.setItem('veo3-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    setIsAuthSet(api.isApiConfigured());
  }, []);

  const handleAuthSet = () => {
    setIsAuthSet(true);
  };

  if (!isAuthSet) {
    return <AuthSetup onAuthSet={handleAuthSet} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'generate' && <GeneratePage settings={settings} />}
      {activeTab === 'settings' && (
        <SettingsPage
          settings={settings}
          onSettingsChange={setSettings}
          onAuthSet={handleAuthSet}
        />
      )}
    </Layout>
  );
}

export default App;
