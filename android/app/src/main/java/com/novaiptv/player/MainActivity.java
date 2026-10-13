package com.novaiptv.player;

import android.os.Bundle;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Intercept back button on Android TV remote to prevent the OS from closing the app
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', {'key':'Escape', 'keyCode':27}));", 
                    null
                );
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }
}
