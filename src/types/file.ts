export interface FileItem {
    name: string;
    uri: string;
    type: 'file' | 'directory';
    size: number;
    lastModified: number;
  }
  
  export interface FolderResponse {
    currentName: string;
    currentUri: string;
    files: FileItem[];
  }