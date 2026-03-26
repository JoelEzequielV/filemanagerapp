import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonIcon,
  IonSpinner
} from '@ionic/react';

import {
  folderOutline,
  documentOutline,
  arrowBackOutline,
  folderOpenOutline
} from 'ionicons/icons';

import { useState } from 'react';
import { pickDirectory, listFiles } from '../services/safService';
import type { FileItem, FolderResponse } from '../types/file';

const Home: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string>('root');
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFolder = async (uri: string, pushHistory = true) => {
    try {
      setLoading(true);

      const result: FolderResponse = await listFiles(uri);

      if (pushHistory && currentUri) {
        setHistory((prev) => [...prev, currentUri]);
      }

      setFiles(result.files);
      setCurrentUri(result.currentUri);
      setCurrentName(result.currentName || 'Carpeta');
    } catch (error) {
      console.error('Error cargando carpeta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickDirectory = async () => {
    try {
      setLoading(true);
      const result = await pickDirectory();

      setHistory([]);
      await loadFolder(result.uri, false);
    } catch (error) {
      console.error('Error SAF:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = async () => {
    if (history.length === 0) return;

    const previousUri = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    try {
      setLoading(true);

      const result: FolderResponse = await listFiles(previousUri);

      setFiles(result.files);
      setCurrentUri(result.currentUri);
      setCurrentName(result.currentName || 'Carpeta');
      setHistory(newHistory);
    } catch (error) {
      console.error('Error volviendo atrás:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = async (item: FileItem) => {
    if (item.type === 'directory') {
      await loadFolder(item.uri, true);
    } else {
      console.log('Archivo seleccionado:', item);
      // después acá vamos a abrir archivos reales
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>File Manager Pro</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <IonButton onClick={handlePickDirectory}>
            Elegir carpeta real
          </IonButton>

          <IonButton
            color="medium"
            fill="outline"
            onClick={goBack}
            disabled={history.length === 0 || loading}
          >
            <IonIcon icon={arrowBackOutline} slot="start" />
            Volver
          </IonButton>
        </div>

        <IonText color="medium">
          <p><strong>Ruta actual:</strong> {currentName}</p>
        </IonText>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <IonSpinner name="crescent" />
            <p>Cargando...</p>
          </div>
        )}

        {!loading && files.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <IonIcon icon={folderOpenOutline} style={{ fontSize: '64px', opacity: 0.5 }} />
            <p>No hay archivos</p>
          </div>
        )}

        {!loading && files.length > 0 && (
          <IonList>
            {files.map((item, index) => (
              <IonItem
                key={index}
                button
                detail
                onClick={() => handleOpenItem(item)}
              >
                <IonIcon
                  icon={item.type === 'directory' ? folderOutline : documentOutline}
                  slot="start"
                />
                <IonLabel>
                  <h2>{item.name}</h2>
                  <p>{item.type === 'directory' ? 'Carpeta' : 'Archivo'}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;