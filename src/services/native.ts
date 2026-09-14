import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Network } from '@capacitor/network';
import type { SurveyPhoto } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const isNative = Capacitor.isNativePlatform();

export async function takePhoto(): Promise<SurveyPhoto | null> {
  try {
    let photo: Photo;

    if (isNative) {
      photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true
      });
    } else {
      const dataUrl = await captureWithBrowserCamera();
      if (!dataUrl) return null;
      return {
        id: uuidv4(),
        dataUrl,
        createdAt: Date.now()
      };
    }

    if (!photo.dataUrl) return null;

    return {
      id: uuidv4(),
      dataUrl: photo.dataUrl,
      createdAt: Date.now()
    };
  } catch (err) {
    console.error('Photo capture failed:', err);
    return null;
  }
}

function captureWithBrowserCamera(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    const cleanup = () => {
      input.remove();
    };

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        cleanup();
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        cleanup();
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        cleanup();
        resolve(null);
      };
      reader.readAsDataURL(file);
    };

    input.oncancel = () => {
      cleanup();
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}

export async function isOnline(): Promise<boolean> {
  if (isNative) {
    const status = await Network.getStatus();
    return status.connected;
  }
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export type NetworkStatusListener = (online: boolean) => void;

export function subscribeToNetworkStatus(listener: NetworkStatusListener): () => void {
  let unsubscribe: (() => void) | undefined;
  let nativeHandle: Promise<{ remove: () => void }> | undefined;

  if (isNative) {
    nativeHandle = Network.addListener('networkStatusChange', (status) => {
      listener(status.connected);
    });
    unsubscribe = () => {
      nativeHandle?.then((h) => h.remove()).catch(() => {});
    };
  } else if (typeof window !== 'undefined') {
    const onlineHandler = () => listener(true);
    const offlineHandler = () => listener(false);

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    unsubscribe = () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }

  return () => unsubscribe?.();
}
