package com.gophisb.houd11;

import android.Manifest;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private AlarmScheduler scheduler;
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        scheduler = new AlarmScheduler(this);
        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setAllowFileAccess(true); s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false); s.setDatabaseEnabled(true);
        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new HoudAndroidBridge(), "HoudAndroid");
        setContentView(webView); webView.loadUrl("file:///android_asset/www/index.html");
        if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1001);
    }
    private class HoudAndroidBridge {
        @JavascriptInterface public String requestPermissions() { return "{\\"display\\":\\"granted\\"}"; }
        @JavascriptInterface public String scheduleAdhan(String json) { try { scheduler.scheduleAll(new org.json.JSONArray(json)); return "true"; } catch (Exception e) { return "false"; } }
        @JavascriptInterface public String cancelAdhan() { scheduler.cancelAll(); return "true"; }
    }
}
