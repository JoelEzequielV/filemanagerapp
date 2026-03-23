import { Filesystem } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
}

export const readDirectory = async (path: string = ""): Promise<FileItem[]> => {
  try {
    if (Capacitor.getPlatform() === "web") {
      return [
        { name: "Demo", path: "demo", type: "directory" },
      ];
    }

    const basePath = path || "storage/emulated/0";

    const result = await Filesystem.readdir({
      path: basePath,
    });

    return result.files.map((file: any) => ({
      name: file.name,
      path: `${basePath}/${file.name}`,
      type: file.type === "directory" ? "directory" : "file",
    }));
  } catch (error) {
    console.error("ERROR REAL:");
    console.error(error);
    return [];
  }
};