package io.ionic.starter;

import android.app.Activity;
import android.content.Intent;
import android.content.UriPermission;
import android.net.Uri;
import android.util.Log;
import android.webkit.MimeTypeMap;

import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "Saf")
public class SafPlugin extends Plugin {

    private static final String TAG = "SAF";
    private static final int PICK_DIR_REQUEST = 9999;

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "PLUGIN CARGADO");
    }

    @PluginMethod
    public void pickDirectory(PluginCall call) {
        Log.d(TAG, "pickDirectory() invocado");

        Activity activity = getActivity();

        if (activity == null) {
            call.reject("Activity no disponible");
            return;
        }

        // Guardamos correctamente la llamada en Capacitor
        saveCall(call);

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
            Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );

        try {
            activity.startActivityForResult(intent, PICK_DIR_REQUEST);
            Log.d(TAG, "Selector de carpeta lanzado");
        } catch (Exception e) {
            Log.e(TAG, "Error lanzando selector: " + e.getMessage(), e);
            call.reject("No se pudo abrir el selector: " + e.getMessage());
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        Log.d(TAG, "handleOnActivityResult ejecutado");
        Log.d(TAG, "requestCode=" + requestCode + ", resultCode=" + resultCode);

        if (requestCode != PICK_DIR_REQUEST) return;

       
        PluginCall savedCall = getSavedCall();

        if (savedCall == null) {
            Log.e(TAG, "No hay llamada guardada");
            return;
        }

        if (resultCode != Activity.RESULT_OK) {
            Log.e(TAG, "Usuario canceló la selección");
            savedCall.reject("No se seleccionó carpeta");
            saveCall(null);
            return;
        }

        if (data == null) {
            Log.e(TAG, "Intent data vino null");
            savedCall.reject("Android no devolvió datos");
            saveCall(null);
            return;
        }

        Uri uri = data.getData();

        if (uri == null) {
            Log.e(TAG, "La URI vino null");
            savedCall.reject("No se pudo obtener la URI");
            saveCall(null);
            return;
        }

        try {
            Log.d(TAG, "URI RECIBIDA: " + uri);

            final int takeFlags =
                (data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION));

            getActivity().getContentResolver().takePersistableUriPermission(uri, takeFlags);

            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());

            savedCall.resolve(ret);

        } catch (Exception e) {
            savedCall.reject("Error: " + e.getMessage());
        }

        saveCall(null);

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