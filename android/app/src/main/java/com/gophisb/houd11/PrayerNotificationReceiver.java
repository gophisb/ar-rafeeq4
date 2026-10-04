package com.gophisb.houd11;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class PrayerNotificationReceiver extends BroadcastReceiver {
    private static final String CHANNEL = "rafeeq_prayer_status_v1";
    private static final int NOTIFICATION_ID = 24041;
    private static final int UPDATE_REQUEST = 24042;
    private static final String PREFS = "rafeeq_prayer_status";

    @Override
    public void onReceive(Context context, Intent intent) {
        show(context.getApplicationContext());
    }

    public static void saveAndShow(Context context, String json) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString("schedule", json == null ? "{}" : json)
                .putBoolean("enabled", true)
                .apply();
        show(context.getApplicationContext());
    }

    public static void clear(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIFICATION_ID);
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(pendingIntent(context));
    }

    private static void show(Context context) {
        createChannel(context);
        String json = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString("schedule", "{}");

        List<Prayer> prayers = parse(json);
        long now = System.currentTimeMillis();
        Prayer next = null;
        for (Prayer p : prayers) {
            if (p.at > now && (next == null || p.at < next.at)) next = p;
        }

        String title = "الرفيق 4 • مواقيت الصلاة";
        String text;
        if (next == null) {
            text = "افتح التطبيق لتحديث مواقيت الصلاة";
        } else {
            text = "الصلاة القادمة: " + next.name + " • بعد " + countdown(next.at - now);
        }

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent contentIntent = null;
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            contentIntent = PendingIntent.getActivity(
                    context, 24043, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        }

        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(context, CHANNEL)
                : new Notification.Builder(context);

        b.setSmallIcon(R.drawable.icon_launcher)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setCategory(Notification.CATEGORY_STATUS)
                .setAutoCancel(false);

        if (contentIntent != null) b.setContentIntent(contentIntent);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(NOTIFICATION_ID, b.build());

        scheduleNext(context, now);
    }

    private static void createChannel(Context context) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel c = new NotificationChannel(
                CHANNEL, "مواقيت الصلاة", NotificationManager.IMPORTANCE_LOW);
        c.setDescription("الصلاة القادمة والعد التنازلي");
        c.setShowBadge(false);
        c.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(c);
    }

    private static void scheduleNext(Context context, long now) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        long at = now + 30000L;
        PendingIntent pi = pendingIntent(context);
        try {
            if (Build.VERSION.SDK_INT >= 23) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setExact(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) {
            if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.set(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    private static PendingIntent pendingIntent(Context context) {
        Intent i = new Intent(context, PrayerNotificationReceiver.class)
                .setAction("com.gophisb.houd11.PRAYER_TICK");
        return PendingIntent.getBroadcast(
                context, UPDATE_REQUEST, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static String countdown(long millis) {
        long total = Math.max(0L, millis / 1000L);
        long h = total / 3600L;
        long m = (total % 3600L) / 60L;
        long s = total % 60L;
        return String.format(java.util.Locale.US, "%02d:%02d:%02d", h, m, s);
    }

    private static List<Prayer> parse(String json) {
        List<Prayer> out = new ArrayList<>();
        try {
            org.json.JSONObject root = new org.json.JSONObject(json);
            org.json.JSONArray a = root.optJSONArray("prayers");
            if (a == null) return out;
            for (int i = 0; i < a.length(); i++) {
                org.json.JSONObject p = a.optJSONObject(i);
                if (p == null) continue;
                long at = p.optLong("at", 0L);
                String name = p.optString("name", "الصلاة");
                if (at > 0) out.add(new Prayer(at, name));
            }
        } catch (Exception ignored) {}
        Collections.sort(out, Comparator.comparingLong(p -> p.at));
        return out;
    }

    private static final class Prayer {
        final long at;
        final String name;
        Prayer(long at, String name) { this.at = at; this.name = name; }
    }
}