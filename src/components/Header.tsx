import React from 'react';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Veo 3 App</h1>
            <p className="text-sm text-gray-500">Video Generation Studio</p>
          </div>
        </motion.div>
      </div>
    </header>
  );
};
