package com.gophisb.houd11;

import android.app.Activity;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.mapsforge.map.android.graphics.AndroidGraphicFactory;
import org.mapsforge.map.android.util.AndroidUtil;
import org.mapsforge.map.android.view.MapView;
import org.mapsforge.map.datastore.MapDataStore;
import org.mapsforge.map.layer.cache.TileCache;
import org.mapsforge.map.layer.renderer.TileRendererLayer;
import org.mapsforge.map.reader.MapFile;
import org.mapsforge.map.rendertheme.internal.MapsforgeThemes;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class MosqueMapActivity extends Activity {
    private static final String MAP_URL =
            "https://data.bbbike.org/osm/mapsforge/region/africa/algeria/algeria.osm.mapsforge-osm.zip";
    private static final String MAP_NAME = "algeria.map";

    private MapView mapView;
    private TileRendererLayer tileRendererLayer;
    private MapDataStore mapDataStore;
    private TextView status;
    private Button action;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        AndroidGraphicFactory.createInstance(getApplication());
        showMapOrDownload();
    }

    private File mapFile() {
        File dir = new File(getExternalFilesDir(null), "maps");
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, MAP_NAME);
    }

    private void showMapOrDownload() {
        File file = mapFile();
        if (file.isFile() && file.length() > 1024 * 1024) {
            loadMap(file);
            return;
        }

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(32, 32, 32, 32);

        TextView title = new TextView(this);
        title.setText("خريطة الجزائر Offline");
        title.setTextSize(22);
        title.setGravity(Gravity.CENTER);

        status = new TextView(this);
        status.setText("الخريطة غير مثبتة. التنزيل الأول يحتاج إنترنت ومساحة تخزين كافية.");
        status.setGravity(Gravity.CENTER);
        status.setPadding(0, 24, 0, 24);

        action = new Button(this);
        action.setText("تنزيل خريطة الجزائر");
        action.setOnClickListener(v -> downloadMap());

        root.addView(title);
        root.addView(status);
        root.addView(action);
        setContentView(root);
    }

    private void downloadMap() {
        action.setEnabled(false);
        status.setText("بدء تنزيل خريطة الجزائر...");

        executor.execute(() -> {
            File temp = new File(mapFile().getParentFile(), MAP_NAME + ".part");
            HttpURLConnection connection = null;
            try {
                URL url = new URL(MAP_URL);
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(20000);
                connection.setReadTimeout(60000);
                connection.setInstanceFollowRedirects(true);
                connection.connect();

                int code = connection.getResponseCode();
                if (code < 200 || code >= 300) {
                    throw new IllegalStateException("HTTP " + code);
                }

                long total = connection.getContentLengthLong();
                long done = 0;
                boolean extracted = false;

                try (InputStream raw = new BufferedInputStream(connection.getInputStream(), 1024 * 1024);
                     ZipInputStream zip = new ZipInputStream(raw)) {
                    ZipEntry entry;
                    while ((entry = zip.getNextEntry()) != null) {
                        if (entry.isDirectory()) continue;
                        String name = entry.getName().replace('\\', '/');
                        if (!name.toLowerCase(Locale.ROOT).endsWith(".map")) {
                            continue;
                        }

                        File parent = temp.getParentFile();
                        if (!entry.getName().equals(new File(entry.getName()).getName())) {
                            throw new SecurityException("unsafe map archive entry");
                        }

                        try (BufferedOutputStream out =
                                     new BufferedOutputStream(new FileOutputStream(temp), 1024 * 1024)) {
                            byte[] buffer = new byte[1024 * 1024];
                            int n;
                            while ((n = zip.read(buffer)) != -1) {
                                out.write(buffer, 0, n);
                                done += n;
                                long current = done;
                                runOnUiThread(() -> {
                                    if (total > 0) {
                                        int pct = (int) Math.min(99, current * 100L / total);
                                        status.setText("تنزيل الخريطة: " + pct + "%");
                                    } else {
                                        status.setText(String.format(Locale.ROOT,
                                                "تنزيل الخريطة: %.1f MB", current / 1048576.0));
                                    }
                                });
                            }
                        }
                        extracted = true;
                        break;
                    }
                }

                if (!extracted || !temp.isFile() || temp.length() < 1024 * 1024) {
                    throw new IllegalStateException("map file missing or incomplete");
                }

                File target = mapFile();
                if (target.exists() && !target.delete()) {
                    throw new IllegalStateException("cannot replace old map");
                }
                if (!temp.renameTo(target)) {
                    throw new IllegalStateException("cannot finalize map");
                }

                runOnUiThread(() -> {
                    status.setText("اكتمل تنزيل الخريطة. جاري فتحها...");
                    loadMap(target);
                });
            } catch (Exception e) {
                temp.delete();
                runOnUiThread(() -> {
                    action.setEnabled(true);
                    status.setText("فشل تنزيل الخريطة: " + e.getMessage());
                });
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    private void loadMap(File file) {
        try {
            mapView = new MapView(this);
            mapView.getMapScaleBar().setVisible(true);
            mapView.setBuiltInZoomControls(true);
            setContentView(mapView);

            TileCache tileCache = AndroidUtil.createTileCache(
                    this,
                    "mosque-map-cache",
                    mapView.getModel().displayModel.getTileSize(),
                    1f,
                    mapView.getModel().frameBufferModel.getOverdrawFactor()
            );

            mapDataStore = new MapFile(file, "ar");
            tileRendererLayer = AndroidUtil.createTileRendererLayer(
                    tileCache,
                    mapView.getModel().mapViewPosition,
                    mapDataStore,
                    MapsforgeThemes.DEFAULT,
                    false,
                    true,
                    false
            );

            mapView.getLayerManager().getLayers().add(tileRendererLayer);
            mapView.setCenter(mapDataStore.startPosition());
            mapView.setZoomLevel(mapDataStore.startZoomLevel());
        } catch (Exception e) {
            showMapError("تعذر فتح خريطة الجزائر: " + e.getMessage());
        }
    }

    private void showMapError(String message) {
        TextView error = new TextView(this);
        error.setText(message);
        error.setGravity(Gravity.CENTER);
        error.setPadding(32, 32, 32, 32);
        setContentView(error);
    }

    @Override protected void onDestroy() {
        executor.shutdownNow();
        if (mapDataStore != null) mapDataStore.close();
        if (mapView != null) mapView.destroyAll();
        AndroidGraphicFactory.clearResourceMemoryCache();
        super.onDestroy();
    }
}
