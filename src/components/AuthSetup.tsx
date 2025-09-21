import React from 'react';
import { motion } from 'framer-motion';
import { ApiSettings } from './ApiSettings';

interface AuthSetupProps {
  onAuthSet: () => void;
}

export const AuthSetup: React.FC<AuthSetupProps> = ({ onAuthSet }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <ApiSettings onAuthSet={onAuthSet} />
      </motion.div>
    </div>
  );
};
