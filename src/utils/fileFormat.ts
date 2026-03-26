export const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '—';
  
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  export const formatDate = (timestamp: number): string => {
    if (!timestamp || timestamp <= 0) return '—';
  
    return new Date(timestamp).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };