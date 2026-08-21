package com.gophisb.arrafeeq4;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.PowerManager;

public class AdhanAlarmReceiver extends BroadcastReceiver {
    private static MediaPlayer player;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"com.gophisb.arrafeeq4.PLAY_ADHAN".equals(intent.getAction())) return;
        Context app = context.getApplicationContext();
        PowerManager power = (PowerManager) app.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock lock = power == null ? null : power.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK, "ArRafeeq4:AdhanPlayback"
        );
        if (lock != null) lock.acquire(15_000L);
        MediaPlayer next = null;
        try {
            if (player != null) {
                try { player.stop(); } catch (Exception ignored) {}
                player.release();
                player = null;
            }
            next = new MediaPlayer();
            next.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build());
            AssetFileDescriptor afd = app.getResources().openRawResourceFd(R.raw.adhan);
            if (afd == null) throw new IllegalStateException("Adhan resource is unavailable");
            try {
                next.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            } finally {
                afd.close();
            }
            next.setOnCompletionListener(done -> {
                done.release();
                player = null;
                if (lock != null && lock.isHeld()) lock.release();
            });
            next.setOnErrorListener((failed, what, extra) -> {
                try { failed.release(); } catch (Exception ignored) {}
                player = null;
                if (lock != null && lock.isHeld()) lock.release();
                return true;
            });
            next.prepare();
            player = next;
            next.start();
        } catch (Exception error) {
            if (next != null) next.release();
            player = null;
            if (lock != null && lock.isHeld()) lock.release();
        }
    }
}
