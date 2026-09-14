import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.vku.fieldsurvey',
  appName: 'VKU Field Survey',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['CAMERA', 'PHOTOS'],
      resultType: 'dataUrl'
    },
    Network: {
      listenForNetworkStatusChange: true
    }
  }
};

export default config;
