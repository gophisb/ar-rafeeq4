package com.gophisb.houd11;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
public class AdhanService extends Service {
 private static final String CHANNEL="houd11_adhan_v4"; private MediaPlayer player;
 @Override public void onCreate(){ super.onCreate(); createChannel(); Notification n=new Notification.Builder(this,CHANNEL).setContentTitle("حان وقت الصلاة").setContentText("الأذان — هود 11").setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setOngoing(false).build(); if(Build.VERSION.SDK_INT>=29) startForeground(11011,n,android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK); else startForeground(11011,n); try{ player=MediaPlayer.create(this,com.gophisb.houd11.R.raw.adhan); if(player!=null){ player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()); player.setOnCompletionListener(mp->stopSelf()); player.start(); } else stopSelf(); }catch(Exception e){ stopSelf(); } }
 private void createChannel(){ if(Build.VERSION.SDK_INT>=26){ NotificationChannel c=new NotificationChannel(CHANNEL,"الأذان",NotificationManager.IMPORTANCE_HIGH); c.setDescription("تشغيل الأذان المحلي"); c.setSound(null,null); ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(c); } }
 @Override public void onDestroy(){ if(player!=null){try{player.stop();}catch(Exception ignored){} player.release(); player=null;} super.onDestroy(); }
 @Override public IBinder onBind(Intent intent){return null;}
}
