import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck, LoaderCircle, Save } from 'lucide-react';
import * as api from '../services/veo3Api';

interface ApiSettingsProps {
  onAuthSet: () => void;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({ onAuthSet }) => {
  const [credentials, setCredentials] = useState(api.getAuthCredentials() || { projectId: '', location: 'us-central1', accessToken: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.projectId.trim() || !credentials.location.trim() || !credentials.accessToken.trim()) {
      setError('All fields are required.');
      return;
    }
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      api.setAuthCredentials(credentials);
      setSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        setSuccess(false);
        onAuthSet();
      }, 1500);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-lg"
    >
        <div className="flex items-center mb-4">
            <KeyRound className="w-6 h-6 mr-2 text-indigo-600" />
            <h3 className="text-xl font-bold">Gemini API Credentials</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
              Google Cloud Project ID
            </label>
            <input
              id="projectId"
              name="projectId"
              type="text"
              value={credentials.projectId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="vertex-ai-429712"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={credentials.location}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="us-central1"
            />
          </div>
          <div>
            <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
              Gemini API Key
            </label>
            <input
              id="accessToken"
              name="accessToken"
              type="password"
              value={credentials.accessToken}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your Gemini API key"
            />
             <p className="mt-2 text-xs text-gray-500">
              Get your API key from: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {isLoading ? <LoaderCircle className="animate-spin" /> : success ? <ShieldCheck /> : <><Save className="w-4 h-4 mr-2"/>Save Credentials</>}
          </button>
        </form>
    </motion.div>
  );
};
