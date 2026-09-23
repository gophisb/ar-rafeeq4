package com.gophisb.houd11;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

public class AlarmScheduler {
    private final Context context; private final AlarmManager alarmManager; private static final int BASE = 51000;
    public AlarmScheduler(Context context) { this.context=context.getApplicationContext(); alarmManager=(AlarmManager)this.context.getSystemService(Context.ALARM_SERVICE); }
    public void scheduleAll(JSONArray alarms) {
        cancelAll();
        for(int i=0;i<alarms.length();i++) try {
            JSONObject item=alarms.getJSONObject(i); long at=item.getLong("at"); if(at<=System.currentTimeMillis()) continue;
            int id=BASE+item.optInt("id",i);
            Intent intent=new Intent(context,AdhanReceiver.class).setAction("com.gophisb.houd11.ADHAN").putExtra("alarm_id",id);
            PendingIntent pi=PendingIntent.getBroadcast(context,id,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            if(Build.VERSION.SDK_INT>=23) alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pi); else alarmManager.setExact(AlarmManager.RTC_WAKEUP,at,pi);
        } catch(Exception ignored) {}
    }
    public void cancelAll() { for(int i=0;i<20;i++){ int id=BASE+i; Intent intent=new Intent(context,AdhanReceiver.class).setAction("com.gophisb.houd11.ADHAN"); PendingIntent pi=PendingIntent.getBroadcast(context,id,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE); alarmManager.cancel(pi); pi.cancel(); } }
}
