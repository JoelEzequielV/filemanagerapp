import { useEffect, useState } from "react";
import { readDirectory, FileItem } from "../services/fileSystemService";

export const useFiles = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFiles = async (path: string = "") => {
    setLoading(true);
    const data = await readDirectory(path);
    setFiles(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  return {
    files,
    loading,
    loadFiles,
  };
};