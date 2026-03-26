import { registerPlugin } from '@capacitor/core';
import type { FileItem, FolderResponse } from '../types/file';

interface SafPlugin {
  pickDirectory(): Promise<{ uri: string }>;
  listFiles(options: { uri: string }): Promise<FolderResponse>;
  openFile(options: { uri: string; mimeType: string }): Promise<void>;
}

const Saf = registerPlugin<SafPlugin>('Saf');

export const pickDirectory = async () => {
  return await Saf.pickDirectory();
};

export const listFiles = async (uri: string): Promise<FolderResponse> => {
  return await Saf.listFiles({ uri });
};

export const openFile = async (uri: string, mimeType: string) => {
  return await Saf.openFile({ uri, mimeType });
};