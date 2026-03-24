import { registerPlugin } from '@capacitor/core';

const Saf = registerPlugin<any>('Saf');

export const pickDirectory = async () => {
  return await Saf.pickDirectory();
};

export const listFiles = async (uri: string) => {
  const result = await Saf.listFiles({ uri });
  return result.files;
};