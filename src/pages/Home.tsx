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
  IonSpinner,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
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
import { getMimeType } from '../utils/mime';
import { useEffect, useState } from 'react';
import { pickDirectory, listFiles, openFile } from '../services/safService';
import type { FileItem, FolderResponse } from '../types/file';

const Home: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [search, setSearch] = useState('');
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string>('root');
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortFiles = (
    items: FileItem[],
    criteria: 'name' | 'date' | 'size' = sortBy,
    order: 'asc' | 'desc' = sortOrder
  ) => {
    return [...items].sort((a, b) => {
      // Carpetas siempre primero
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;

      let comparison = 0;

      if (criteria === 'name') {
        comparison = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      }

      if (criteria === 'date') {
        comparison = a.lastModified - b.lastModified;
      }

      if (criteria === 'size') {
        comparison = a.size - b.size;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  };

  const applyFiltersAndSort = (items: FileItem[], term: string = search) => {
    let filtered = [...items];
    const searchTerm = term.trim().toLowerCase();

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm)
      );
    }

    return sortFiles(filtered, sortBy, sortOrder);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setFiles(applyFiltersAndSort(allFiles, value));
  };

  const loadFolder = async (uri: string, pushHistory = true) => {
    try {
      setLoading(true);

      const result: FolderResponse = await listFiles(uri);

      if (pushHistory && currentUri) {
        setHistory((prev) => [...prev, currentUri]);
      }

      const baseFiles = [...result.files];

      setAllFiles(baseFiles);
      setSearch('');
      setFiles(sortFiles(baseFiles, sortBy, sortOrder));
      setCurrentUri(result.currentUri);
      setCurrentName(result.currentName || 'Carpeta');
    } catch (error) {
      console.error('Error cargando carpeta:', error);
      alert('No se pudo cargar la carpeta');
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
      alert('No se pudo seleccionar la carpeta');
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
      const baseFiles = [...result.files];

      setAllFiles(baseFiles);
      setSearch('');
      setFiles(sortFiles(baseFiles, sortBy, sortOrder));
      setCurrentUri(result.currentUri);
      setCurrentName(result.currentName || 'Carpeta');
      setHistory(newHistory);
    } catch (error) {
      console.error('Error volviendo atrás:', error);
      alert('No se pudo volver a la carpeta anterior');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = async (item: FileItem) => {
    try {
      if (item.type === 'directory') {
        await loadFolder(item.uri, true);
        return;
      }

      const mimeType = getMimeType(item.name);

      await openFile(item.uri, mimeType);
    } catch (error) {
      console.error('Error al abrir elemento:', error);
      alert('No se pudo abrir este archivo en el dispositivo');
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

  useEffect(() => {
    setFiles(applyFiltersAndSort(allFiles, search));
  }, [sortBy, sortOrder]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>File Manager Pro</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <IonButton onClick={handlePickDirectory} disabled={loading}>
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
            {files.length} de {allFiles.length} elemento(s)
          </p>
        </IonText>

        <IonSearchbar
          value={search}
          onIonInput={(e) => handleSearch(e.detail.value || '')}
          placeholder="Buscar archivos o carpetas..."
          debounce={250}
          style={{ marginTop: '10px', marginBottom: '14px' }}
        />

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <IonSelect
            value={sortBy}
            placeholder="Ordenar por"
            onIonChange={(e) => setSortBy(e.detail.value)}
            interface="popover"
            style={{ minWidth: '160px' }}
          >
            <IonSelectOption value="name">Nombre</IonSelectOption>
            <IonSelectOption value="date">Fecha</IonSelectOption>
            <IonSelectOption value="size">Tamaño</IonSelectOption>
          </IonSelect>

          <IonSegment
            value={sortOrder}
            onIonChange={(e) => setSortOrder(e.detail.value)}
            style={{ flex: 1, minWidth: '180px' }}
          >
            <IonSegmentButton value="asc">
              <IonLabel>Asc</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="desc">
              <IonLabel>Desc</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <IonSpinner name="crescent" />
            <p>Cargando...</p>
          </div>
        )}

        {!loading && files.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <IonIcon icon={folderOpenOutline} style={{ fontSize: '64px', opacity: 0.5 }} />
            <p>{search ? 'No se encontraron resultados' : 'No hay archivos'}</p>
          </div>
        )}

        {!loading && files.length > 0 && (
          <IonList>
            {files.map((item, index) => (
              <IonItem
                key={`${item.uri}-${index}`}
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