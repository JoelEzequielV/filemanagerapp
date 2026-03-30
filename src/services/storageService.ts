import { Preferences } from '@capacitor/preferences';

const LAST_FOLDER_KEY = 'lastFolderUri';

export const saveLastFolderUri = async (uri: string) => {
  await Preferences.set({
    key: LAST_FOLDER_KEY,
    value: uri,
  });
};

export const getLastFolderUri = async (): Promise<string | null> => {
  const { value } = await Preferences.get({ key: LAST_FOLDER_KEY });
  return value || null;
};

export const clearLastFolderUri = async () => {
  await Preferences.remove({ key: LAST_FOLDER_KEY });
};