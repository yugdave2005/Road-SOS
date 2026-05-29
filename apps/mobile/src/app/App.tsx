import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RealmProvider } from '@realm/react';
import { realmConfig } from '../core/db/RealmConfig';
import { RootNavigator } from './navigation/RootNavigator';
import { ConnectivityMonitor } from '../core/network/ConnectivityMonitor';
import { OfflineBanner } from '../shared/components/OfflineBanner';
import { SyncManager } from '../core/db/SyncManager';
import { PoiRepository } from '../core/db/PoiRepository';
import { PoiDataLoader } from '../core/data/PoiDataLoader';
import { useRealm } from '@realm/react';
import { VoiceActivation } from '../core/ai/VoiceActivation';
import { Logger } from '../core/utils/Logger';

function SyncInitializer({ children }: { children: React.ReactNode }) {
  const realm = useRealm();
  
  useEffect(() => {
    const initApp = async () => {
      Logger.info('[App] Starting initialisation sequence...');
      
      ConnectivityMonitor.start();
      
      const repo = new PoiRepository(realm);
      
      // Seed bundled POI data on first launch (before sync)
      await PoiDataLoader.seedIfEmpty(repo);
      
      await SyncManager.initialise(repo);
      
      await VoiceActivation.initialise();
      // In production, would prompt user before starting continuous listening
      
      Logger.info('[App] Initialisation complete.');
    };

    initApp();

    return () => {
      ConnectivityMonitor.stop();
      VoiceActivation.stopListening();
    };
  }, [realm]);

  return <>{children}</>;
}

export default function App() {
  return (
    <RealmProvider {...realmConfig}>
      <SyncInitializer>
        <NavigationContainer>
          <OfflineBanner />
          <RootNavigator />
        </NavigationContainer>
      </SyncInitializer>
    </RealmProvider>
  );
}
