import React from 'react';
import { Header } from './Header';
import { Video, Settings } from 'lucide-react';

type Tab = 'generate' | 'settings';

interface LayoutProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  children: React.ReactNode;
}

const tabs: { id: Tab, label: string, icon: React.ElementType }[] = [
    { id: 'generate', label: 'Generate', icon: Video },
    { id: 'settings', label: 'Settings', icon: Settings },
]

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto p-4">
        <div className="mb-6">
            <div className="flex space-x-2 p-1 bg-gray-200 rounded-lg">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium ${activeTab === tab.id ? 'bg-white text-indigo-700 shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
        <div>
            {children}
        </div>
      </main>
    </div>
  );
};
