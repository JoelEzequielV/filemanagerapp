package io.ionic.starter;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Saf")
public class SafPlugin extends Plugin {

    private PluginCall savedCall;

    @Override
    public void load() {
        super.load();
        android.util.Log.d("SAF", "PLUGIN CARGADO");
    }

    @PluginMethod
    public void pickDirectory(PluginCall call) {
        android.util.Log.d("SAF", "CLICK RECIBIDO");

        savedCall = call;

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
            Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );

        getActivity().startActivityForResult(intent, 9999);
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        if (requestCode != 9999 || savedCall == null) return;

        if (resultCode == Activity.RESULT_OK && data != null) {
            Uri uri = data.getData();

            if (uri != null) {
                try {
                    getContext().getContentResolver().takePersistableUriPermission(
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                    );

                    JSObject ret = new JSObject();
                    ret.put("uri", uri.toString());

                    savedCall.resolve(ret);
                } catch (Exception e) {
                    savedCall.reject("Error al guardar permisos: " + e.getMessage());
                }
            } else {
                savedCall.reject("No se pudo obtener la URI");
            }
        } else {
            savedCall.reject("No se seleccionó carpeta");
        }

        savedCall = null;
    }

    @PluginMethod
    public void listFiles(PluginCall call) {
        String uriString = call.getString("uri");

        if (uriString == null) {
            call.reject("URI requerido");
            return;
        }

        Uri uri = Uri.parse(uriString);

        DocumentFile dir = DocumentFile.fromTreeUri(getContext(), uri);

        if (dir == null || !dir.isDirectory()) {
            dir = DocumentFile.fromSingleUri(getContext(), uri);
        }

        if (dir == null || !dir.isDirectory()) {
            call.reject("No es un directorio válido");
            return;
        }

        JSArray filesArray = new JSArray();

        for (DocumentFile file : dir.listFiles()) {
            JSObject obj = new JSObject();
            obj.put("name", file.getName());
            obj.put("uri", file.getUri().toString());
            obj.put("type", file.isDirectory() ? "directory" : "file");
            obj.put("size", file.isFile() ? file.length() : 0);
            obj.put("lastModified", file.lastModified());

            filesArray.put(obj);
        }

        JSObject result = new JSObject();
        result.put("currentName", dir.getName());
        result.put("currentUri", uri.toString());
        result.put("files", filesArray);

        call.resolve(result);
    }
}