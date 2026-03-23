package io.ionic.starter;

import com.getcapacitor.JSObject;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.DocumentsContract;

import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "Saf")
public class SafPlugin extends Plugin {

    private static final int REQUEST_CODE = 1234;

    @PluginMethod
    public void pickDirectory(PluginCall call) {
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
        if (requestCode == REQUEST_CODE && resultCode == Activity.RESULT_OK) {
            Uri uri = data.getData();

            getContext().getContentResolver().takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );

            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());

            getSavedCall().resolve(ret);
        }
    }
}