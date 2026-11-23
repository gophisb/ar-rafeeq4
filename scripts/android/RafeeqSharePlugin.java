package com.gophisb.arrafeeq4;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "RafeeqShare")
public class RafeeqSharePlugin extends Plugin {
    @PluginMethod
    public void share(PluginCall call) {
        String text = call.getString("text");
        if (text == null || text.trim().isEmpty()) {
            call.reject("Share text is required.");
            return;
        }

        if (getActivity() == null) {
            call.reject("The Android activity is not available.");
            return;
        }

        String title = call.getString("title");
        if (title == null || title.trim().isEmpty()) {
            title = "مشاركة الرفيق";
        }

        Intent sendIntent = new Intent(Intent.ACTION_SEND);
        sendIntent.setType("text/plain");
        sendIntent.putExtra(Intent.EXTRA_TEXT, text);
        getActivity().startActivity(Intent.createChooser(sendIntent, title));
        call.resolve();
    }
}
