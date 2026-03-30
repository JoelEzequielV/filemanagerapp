package io.ionic.starter;

import android.app.Activity;
import android.content.Intent;
import android.content.UriPermission;
import android.net.Uri;
import android.util.Base64;
import android.util.Log;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.ByteArrayOutputStream;
import java.util.List;

@CapacitorPlugin(name = "Saf")
public class SafPlugin extends Plugin {

    private static final String TAG = "SAF";

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "PLUGIN CARGADO");
    }

    @PluginMethod
    public void pickDirectory(PluginCall call) {
        Activity activity = getActivity();

        if (activity == null) {
            call.reject("Activity no disponible");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
            Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );

        try {
            startActivityForResult(call, intent, "pickDirectoryResult");
        } catch (Exception e) {
            Log.e(TAG, "Error lanzando selector: " + e.getMessage(), e);
            call.reject("No se pudo abrir el selector: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void pickDirectoryResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result == null) {
            call.reject("No se recibió resultado del selector");
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK) {
            call.reject("No se seleccionó carpeta");
            return;
        }

        Intent data = result.getData();

        if (data == null) {
            call.reject("Android no devolvió datos");
            return;
        }

        Uri uri = data.getData();

        if (uri == null) {
            call.reject("No se pudo obtener la URI");
            return;
        }

        try {
            final int takeFlags =
                data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);

            getActivity().getContentResolver().takePersistableUriPermission(uri, takeFlags);

            boolean hasPermission = hasPersistedPermission(uri);

            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            ret.put("persisted", hasPermission);

            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error al guardar permisos: " + e.getMessage(), e);
            call.reject("Error al guardar permisos: " + e.getMessage());
        }
    }

    @PluginMethod
    public void listFiles(PluginCall call) {
        String uriString = call.getString("uri");

        if (uriString == null || uriString.trim().isEmpty()) {
            call.reject("URI requerida");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);
            DocumentFile dir = DocumentFile.fromTreeUri(getContext(), uri);

            if (dir == null) {
                call.reject("No se pudo acceder al directorio");
                return;
            }

            if (!dir.exists()) {
                call.reject("La carpeta ya no existe o no es accesible");
                return;
            }

            if (!dir.isDirectory()) {
                call.reject("La URI no corresponde a una carpeta");
                return;
            }

            DocumentFile[] files = dir.listFiles();
            JSArray filesArray = new JSArray();

            for (DocumentFile file : files) {
                try {
                    JSObject obj = new JSObject();

                    String name = file.getName() != null ? file.getName() : "Sin nombre";
                    String type = file.isDirectory() ? "directory" : "file";
                    long size = file.isFile() ? file.length() : 0;
                    long lastModified = file.lastModified();
                    String mimeType = file.isFile() ? safeMime(file) : "inode/directory";

                    obj.put("name", name);
                    obj.put("uri", file.getUri().toString());
                    obj.put("type", type);
                    obj.put("size", size);
                    obj.put("lastModified", lastModified);
                    obj.put("mimeType", mimeType);

                    filesArray.put(obj);
                } catch (Exception fileError) {
                    Log.e(TAG, "Error leyendo archivo individual: " + fileError.getMessage(), fileError);
                }
            }

            JSObject result = new JSObject();
            result.put("currentName", dir.getName() != null ? dir.getName() : "Carpeta");
            result.put("currentUri", uri.toString());
            result.put("files", filesArray);
            result.put("persisted", hasPersistedPermission(uri));

            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Error en listFiles: " + e.getMessage(), e);
            call.reject("No se pudo listar la carpeta: " + e.getMessage());
        }
    }

    @PluginMethod
    public void createFolder(PluginCall call) {
        String parentUri = call.getString("parentUri");
        String folderName = call.getString("folderName");

        if (parentUri == null || parentUri.trim().isEmpty()) {
            call.reject("parentUri requerido");
            return;
        }

        if (folderName == null || folderName.trim().isEmpty()) {
            call.reject("folderName requerido");
            return;
        }

        try {
            DocumentFile parent = DocumentFile.fromTreeUri(getContext(), Uri.parse(parentUri));

            if (parent == null || !parent.exists() || !parent.isDirectory()) {
                call.reject("No se pudo acceder a la carpeta padre");
                return;
            }

            DocumentFile existing = parent.findFile(folderName);
            if (existing != null) {
                call.reject("Ya existe un archivo o carpeta con ese nombre");
                return;
            }

            DocumentFile newFolder = parent.createDirectory(folderName);

            if (newFolder == null) {
                call.reject("No se pudo crear la carpeta");
                return;
            }

            JSObject result = new JSObject();
            result.put("uri", newFolder.getUri().toString());
            result.put("name", newFolder.getName());

            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error creando carpeta: " + e.getMessage(), e);
            call.reject("No se pudo crear la carpeta: " + e.getMessage());
        }
    }

    @PluginMethod
    public void renameItem(PluginCall call) {
        String uriString = call.getString("uri");
        String newName = call.getString("newName");

        if (uriString == null || uriString.trim().isEmpty()) {
            call.reject("URI requerida");
            return;
        }

        if (newName == null || newName.trim().isEmpty()) {
            call.reject("Nuevo nombre requerido");
            return;
        }

        try {
            DocumentFile file = DocumentFile.fromSingleUri(getContext(), Uri.parse(uriString));

            if (file == null || !file.exists()) {
                call.reject("El elemento no existe");
                return;
            }

            boolean renamed = file.renameTo(newName);

            if (!renamed) {
                call.reject("No se pudo renombrar el elemento");
                return;
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("newName", newName);

            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error renombrando: " + e.getMessage(), e);
            call.reject("No se pudo renombrar: " + e.getMessage());
        }
    }

    @PluginMethod
    public void deleteItem(PluginCall call) {
        String uriString = call.getString("uri");

        if (uriString == null || uriString.trim().isEmpty()) {
            call.reject("URI requerida");
            return;
        }

        try {
            DocumentFile file = DocumentFile.fromSingleUri(getContext(), Uri.parse(uriString));

            if (file == null || !file.exists()) {
                call.reject("El elemento no existe");
                return;
            }

            boolean deleted = file.delete();

            if (!deleted) {
                call.reject("No se pudo eliminar el elemento");
                return;
            }

            JSObject result = new JSObject();
            result.put("success", true);

            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error eliminando: " + e.getMessage(), e);
            call.reject("No se pudo eliminar: " + e.getMessage());
        }
    }

    @PluginMethod
    public void readTextFile(PluginCall call) {
        String uriString = call.getString("uri");

        if (uriString == null || uriString.trim().isEmpty()) {
            call.reject("URI requerida");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);
            InputStream inputStream = getContext().getContentResolver().openInputStream(uri);

            if (inputStream == null) {
                call.reject("No se pudo abrir el archivo");
                return;
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
            StringBuilder builder = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                builder.append(line).append("\n");
            }

            reader.close();
            inputStream.close();

            JSObject result = new JSObject();
            result.put("content", builder.toString());

            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error leyendo texto: " + e.getMessage(), e);
            call.reject("No se pudo leer el archivo: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getFileBase64(PluginCall call) {
        String uriString = call.getString("uri");
        String mimeType = call.getString("mimeType", "*/*");

        if (uriString == null || uriString.trim().isEmpty()) {
            call.reject("URI requerida");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);
            InputStream inputStream = getContext().getContentResolver().openInputStream(uri);

            if (inputStream == null) {
                call.reject("No se pudo abrir el archivo");
                return;
            }

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] data = new byte[8192];
            int nRead;

            while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }

            buffer.flush();
            inputStream.close();

            String base64 = Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP);

            JSObject result = new JSObject();
            result.put("base64", base64);
            result.put("mimeType", mimeType);

            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error obteniendo base64: " + e.getMessage(), e);
            call.reject("No se pudo leer el archivo: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openFile(PluginCall call) {
        String uriString = call.getString("uri");
        String mimeType = call.getString("mimeType", "*/*");

        if (uriString == null || uriString.trim().isEmpty()) {
            call.reject("URI requerida");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Error al abrir archivo: " + e.getMessage(), e);
            call.reject("No se pudo abrir el archivo: " + e.getMessage());
        }
    }

    private boolean hasPersistedPermission(Uri uri) {
        try {
            List<UriPermission> permissions = getActivity()
                .getContentResolver()
                .getPersistedUriPermissions();

            for (UriPermission permission : permissions) {
                if (permission.getUri().toString().equals(uri.toString())) {
                    return true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error verificando permisos persistentes: " + e.getMessage(), e);
        }

        return false;
    }

    private String safeMime(DocumentFile file) {
        try {
            String mime = file.getType();
            if (mime != null && !mime.isEmpty()) return mime;

            String name = file.getName();
            if (name != null && name.contains(".")) {
                String ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
                String guessed = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                if (guessed != null) return guessed;
            }
        } catch (Exception ignored) {}

        return "*/*";
    }
}