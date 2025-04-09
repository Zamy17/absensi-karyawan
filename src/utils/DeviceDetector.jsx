// src/utils/DeviceDetector.jsx
import { useState, useEffect, createContext, useContext } from 'react';

// Create device context
const DeviceContext = createContext({
  isMobile: false,
  isTablet: false,
  isDesktop: false
});

// Hook to use device context
export const useDevice = () => useContext(DeviceContext);

// Provider component
export const DeviceProvider = ({ children }) => {
  const [deviceType, setDeviceType] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });

  useEffect(() => {
    // Function to detect device type
    const detectDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        // Mobile
        setDeviceType({
          isMobile: true,
          isTablet: false,
          isDesktop: false
        });
      } else if (width >= 768 && width < 1024) {
        // Tablet
        setDeviceType({
          isMobile: false,
          isTablet: true,
          isDesktop: false
        });
      } else {
        // Desktop
        setDeviceType({
          isMobile: false,
          isTablet: false,
          isDesktop: true
        });
      }
    };

    // Initial detection
    detectDeviceType();

    // Add resize listener
    window.addEventListener('resize', detectDeviceType);

    // Cleanup
    return () => {
      window.removeEventListener('resize', detectDeviceType);
    };
  }, []);

  return (
    <DeviceContext.Provider value={deviceType}>
      {children}
    </DeviceContext.Provider>
  );
};

export default DeviceProvider;