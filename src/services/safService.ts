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

type GenericResult = {
  success?: boolean;
  uri?: string;
  name?: string;
  newName?: string;
  fallbackUsed?: boolean;
};

interface SafPlugin {
  pickDirectory(): Promise<PickDirectoryResult>;
  listFiles(options: { uri: string }): Promise<FolderResponse>;
  openFile(options: { uri: string; mimeType: string }): Promise<void>;
  readTextFile(options: { uri: string }): Promise<ReadTextResult>;
  getFileBase64(options: { uri: string; mimeType: string }): Promise<Base64Result>;
  createFolder(options: { parentUri: string; folderName: string }): Promise<GenericResult>;
  renameItem(options: { uri: string; newName: string; parentUri?: string }): Promise<GenericResult>;
  deleteItem(options: { uri: string }): Promise<GenericResult>;
  duplicateItem(options: { uri: string; parentUri: string }): Promise<GenericResult>;
  copyItem(options: { uri: string; destinationUri: string }): Promise<GenericResult>;
}

const Saf = registerPlugin<SafPlugin>('Saf');

export const pickDirectory = async () => await Saf.pickDirectory();
export const listFiles = async (uri: string) => await Saf.listFiles({ uri });
export const openFile = async (uri: string, mimeType: string) => await Saf.openFile({ uri, mimeType });
export const readTextFile = async (uri: string) => await Saf.readTextFile({ uri });
export const getFileBase64 = async (uri: string, mimeType: string) => await Saf.getFileBase64({ uri, mimeType });

export const createFolder = async (parentUri: string, folderName: string) =>
  await Saf.createFolder({ parentUri, folderName });

export const renameItem = async (uri: string, newName: string, parentUri?: string) =>
  await Saf.renameItem({ uri, newName, parentUri });

export const deleteItem = async (uri: string) =>
  await Saf.deleteItem({ uri });

export const duplicateItem = async (uri: string, parentUri: string) =>
  await Saf.duplicateItem({ uri, parentUri });

export const copyItem = async (uri: string, destinationUri: string) =>
  await Saf.copyItem({ uri, destinationUri });