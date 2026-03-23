import { Filesystem, Directory } from "@capacitor/filesystem";

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
}

export const readDirectory = async (path: string = ""): Promise<FileItem[]> => {
  try {
    const result = await Filesystem.readdir({
      path,
      directory: Directory.Documents,
    });

    return result.files.map((file: any) => ({
      name: file.name,
      path: file.uri,
      type: file.type === "directory" ? "directory" : "file",
    }));
  } catch (error) {
    console.error("Error leyendo directorio:", error);
    return [];
  }
};