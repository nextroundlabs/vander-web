import { registerRootComponent } from 'expo';

import App from './App';

if (typeof document !== 'undefined') {
  require('./assets/global.css');
}

registerRootComponent(App);
