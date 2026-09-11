
import { Platform } from 'react-native';

// Central API configuration
// Laravel backend
// Physical Android device and other devices use the PC LAN IP.
// Laravel is running on port 8081.

export const API_BASE_URL = 'http://192.168.1.229:8081/api/v1';

export const SERVER_BASE_URL = API_BASE_URL.replace('/api/v1', '');

