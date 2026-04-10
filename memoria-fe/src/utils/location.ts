import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// 1. Request Permission (Android requires explicit runtime permissions)
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // iOS is handled automatically by the Geolocation library config
    return true; 
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Memoria needs access to your location to tag your memories.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

// 2. Fetch the Coordinates
export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  const hasPermission = await requestLocationPermission();
  
  if (!hasPermission) {
    console.log('Location permission denied');
    return null;
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error fetching location:', error.message);
        resolve(null); // Resolve to null instead of throwing, so the app doesn't crash if GPS fails
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};