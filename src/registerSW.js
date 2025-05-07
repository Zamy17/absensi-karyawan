// src/registerSW.js
// This file is used by vite-plugin-pwa to register the service worker

// Check if service workers are supported
if ('serviceWorker' in navigator) {
    // Use the window load event to keep the page load performant
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Add update handling
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available - show notification
                const updateNotification = document.createElement('div');
                updateNotification.className = 'update-notification';
                updateNotification.innerHTML = `
                  <div class="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center">
                    <div class="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">Versi baru tersedia!</p>
                      <button id="update-app" class="text-sm bg-white text-blue-600 px-3 py-1 rounded mt-1 hover:bg-blue-50">Perbarui Sekarang</button>
                    </div>
                    <button id="close-notification" class="ml-3 text-white hover:text-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                `;
                document.body.appendChild(updateNotification);
                
                // Handle update button click
                document.getElementById('update-app').addEventListener('click', () => {
                  if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                  }
                  window.location.reload();
                });
                
                // Handle close button click
                document.getElementById('close-notification').addEventListener('click', () => {
                  document.body.removeChild(updateNotification);
                });
              }
            });
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
    
    // Listen for controlling service worker taking over
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker controller, reloading page...');
      window.location.reload();
    });
  }
  
  export {};