export const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (!ext) return '*/*';

  const map: Record<string, string> = {
    txt: 'text/plain',
    pdf: 'application/pdf',
    json: 'application/json',
    js: 'application/javascript',
    ts: 'application/typescript',
    html: 'text/html',
    css: 'text/css',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    apk: 'application/vnd.android.package-archive',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };

  return map[ext] || '*/*';
};