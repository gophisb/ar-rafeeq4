package com.gophisb.houd11;

import android.app.Activity;
import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.mapsforge.map.android.graphics.AndroidGraphicFactory;
import org.mapsforge.map.android.layers.MyLocationOverlay;
import org.mapsforge.map.layer.overlay.Marker;
import org.mapsforge.core.model.LatLong;
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

public class MosqueMapActivity extends Activity {
    private static final String MAP_URL =
            "https://download.mapsforge.org/maps/v5/africa/algeria.map";
    private static final String BUNDLED_MAP = "maps/algeria.map";
    private static final String MAP_NAME = "algeria.map";

    private MapView mapView;
    private TileRendererLayer tileRendererLayer;
    private MapDataStore mapDataStore;
    private TextView status;
    private Button action;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private LocationManager locationManager;
    private LocationListener locationListener;
    private MyLocationOverlay myLocationOverlay;
    private static final int LOCATION_REQUEST = 2002;

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
        if (file.isFile() && file.length() > 250L * 1024L * 1024L) {
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
        status.setText("جاري تجهيز خريطة الجزائر Offline المدمجة...");
        status.setGravity(Gravity.CENTER);
        status.setPadding(0, 24, 0, 24);

        action = new Button(this);
        action.setText("تجهيز الخريطة");
        action.setOnClickListener(v -> downloadMap());

        prepareBundledMap(file);

        root.addView(title);
        root.addView(status);
        root.addView(action);
        setContentView(root);
    }

    private void prepareBundledMap(File target) {
        executor.execute(() -> {
            File temp = new File(target.getParentFile(), MAP_NAME + ".bundled.part");
            try (InputStream in = getAssets().open(BUNDLED_MAP);
                 BufferedOutputStream out = new BufferedOutputStream(new FileOutputStream(temp), 1024 * 1024)) {
                byte[] buffer = new byte[1024 * 1024];
                long done = 0;
                int n;
                while ((n = in.read(buffer)) != -1) {
                    out.write(buffer, 0, n);
                    done += n;
                    long current = done;
                    runOnUiThread(() -> status.setText(String.format(Locale.ROOT,
                            "تجهيز خريطة الجزائر Offline: %.0f MB", current / 1048576.0)));
                }
                out.flush();
                if (temp.length() < 250L * 1024L * 1024L) {
                    throw new IllegalStateException("bundled map is incomplete");
                }
                if (target.exists() && !target.delete()) {
                    throw new IllegalStateException("cannot replace old map");
                }
                if (!temp.renameTo(target)) {
                    throw new IllegalStateException("cannot finalize bundled map");
                }
                runOnUiThread(() -> {
                    status.setText("تم تجهيز الخريطة. جاري فتحها...");
                    loadMap(target);
                });
            } catch (Exception bundledError) {
                temp.delete();
                runOnUiThread(() -> {
                    status.setText("الخريطة المدمجة غير متاحة؛ يمكن تنزيلها من المصدر الرسمي.");
                    action.setEnabled(true);
                    action.setText("تنزيل خريطة الجزائر");
                });
            }
        });
    }

    private void downloadMap() {
        action.setEnabled(false);
        status.setText("بدء تنزيل خريطة الجزائر الرسمية...");

        executor.execute(() -> {
            File temp = new File(mapFile().getParentFile(), MAP_NAME + ".part");
            HttpURLConnection connection = null;
            try {
                URL url = new URL(MAP_URL);
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(30000);
                connection.setReadTimeout(120000);
                connection.setInstanceFollowRedirects(true);
                connection.connect();

                int code = connection.getResponseCode();
                if (code < 200 || code >= 300) {
                    throw new IllegalStateException("HTTP " + code);
                }

                long total = connection.getContentLengthLong();
                long done = 0;

                try (InputStream raw = new BufferedInputStream(connection.getInputStream(), 1024 * 1024);
                     BufferedOutputStream out =
                             new BufferedOutputStream(new FileOutputStream(temp), 1024 * 1024)) {
                    byte[] buffer = new byte[1024 * 1024];
                    int n;
                    while ((n = raw.read(buffer)) != -1) {
                        out.write(buffer, 0, n);
                        done += n;
                        long current = done;
                        runOnUiThread(() -> {
                            if (total > 0) {
                                int pct = (int) Math.min(99, current * 100L / total);
                                status.setText("تنزيل خريطة الجزائر: " + pct + "%");
                            } else {
                                status.setText(String.format(Locale.ROOT,
                                        "تنزيل الخريطة: %.1f MB", current / 1048576.0));
                            }
                        });
                    }
                    out.flush();
                }

                if (!temp.isFile() || temp.length() < 250L * 1024L * 1024L) {
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
            setupLocationOverlay();
            double lat = getIntent().getDoubleExtra("lat", Double.NaN);
            double lng = getIntent().getDoubleExtra("lng", Double.NaN);
            if (Double.isFinite(lat) && Double.isFinite(lng)) {
                mapView.setCenter(new org.mapsforge.core.model.LatLong(lat, lng));
                mapView.setZoomLevel((byte) 16);
            } else {
                mapView.setCenter(mapDataStore.startPosition());
                mapView.setZoomLevel(mapDataStore.startZoomLevel());
            }
        } catch (Exception e) {
            showMapError("تعذر فتح خريطة الجزائر: " + e.getMessage());
        }
    }


    private void setupLocationOverlay() {
        android.graphics.drawable.Drawable drawable =
                getDrawable(com.gophisb.houd11.R.drawable.icon_launcher);
        org.mapsforge.core.graphics.Bitmap bitmap =
                AndroidGraphicFactory.convertToBitmap(drawable);
        Marker marker = new Marker(null, bitmap, 0, -bitmap.getHeight() / 2);
        myLocationOverlay = new MyLocationOverlay(marker);
        mapView.getLayerManager().getLayers().add(myLocationOverlay);

        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
            }, LOCATION_REQUEST);
            return;
        }
        startLocationUpdates();
    }

    private void startLocationUpdates() {
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        if (locationManager == null) return;
        locationListener = new LocationListener() {
            @Override public void onLocationChanged(Location location) {
                if (myLocationOverlay != null) {
                    myLocationOverlay.setPosition(
                            location.getLatitude(),
                            location.getLongitude(),
                            location.hasAccuracy() ? location.getAccuracy() : 25f);
                }
            }
        };
        try {
            locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER, 2000L, 5f, locationListener);
            Location last = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (last != null && myLocationOverlay != null) {
                myLocationOverlay.setPosition(last.getLatitude(), last.getLongitude(),
                        last.hasAccuracy() ? last.getAccuracy() : 25f);
            }
        } catch (SecurityException ignored) {
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_REQUEST && grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED) startLocationUpdates();
    }

    private void showMapError(String message) {
        TextView error = new TextView(this);
        error.setText(message);
        error.setGravity(Gravity.CENTER);
        error.setPadding(32, 32, 32, 32);
        setContentView(error);
    }

    @Override protected void onDestroy() {
        if (locationManager != null && locationListener != null) {
            try { locationManager.removeUpdates(locationListener); } catch (SecurityException ignored) { }
        }
        executor.shutdownNow();
        if (mapDataStore != null) mapDataStore.close();
        if (mapView != null) mapView.destroyAll();
        AndroidGraphicFactory.clearResourceMemoryCache();
        super.onDestroy();
    }
}
