package com.gophisb.arrafeeq4;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "RafeeqHaptics")
public class RafeeqHapticsPlugin extends Plugin {
    @PluginMethod
    public void vibrate(PluginCall call) {
        try {
            Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator == null || !vibrator.hasVibrator()) {
                call.reject("This device does not provide a vibration motor.");
                return;
            }
            long[] pattern = new long[] { 0, 600, 120, 600 };
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
            } else {
                vibrator.vibrate(pattern, -1);
            }
            call.resolve();
        } catch (Exception error) {
            call.reject("Native Qibla vibration failed.", error);
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        try {
            Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null) vibrator.cancel();
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not cancel vibration.", error);
        }
    }
}
