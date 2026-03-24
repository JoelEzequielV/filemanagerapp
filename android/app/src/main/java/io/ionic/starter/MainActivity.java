package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
/* import com.yourcompany.saf.SafPlugin;  */
import io.ionic.starter.SafPlugin; 

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 🔥 REGISTRO MANUAL FORZADO
        registerPlugin(SafPlugin.class);
    }
}