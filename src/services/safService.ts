import { registerPlugin } from '@capacitor/core';

const Saf = registerPlugin<any>('Saf');

export const pickDirectory = async () => {
  try {
    const result = await Saf.pickDirectory();
    console.log("URI:", result.uri);
    return result.uri;
  } catch (err) {
    console.error("Error SAF:", err);
    return null;
  }
};