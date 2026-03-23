import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
}

export const readDirectory = async (
  path: string = "",
  directory: Directory = Directory.External
): Promise<FileItem[]> => {
  try {
    if (Capacitor.getPlatform() === "web") {
      return [
        { name: "Download", path: "Download", type: "directory" },
        { name: "DCIM", path: "DCIM", type: "directory" },
        { name: "Pictures", path: "Pictures", type: "directory" },
      ];
    }

    const result = await Filesystem.readdir({
      path,
      directory,
    });

    return result.files.map((file: any) => ({
      name: file.name,
      path: path ? `${path}/${file.name}` : file.name,
      type: file.type === "directory" ? "directory" : "file",
    }));
  } catch (error) {
    console.error("Error leyendo:", error);
    return [];
  }
};