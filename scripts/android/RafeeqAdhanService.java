package com.gophisb.arrafeeq4;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

public class RafeeqAdhanService extends Service {
    private static final String CHANNEL = "rafeeq_adhan_playback";
    private MediaPlayer player;
    private PowerManager.WakeLock wakeLock;

    @Override public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent.getStringExtra("title");
        Notification notification = buildNotification(title == null ? "حان وقت الصلاة" : title);
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(42001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(42001, notification);
        }
        PowerManager pm = (PowerManager)getSystemService(POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Rafeeq4:AdhanPlayback");
        wakeLock.acquire(120000L);
        play();
        return START_NOT_STICKY;
    }

    private void play() {
        releasePlayer();
        AudioAttributes attrs = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build();
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(attrs);
            android.content.res.AssetFileDescriptor afd =
                getResources().openRawResourceFd(getResources().getIdentifier("adhan", "raw", getPackageName()));
            player.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            player.setOnCompletionListener(p -> stopSelf());
            player.setOnErrorListener((p, what, extra) -> { stopSelf(); return true; });
            player.prepare();
            AudioManager am = (AudioManager)getSystemService(AUDIO_SERVICE);
            if (Build.VERSION.SDK_INT >= 26) {
                am.requestAudioFocus(new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(attrs).build());
            } else {
                am.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
            }
            player.start();
        } catch (Exception error) {
            stopSelf();
        }
    }

    private Notification buildNotification(String title) {
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        return b.setSmallIcon(getApplicationInfo().icon).setContentTitle("الرفيق — الأذان")
            .setContentText(title).setOngoing(true).build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "تشغيل الأذان", NotificationManager.IMPORTANCE_LOW));
        }
    }

    private void releasePlayer() {
        if (player != null) { try { player.stop(); } catch (Exception ignored) {} player.release(); player = null; }
    }

    @Override public void onDestroy() {
        releasePlayer();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}