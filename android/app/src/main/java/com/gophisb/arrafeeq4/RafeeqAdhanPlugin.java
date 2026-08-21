package com.gophisb.arrafeeq4;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import org.json.JSONObject;

@CapacitorPlugin(name = "RafeeqAdhan")
public class RafeeqAdhanPlugin extends Plugin {
    private static final int BASE_ID = 51000;
    private static final String ACTION = "com.gophisb.arrafeeq4.PLAY_ADHAN";

    @com.getcapacitor.PluginMethod
    public void schedule(PluginCall call) {
        JSArray items = call.getArray("alarms");
        if (items == null) {
            call.reject("alarms is required");
            return;
        }
        AlarmManager manager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        int scheduled = 0;
        try {
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                long at = item.optLong("at", 0L);
                int id = item.optInt("id", i);
                if (at <= System.currentTimeMillis()) continue;
                Intent intent = new Intent(getContext(), AdhanAlarmReceiver.class);
                intent.setAction(ACTION);
                intent.putExtra("adhan_id", id);
                PendingIntent pending = PendingIntent.getBroadcast(
                    getContext(), BASE_ID + id, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    try {
                        manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending);
                    } catch (SecurityException deniedExactAlarm) {
                        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending);
                    }
                } else {
                    manager.setExact(AlarmManager.RTC_WAKEUP, at, pending);
                }
                scheduled++;
            }
            JSObject result = new JSObject();
            result.put("scheduled", scheduled);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to schedule native adhan", error);
        }
    }

    @com.getcapacitor.PluginMethod
    public void cancel(PluginCall call) {
        AlarmManager manager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        for (int id = 0; id < 40; id++) {
            Intent intent = new Intent(getContext(), AdhanAlarmReceiver.class);
            intent.setAction(ACTION);
            PendingIntent pending = PendingIntent.getBroadcast(
                getContext(), BASE_ID + id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            manager.cancel(pending);
            pending.cancel();
        }
        call.resolve();
    }
}
