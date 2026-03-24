package com.yourcompany.saf;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name = "Saf")
public class SafPlugin extends Plugin {

    private static final int REQUEST_CODE = 1001;
    private PluginCall savedCall;

    @PluginMethod
    public void pickDirectory(PluginCall call) {
        savedCall = call;

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
            Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );

        startActivityForResult(call, intent, REQUEST_CODE);
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_CODE && resultCode == Activity.RESULT_OK && data != null) {

            Uri uri = data.getData();

            getContext().getContentResolver().takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );

            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());

            savedCall.resolve(ret);
        } else {
            savedCall.reject("No se seleccionó carpeta");
        }
    }
}