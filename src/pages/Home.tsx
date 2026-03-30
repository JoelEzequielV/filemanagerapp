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
  IonButtons,
  IonActionSheet,
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
  documentTextOutline,
  ellipsisVertical,
  openOutline,
  informationCircleOutline,
  copyOutline,
  closeOutline
} from 'ionicons/icons';

import { formatBytes, formatDate } from '../utils/fileFormat';
import { getMimeType } from '../utils/mime';
import { useEffect, useState } from 'react';
import { pickDirectory, listFiles, openFile } from '../services/safService';
import { saveLastFolderUri, getLastFolderUri, clearLastFolderUri } from '../services/storageService';
import type { FileItem, FolderResponse } from '../types/file';

const Home: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [search, setSearch] = useState('');

  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string>('Sin carpeta seleccionada');
  const [history, setHistory] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    console.log('Plugins disponibles:', (window as any).Capacitor?.Plugins);
  }, []);

  const sortFiles = (
    items: FileItem[],
    criteria: 'name' | 'date' | 'size' = sortBy,
    order: 'asc' | 'desc' = sortOrder
  ) => {
    return [...items].sort((a, b) => {
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
        item.name?.toLowerCase().includes(searchTerm)
      );
    }

    return sortFiles(filtered, sortBy, sortOrder);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setFiles(applyFiltersAndSort(allFiles, value));
  };

  const applyFolderToState = (result: FolderResponse) => {
    const baseFiles = [...result.files];

    setAllFiles(baseFiles);
    setSearch('');
    setFiles(sortFiles(baseFiles, sortBy, sortOrder));
    setCurrentUri(result.currentUri);
    setCurrentName(result.currentName || 'Carpeta');
  };

  const loadFolder = async (uri: string, pushHistory = true, persist = true) => {
    try {
      console.log('📂 loadFolder() =>', uri);
      setLoading(true);

      const result: FolderResponse = await listFiles(uri);
      console.log('📂 Resultado listFiles():', result);

      if (pushHistory && currentUri && currentUri !== uri) {
        setHistory((prev) => [...prev, currentUri]);
      }

      applyFolderToState(result);

      if (persist) {
        await saveLastFolderUri(result.currentUri);
      }
    } catch (error: any) {
      console.error('❌ Error cargando carpeta:', error);
      alert(error?.message || 'No se pudo cargar la carpeta');
    } finally {
      setLoading(false);
    }
  };

  const handlePickDirectory = async () => {
    try {
      console.log('📁 Iniciando selección de carpeta...');
      setLoading(true);

      const result = await pickDirectory();
      console.log('✅ Carpeta seleccionada:', result);

      if (!result?.uri) {
        throw new Error('No se recibió URI de carpeta');
      }

      const folder = await listFiles(result.uri);
      console.log('📂 Resultado listFiles:', folder);

      applyFolderToState(folder);
      setHistory([]);

      await saveLastFolderUri(folder.currentUri);
    } catch (error: any) {
      console.error('❌ Error al seleccionar carpeta:', error);
      alert(error?.message || 'No se pudo abrir la carpeta');
    } finally {
      setLoading(false);
    }
  };

  const goBack = async () => {
    if (history.length === 0) return;

    const previousUri = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    try {
      console.log('⬅️ Volviendo a:', previousUri);
      setLoading(true);

      const result: FolderResponse = await listFiles(previousUri);
      console.log('📂 Resultado volver atrás:', result);

      applyFolderToState(result);
      setHistory(newHistory);

      await saveLastFolderUri(result.currentUri);
    } catch (error: any) {
      console.error('❌ Error volviendo atrás:', error);
      alert(error?.message || 'No se pudo volver a la carpeta anterior');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = async (item: FileItem) => {
    try {
      if (item.type === 'directory') {
        await loadFolder(item.uri, true, true);
        return;
      }

      const mimeType = item.mimeType || getMimeType(item.name);
      console.log('📄 Abriendo archivo:', item.name, mimeType);

      await openFile(item.uri, mimeType);
    } catch (error: any) {
      console.error('❌ Error al abrir elemento:', error);
      alert(error?.message || 'No se pudo abrir este archivo en el dispositivo');
    }
  };

  const handleShowOptions = (item: FileItem) => {
    setSelectedItem(item);
    setShowActionSheet(true);
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copiado`);
    } catch (error) {
      console.error('Error copiando:', error);
      alert(`No se pudo copiar ${label.toLowerCase()}`);
    }
  };

  const handleShowDetails = (item: FileItem) => {
    alert(
      `Nombre: ${item.name}\n` +
      `Tipo: ${item.type === 'directory' ? 'Carpeta' : 'Archivo'}\n` +
      `Tamaño: ${item.type === 'directory' ? '-' : formatBytes(item.size)}\n` +
      `Fecha: ${formatDate(item.lastModified)}\n` +
      `URI: ${item.uri}\n` +
      `MIME: ${item.mimeType || getMimeType(item.name)}`
    );
  };

  const getFileIcon = (item: FileItem) => {
    if (item.type === 'directory') return folderOutline;

    const ext = item.name?.split('.').pop()?.toLowerCase();

    if (!ext) return documentOutline;

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return imageOutline;
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return videocamOutline;
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return musicalNotesOutline;
    if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'java', 'kt', 'xml', 'php', 'sql'].includes(ext)) return codeSlashOutline;
    if (['txt', 'pdf', 'doc', 'docx', 'odt', 'rtf'].includes(ext)) return documentTextOutline;

    return documentOutline;
  };

  useEffect(() => {
    setFiles(applyFiltersAndSort(allFiles, search));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  useEffect(() => {
    const restoreLastFolder = async () => {
      try {
        console.log('🔄 Restaurando última carpeta...');
        const lastUri = await getLastFolderUri();

        if (!lastUri) {
          console.log('ℹ️ No hay carpeta guardada');
          return;
        }

        console.log('📁 Última carpeta encontrada:', lastUri);

        const folder = await listFiles(lastUri);
        console.log('✅ Carpeta restaurada:', folder);

        applyFolderToState(folder);
        setHistory([]);
      } catch (error) {
        console.warn('⚠️ No se pudo restaurar la última carpeta:', error);
        await clearLastFolderUri();
      } finally {
        setInitializing(false);
      }
    };

    restoreLastFolder();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>File Manager Pro</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <IonButton onClick={handlePickDirectory} disabled={loading || initializing}>
            Elegir carpeta real
          </IonButton>

          <IonButton
            color="medium"
            fill="outline"
            onClick={goBack}
            disabled={history.length === 0 || loading || initializing}
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
          disabled={initializing}
        />

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <IonSelect
            value={sortBy}
            placeholder="Ordenar por"
            onIonChange={(e) => setSortBy(e.detail.value)}
            interface="popover"
            style={{ minWidth: '160px' }}
            disabled={initializing}
          >
            <IonSelectOption value="name">Nombre</IonSelectOption>
            <IonSelectOption value="date">Fecha</IonSelectOption>
            <IonSelectOption value="size">Tamaño</IonSelectOption>
          </IonSelect>

          <IonSegment
            value={sortOrder}
            onIonChange={(e) => setSortOrder(e.detail.value)}
            style={{ flex: 1, minWidth: '180px' }}
            disabled={initializing}
          >
            <IonSegmentButton value="asc">
              <IonLabel>Asc</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="desc">
              <IonLabel>Desc</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {(loading || initializing) && (
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <IonSpinner name="crescent" />
            <p>{initializing ? 'Restaurando carpeta...' : 'Cargando...'}</p>
          </div>
        )}

        {!loading && !initializing && files.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <IonIcon icon={folderOpenOutline} style={{ fontSize: '64px', opacity: 0.5 }} />
            <p>{search ? 'No se encontraron resultados' : 'No hay archivos'}</p>
          </div>
        )}

        {!loading && !initializing && files.length > 0 && (
          <IonList>
            {files.map((item, index) => (
              <IonItem
                key={`${item.uri}-${index}`}
                button
                detail={false}
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

                <IonButtons slot="end">
                  <IonButton
                    fill="clear"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowOptions(item);
                    }}
                  >
                    <IonIcon icon={ellipsisVertical} />
                  </IonButton>
                </IonButtons>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={selectedItem?.name || 'Opciones'}
          buttons={[
            {
              text: 'Abrir',
              icon: openOutline,
              handler: async () => {
                if (selectedItem) {
                  await handleOpenItem(selectedItem);
                }
              }
            },
            {
              text: 'Ver detalles',
              icon: informationCircleOutline,
              handler: () => {
                if (selectedItem) {
                  handleShowDetails(selectedItem);
                }
              }
            },
            {
              text: 'Copiar nombre',
              icon: copyOutline,
              handler: async () => {
                if (selectedItem) {
                  await handleCopyText(selectedItem.name, 'Nombre');
                }
              }
            },
            {
              text: 'Copiar URI',
              icon: copyOutline,
              handler: async () => {
                if (selectedItem) {
                  await handleCopyText(selectedItem.uri, 'URI');
                }
              }
            },
            {
              text: 'Cancelar',
              role: 'cancel',
              icon: closeOutline
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;