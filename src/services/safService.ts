import { registerPlugin } from '@capacitor/core';
import type { FileItem, FolderResponse } from '../types/file';

type PickDirectoryResult = {
  uri: string;
  persisted?: boolean;
};

type ReadTextResult = {
  content: string;
};

type Base64Result = {
  base64: string;
  mimeType: string;
};

interface SafPlugin {
  pickDirectory(): Promise<PickDirectoryResult>;
  listFiles(options: { uri: string }): Promise<FolderResponse>;
  openFile(options: { uri: string; mimeType: string }): Promise<void>;
  readTextFile(options: { uri: string }): Promise<ReadTextResult>;
  getFileBase64(options: { uri: string; mimeType: string }): Promise<Base64Result>;
}

const Saf = registerPlugin<SafPlugin>('Saf');

export const pickDirectory = async () => {
  return await Saf.pickDirectory();
};

export const listFiles = async (uri: string) => {
  return await Saf.listFiles({ uri });
};

export const openFile = async (uri: string, mimeType: string) => {
  return await Saf.openFile({ uri, mimeType });
};

export const readTextFile = async (uri: string) => {
  return await Saf.readTextFile({ uri });
};

export const getFileBase64 = async (uri: string, mimeType: string) => {
  return await Saf.getFileBase64({ uri, mimeType });
};