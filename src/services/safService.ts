import { registerPlugin } from '@capacitor/core';

const Saf = registerPlugin<any>('Saf');

export const pickDirectory = async () => {
  return await Saf.pickDirectory();
};