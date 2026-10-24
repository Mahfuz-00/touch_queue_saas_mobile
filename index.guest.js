/**
 * Guest app entry.
 *
 * Built as its own APK (application id com.touchqueue.guest). The component name
 * must stay TouchQueueMobile because the native MainActivity registers that name.
 */
import './global.css';

import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import GuestApp from './src/AppGuest';

AppRegistry.registerComponent(appName, () => GuestApp);
