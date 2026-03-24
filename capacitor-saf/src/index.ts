import { registerPlugin } from '@capacitor/core';

import type { SafPlugin } from './definitions';

const Saf = registerPlugin<SafPlugin>('Saf', {
  web: () => import('./web').then((m) => new m.SafWeb()),
});

export * from './definitions';
export { Saf };
