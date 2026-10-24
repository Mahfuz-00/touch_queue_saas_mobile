/**
 * Staff/admin app entry.
 *
 * Built as its own APK (application id com.touchqueue.staff). The component name
 * must stay TouchQueueMobile because the native MainActivity registers that name.
 */
import './global.css';

import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import StaffApp from './src/AppStaff';

AppRegistry.registerComponent(appName, () => StaffApp);
