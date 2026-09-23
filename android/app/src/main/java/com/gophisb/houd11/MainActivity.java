package com.gophisb.houd11;

import android.Manifest;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;

public class MainActivity extends Activity {
    private WebView webView;
    private AlarmScheduler scheduler;
    private WebViewAssetLoader assetLoader;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        scheduler = new AlarmScheduler(this);

        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
            @Override
            @SuppressWarnings("deprecation")
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return assetLoader.shouldInterceptRequest(android.net.Uri.parse(url));
            }
        });
        webView.addJavascriptInterface(new HoudAndroidBridge(), "HoudAndroid");
        setContentView(webView);
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");

        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1001);
        }
    }

    private class HoudAndroidBridge {
        @JavascriptInterface public String requestPermissions() {
            return Build.VERSION.SDK_INT >= 33
                    ? "{\"display\":\"granted\"}"
                    : "{\"display\":\"granted\"}";
        }
        @JavascriptInterface public String scheduleAdhan(String json) {
            try { scheduler.scheduleAll(new JSONArray(json)); return "true"; }
            catch (Exception e) { return "false"; }
        }
        @JavascriptInterface public String cancelAdhan() {
            scheduler.cancelAll(); return "true";
        }
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
