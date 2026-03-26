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
  folderOpenOutline,
  imageOutline,
  videocamOutline,
  musicalNotesOutline,
  codeSlashOutline,
  documentTextOutline
} from 'ionicons/icons';

import { formatBytes, formatDate } from '../utils/fileFormat';
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

      const sortedFiles = [...result.files].sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
      
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      });
      
      setFiles(sortedFiles);
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

      const sortedFiles = [...result.files].sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
      
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      });
      
      setFiles(sortedFiles);
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
      console.log('Archivo seleccionado:', {
        name: item.name,
        uri: item.uri,
        size: item.size,
        lastModified: item.lastModified
      });
    }
  };

  const getFileIcon = (item: FileItem) => {
    if (item.type === 'directory') return folderOutline;
  
    const ext = item.name?.split('.').pop()?.toLowerCase();
  
    if (!ext) return documentOutline;
  
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return imageOutline;
    if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return videocamOutline;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return musicalNotesOutline;
    if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'java', 'kt', 'xml'].includes(ext)) return codeSlashOutline;
    if (['txt', 'pdf', 'doc', 'docx'].includes(ext)) return documentTextOutline;
  
    return documentOutline;
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
          <p style={{ marginBottom: '6px' }}>
            <strong>Carpeta actual:</strong> {currentName}
          </p>
          <p style={{ fontSize: '13px', opacity: 0.8 }}>
            {files.length} elemento(s)
          </p>
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
                  icon={getFileIcon(item)}
                  slot="start"
                  style={{ fontSize: '24px' }}
                />
                <IonLabel>
                  <h2 style={{ fontWeight: 600 }}>{item.name}</h2>
                  <p style={{ fontSize: '13px', opacity: 0.8 }}>
                    {item.type === 'directory'
                      ? 'Carpeta'
                      : `${formatBytes(item.size)} • ${formatDate(item.lastModified)}`}
                  </p>
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