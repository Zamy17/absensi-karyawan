// src/components/InstallPWA.jsx
import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // App is already installed
    }

    // Listen for beforeinstallprompt event
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
      
      // Check if we should show the prompt (not shown in last 24 hours)
      const lastPrompt = localStorage.getItem('pwaPromptTime');
      const now = Date.now();
      
      if (!lastPrompt || (now - parseInt(lastPrompt, 10)) > 86400000) {
        setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem('pwaPromptTime', now.toString());
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    if (!installPrompt) return;

    // Show the browser's install prompt
    installPrompt.prompt();

    // Wait for user response
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the saved prompt
      setInstallPrompt(null);
      setShowPrompt(false);
    });
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 flex justify-center p-4 z-40">
      <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 flex items-center max-w-md mx-auto">
        <div className="mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-bold">Instal Aplikasi</h3>
          <p className="text-sm text-gray-600">Instal aplikasi ini di perangkat Anda untuk akses lebih cepat dan offline</p>
        </div>
        <div className="ml-4 flex space-x-2">
          <button 
            onClick={dismissPrompt}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Nanti
          </button>
          <button 
            onClick={handleInstall}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Instal
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;