package com.gophisb.arrafeeq4;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class RafeeqAdhanReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        Intent service = new Intent(context, RafeeqAdhanService.class);
        service.putExtra("title", intent.getStringExtra("title"));
        service.putExtra("id", intent.getIntExtra("id", 0));
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service);
        else context.startService(service);
    }
}
