import {
  IonPage,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonSpinner,
  IonText
} from "@ionic/react";

import { useEffect, useState } from "react";
import { readDirectory, FileItem } from "../services/fileService";
import { requestStoragePermissions } from "../services/permissionService";

const Home: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [path, setPath] = useState("storage/emulated/0");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (p: string) => {
    try {
      setLoading(true);
      setError("");

      const data = await readDirectory(p);

      setFiles(data);
      setPath(p);
    } catch (err) {
      console.error(err);
      setError("Error cargando archivos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const granted = await requestStoragePermissions();

      if (!granted) {
        setError("Permiso de almacenamiento requerido");
        setLoading(false);
        return;
      }

      await load("storage/emulated/0");
    };

    init();
  }, []);

  const openFolder = (p: string) => {
    load(p);
  };

  const goBack = () => {
    const parts = path.split("/");
    parts.pop();
    const newPath = parts.join("/");
    load(newPath);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>File Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        <IonButton onClick={goBack}>Volver</IonButton>

        {/* ⏳ LOADING */}
        {loading && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <IonSpinner />
            <p>Cargando archivos...</p>
          </div>
        )}

        {/* ❌ ERROR */}
        {error && (
          <IonText color="danger">
            <p style={{ textAlign: "center" }}>{error}</p>
          </IonText>
        )}

        {/* 📂 LISTA */}
        {!loading && !error && (
          <>
            {files.length === 0 ? (
              <p>No hay archivos</p>
            ) : (
              files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #ccc",
                    cursor: "pointer"
                  }}
                  onClick={() =>
                    f.type === "directory" && openFolder(f.path)
                  }
                >
                  {f.type === "directory" ? "📁" : "📄"} {f.name}
                </div>
              ))
            )}
          </>
        )}

      </IonContent>
    </IonPage>
  );
};

export default Home;