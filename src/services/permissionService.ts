import { Filesystem } from "@capacitor/filesystem";

export const requestStoragePermissions = async () => {
  try {
    const status = await Filesystem.requestPermissions();

    console.log("Permisos:", status);

    if (status.publicStorage !== "granted") {
      throw new Error("Permiso de almacenamiento denegado");
    }

    return true;
  } catch (error) {
    console.error("Error pidiendo permisos:", error);
    return false;
  }
};