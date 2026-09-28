package com.gophisb.arrafeeq4;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class RafeeqAdhanBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
            || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
            || Intent.ACTION_TIME_CHANGED.equals(action)
            || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            // The JS layer will refresh the seven-day schedule on next app resume.
            // Native alarms are intentionally not fabricated here without persisted timing data.
        }
    }
}
