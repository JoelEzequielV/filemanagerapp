import { WebPlugin } from '@capacitor/core';

import type { SafPlugin } from './definitions';

export class SafWeb extends WebPlugin implements SafPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
