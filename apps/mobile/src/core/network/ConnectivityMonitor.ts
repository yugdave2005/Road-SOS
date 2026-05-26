import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

export type ConnectivityState = 'online' | 'offline' | 'limited';

interface ConnectivityStore {
  state: ConnectivityState;
  setState: (state: ConnectivityState) => void;
}

export const useConnectivityStore = create<ConnectivityStore>((set) => ({
  state: 'online',
  setState: (state) => set({ state }),
}));

export class ConnectivityMonitor {
  private static unsubscribeNetInfo: (() => void) | null = null;

  static start() {
    if (this.unsubscribeNetInfo) return;

    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      const currentState = useConnectivityStore.getState().state;
      
      if (isConnected) {
        if (currentState !== 'limited') {
           useConnectivityStore.getState().setState('online');
        }
      } else {
        useConnectivityStore.getState().setState('offline');
      }
    });
  }

  static stop() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  static async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable);
  }

  static setLimited() {
    useConnectivityStore.getState().setState('limited');
  }

  static setOnline() {
    useConnectivityStore.getState().setState('online');
  }
}
