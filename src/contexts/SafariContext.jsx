import React, { createContext, useContext, useMemo } from 'react';

const SafariContext = createContext({
  isSafari: false,
  shouldReduceEffects: false
});

export const useSafari = () => useContext(SafariContext);

export const SafariProvider = ({ children }) => {
  const value = useMemo(() => {
    // Detect Safari browser (but not Chrome on iOS)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Also check for iOS devices which often have performance issues
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Reduce effects on Safari or iOS
    const shouldReduceEffects = isSafari || isIOS;

    return { isSafari, isIOS, shouldReduceEffects };
  }, []);

  return (
    <SafariContext.Provider value={value}>
      {children}
    </SafariContext.Provider>
  );
};

export default SafariContext;
