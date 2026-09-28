import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const android = path.join(root, 'android');
const pkg = path.join(android, 'app', 'src', 'main');
const javaDir = path.join(pkg, 'java', 'com', 'gophisb', 'arrafeeq4');
const rawDir = path.join(pkg, 'res', 'raw');

fs.mkdirSync(javaDir, { recursive: true });
fs.mkdirSync(rawDir, { recursive: true });

for (const name of [
  'RafeeqAdhanPlugin.java',
  'RafeeqAdhanReceiver.java',
  'RafeeqAdhanService.java',
  'RafeeqAdhanBootReceiver.java'
]) {
  fs.copyFileSync(path.join(root, 'scripts', 'android', name), path.join(javaDir, name));
}
fs.copyFileSync(path.join(root, 'assets', 'audio', 'adhan.mp3'), path.join(rawDir, 'adhan.mp3'));

const mainActivity = path.join(javaDir, 'MainActivity.java');
fs.writeFileSync(mainActivity, `package com.gophisb.arrafeeq4;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RafeeqAdhanPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);

const manifest = path.join(pkg, 'AndroidManifest.xml');
let xml = fs.readFileSync(manifest, 'utf8');
const permissions = [
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.WAKE_LOCK'
];
for (const permission of permissions) {
  const tag = `    <uses-permission android:name="${permission}" />\n`;
  if (!xml.includes(`android:name="${permission}"`)) xml = xml.replace('<application', tag + '<application');
}
const components = `\n        <receiver android:name=".RafeeqAdhanReceiver" android:exported="false" />\n        <receiver android:name=".RafeeqAdhanBootReceiver" android:enabled="true" android:exported="false">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n                <action android:name="android.intent.action.TIME_SET" />\n                <action android:name="android.intent.action.TIMEZONE_CHANGED" />\n            </intent-filter>\n        </receiver>\n        <service android:name=".RafeeqAdhanService" android:exported="false" android:foregroundServiceType="mediaPlayback" />\n`;
if (!xml.includes('android:name=".RafeeqAdhanService"')) xml = xml.replace('</application>', components + '    </application>');
fs.writeFileSync(manifest, xml);
console.log('Installed native locked-screen adhan layer.');
