package com.gophisb.houd11;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

public class AlarmScheduler {
    private final Context context;
    private final AlarmManager alarmManager;
    private static final int BASE = 51000;
    private static final String PREFS = "adhan_scheduler";
    private static final String KEY_ALARMS = "alarms";

    public AlarmScheduler(Context context) {
        this.context = context.getApplicationContext();
        this.alarmManager = (AlarmManager)this.context.getSystemService(Context.ALARM_SERVICE);
    }

    public synchronized void scheduleAll(JSONArray alarms) {
        cancelAll();
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_ALARMS, alarms.toString()).apply();

        for (int i = 0; i < alarms.length(); i++) {
            try {
                JSONObject item = alarms.getJSONObject(i);
                long at = item.getLong("at");
                if (at <= System.currentTimeMillis()) continue;
                int id = BASE + item.optInt("id", i);
                scheduleOne(id, at);
            } catch (Exception ignored) {}
        }
    }

    public synchronized void rescheduleSaved() {
        String json = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_ALARMS, "[]");
        try { scheduleAllWithoutSaving(new JSONArray(json)); } catch (Exception ignored) {}
    }

    private void scheduleAllWithoutSaving(JSONArray alarms) {
        for (int i = 0; i < alarms.length(); i++) {
            try {
                JSONObject item = alarms.getJSONObject(i);
                long at = item.getLong("at");
                if (at <= System.currentTimeMillis()) continue;
                int id = BASE + item.optInt("id", i);
                scheduleOne(id, at);
            } catch (Exception ignored) {}
        }
    }

    private void scheduleOne(int id, long at) {
        Intent intent = new Intent(context, AdhanReceiver.class)
                .setAction("com.gophisb.houd11.ADHAN")
                .putExtra("alarm_id", id);
        PendingIntent pi = PendingIntent.getBroadcast(
                context, id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= 31 && !alarmManager.canScheduleExactAlarms()) return;
        if (Build.VERSION.SDK_INT >= 23) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    public synchronized void cancelAll() {
        for (int i = 0; i < 20; i++) {
            int id = BASE + i;
            Intent intent = new Intent(context, AdhanReceiver.class)
                    .setAction("com.gophisb.houd11.ADHAN");
            PendingIntent pi = PendingIntent.getBroadcast(
                    context, id, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(pi);
            pi.cancel();
        }
    }
}