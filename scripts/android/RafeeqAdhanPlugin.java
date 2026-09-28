package com.gophisb.arrafeeq4;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import org.json.JSONArray;

@CapacitorPlugin(name = "RafeeqAdhan")
public class RafeeqAdhanPlugin extends Plugin {
    private static final String PREFS = "rafeeq_adhan_alarms";

    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        AlarmManager manager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        boolean allowed = Build.VERSION.SDK_INT < 31 || manager.canScheduleExactAlarms();
        JSObject result = new JSObject();
        result.put("allowed", allowed);
        call.resolve(result);
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        JSONArray alarms = call.getArray("alarms");
        if (alarms == null) {
            call.reject("alarms is required");
            return;
        }
        AlarmManager manager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        int count = 0;
        try {
            for (int i = 0; i < alarms.length(); i++) {
                JSObject alarm = JSObject.fromJSONObject(alarms.getJSONObject(i));
                int id = alarm.getInteger("id");
                long at = alarm.getLong("at");
                String title = alarm.getString("title", "حان وقت الصلاة");
                Intent intent = new Intent(getContext(), RafeeqAdhanReceiver.class);
                intent.putExtra("id", id);
                intent.putExtra("title", title);
                PendingIntent pending = PendingIntent.getBroadcast(getContext(), id, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                manager.setAlarmClock(new AlarmManager.AlarmClockInfo(at, pending), pending);
                getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                        .putString("alarm_" + id, title).apply();
                count++;
            }
        } catch (Exception error) {
            call.reject("failed to schedule adhan alarms", error);
            return;
        }
        JSObject result = new JSObject();
        result.put("scheduled", count);
        call.resolve(result);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        AlarmManager manager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        android.content.SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        for (String key : prefs.getAll().keySet()) {
            try {
                int id = Integer.parseInt(key.substring("alarm_".length()));
                Intent intent = new Intent(getContext(), RafeeqAdhanReceiver.class);
                PendingIntent pending = PendingIntent.getBroadcast(getContext(), id, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                manager.cancel(pending);
            } catch (Exception ignored) {}
        }
        prefs.edit().clear().apply();
        call.resolve();
    }
}