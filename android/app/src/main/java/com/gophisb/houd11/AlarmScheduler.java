package com.gophisb.houd11;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

public class AlarmScheduler {
    private static final int BASE = 51000;
    private static final int SLOT_COUNT = 80;
    private static final String PREFS = "rafeeq_adhan_schedule";
    private static final String KEY_ALARMS = "alarms";
    private final Context context;
    private final AlarmManager alarmManager;

    public AlarmScheduler(Context context) {
        this.context = context.getApplicationContext();
        this.alarmManager = (AlarmManager) this.context.getSystemService(Context.ALARM_SERVICE);
    }

    public synchronized void scheduleAll(JSONArray alarms) {
        cancelAll();
        JSONArray safe = alarms == null ? new JSONArray() : alarms;
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_ALARMS, safe.toString()).apply();
        for (int i = 0; i < safe.length(); i++) {
            try {
                JSONObject item = safe.getJSONObject(i);
                long at = item.getLong("at");
                if (at <= System.currentTimeMillis()) continue;
                int id = BASE + Math.floorMod(item.optInt("id", i), SLOT_COUNT);
                PendingIntent pi = pendingIntent(id);
                if (Build.VERSION.SDK_INT >= 23) alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                else alarmManager.setExact(AlarmManager.RTC_WAKEUP, at, pi);
            } catch (SecurityException denied) {
                try {
                    JSONObject item = safe.getJSONObject(i);
                    long at = item.getLong("at");
                    if (at > System.currentTimeMillis()) alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent(BASE + (i % SLOT_COUNT)));
                } catch (Exception ignored) {}
            } catch (Exception ignored) {}
        }
    }

    public synchronized void restore() {
        String json = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_ALARMS, "[]");
        try { scheduleAll(new JSONArray(json)); } catch (Exception ignored) { cancelAll(); }
    }

    public synchronized void cancelAll() {
        if (alarmManager == null) return;
        for (int i = 0; i < SLOT_COUNT; i++) {
            int id = BASE + i;
            PendingIntent pi = pendingIntentNoCreate(id);
            if (pi != null) { alarmManager.cancel(pi); pi.cancel(); }
        }
    }

    private PendingIntent pendingIntent(int id) {
        Intent intent = new Intent(context, AdhanReceiver.class).setAction("com.gophisb.houd11.ADHAN").putExtra("alarm_id", id);
        return PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent pendingIntentNoCreate(int id) {
        Intent intent = new Intent(context, AdhanReceiver.class).setAction("com.gophisb.houd11.ADHAN");
        return PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
    }
}
