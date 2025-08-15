
"use client";

import React, { useEffect, useRef } from 'react';
import type { AdSettings } from '@/types';
import { useAdSettings } from '@/contexts/AdSettingsContext'; // Import useAdSettings

const GlobalAdScripts: React.FC = () => {
  const { adSettings, isLoadingAdSettings } = useAdSettings(); // Consume context
  const adsterraPopunderInjected = useRef(false);
  const monetagPopunderInjected = useRef(false);
  const adsterraSocialBarInjected = useRef(false);
  
  // Check if we're in admin panel to prevent ads
  const isAdminPanel = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isLoadingAdSettings || !adSettings || typeof document === 'undefined' || isAdminPanel) {
      return;
    }

    /**
     * Injects a script into the document body.
     * WARNING: Using innerHTML to parse script code from an untrusted source can be a security risk (XSS).
     * Ensure that the source of `scriptCode` (i.e., your ad settings) is strictly controlled and sanitized.
     *
     * Consider alternative, safer methods for injecting external scripts provided by ad networks.
     * Consult the specific ad network documentation for recommended integration methods in modern web applications.
     *
     * @param scriptCode The script code to inject.
     */
    const injectScript = (scriptCode: string, networkName: string, injectedRef: React.MutableRefObject<boolean>) => {
      if (injectedRef.current || !scriptCode || !scriptCode.trim() || scriptCode.toLowerCase().includes('placeholder')) {
        return; 
      }

      try {
        const scriptContainer = document.createElement('div');
        scriptContainer.innerHTML = scriptCode; 
        
        let hasValidScriptTag = false;
        Array.from(scriptContainer.childNodes).forEach(node => {
          if (node.nodeName === "SCRIPT") {
            const scriptTag = document.createElement('script');
            const originalScript = node as HTMLScriptElement;
            
            for (let i = 0; i < originalScript.attributes.length; i++) {
              const attr = originalScript.attributes[i];
              scriptTag.setAttribute(attr.name, attr.value);
            }
            scriptTag.innerHTML = originalScript.innerHTML;
            
            if (scriptTag.src || scriptTag.innerHTML.trim()) {
              hasValidScriptTag = true;
              document.body.appendChild(scriptTag);
            } else {
              // console.warn(`Skipping potentially empty/malformed ${networkName} pop-under script part (no src or innerHTML).`);
            }
          } else {
            // Append other nodes like comments, noscript tags, etc.
            // Check if it's not just whitespace text node
            if (node.nodeType !== Node.TEXT_NODE || node.textContent?.trim()) {
                document.body.appendChild(node.cloneNode(true));
            }
          }
        });

        if(hasValidScriptTag){
            injectedRef.current = true;
            console.log(`${networkName} pop-under script injected.`);
        } else {
            // console.warn(`No valid script tags found in ${networkName} pop-under code.`);
        }

      } catch (e) {
        console.error(`Error injecting ${networkName} pop-under script:`, e);
      }
    };

    if (adSettings.adsEnabledGlobally) {
      // Adsterra Pop-under
      if (adSettings.adsterraPopunderEnabled && !adsterraPopunderInjected.current) {
        injectScript(adSettings.adsterraPopunderCode, "Adsterra", adsterraPopunderInjected);
      }

      // Monetag Pop-under
      if (adSettings.monetagPopunderEnabled && !monetagPopunderInjected.current) {
        injectScript(adSettings.monetagPopunderCode, "Monetag", monetagPopunderInjected);
      }
    }

    // Adsterra Social Bar
    if (adSettings.adsterraSocialBarEnabled && !adsterraSocialBarInjected.current) {
      injectScript(adSettings.adsterraSocialBarCode, "Adsterra Social Bar", adsterraSocialBarInjected);
    }
    // Clean up: Potentially remove scripts if settings change to disabled during session?
    // For simplicity, current approach injects if enabled on load and doesn't remove.
    // True dynamic removal is complex as scripts might have already executed.
  }, [adSettings, isLoadingAdSettings]);

  return null; 
};

export default GlobalAdScripts;
