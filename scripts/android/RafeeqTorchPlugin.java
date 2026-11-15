package com.gophisb.arrafeeq4;

import android.Manifest;
import android.content.Context;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(
    name = "RafeeqTorch",
    permissions = {
        @Permission(alias = "camera", strings = { Manifest.permission.CAMERA })
    }
)
public class RafeeqTorchPlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private String activeCameraId;

    @PluginMethod
    public void flashTwice(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermissionCallback");
            return;
        }
        runFlashSequence(call);
    }

    @PermissionCallback
    private void cameraPermissionCallback(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            call.reject("Camera permission was not granted; flashlight alert is unavailable.");
            return;
        }
        runFlashSequence(call);
    }

    private void runFlashSequence(PluginCall call) {
        try {
            CameraManager manager = (CameraManager) getContext()
                .getSystemService(Context.CAMERA_SERVICE);
            if (manager == null) {
                call.reject("Camera service is unavailable.");
                return;
            }

            String cameraId = findBackFlashCamera(manager);
            if (cameraId == null) {
                call.reject("No rear camera with a flashlight was found.");
                return;
            }

            activeCameraId = cameraId;
            manager.setTorchMode(cameraId, true);

            handler.postDelayed(() -> {
                try {
                    manager.setTorchMode(cameraId, false);
                    handler.postDelayed(() -> {
                        try {
                            manager.setTorchMode(cameraId, true);
                            handler.postDelayed(() -> {
                                try {
                                    manager.setTorchMode(cameraId, false);
                                    activeCameraId = null;
                                    call.resolve();
                                } catch (Exception error) {
                                    turnOffAndReject(manager, cameraId, call, error);
                                }
                            }, 180);
                        } catch (Exception error) {
                            turnOffAndReject(manager, cameraId, call, error);
                        }
                    }, 160);
                } catch (Exception error) {
                    turnOffAndReject(manager, cameraId, call, error);
                }
            }, 180);
        } catch (Exception error) {
            call.reject("Unable to operate the flashlight.", error);
        }
    }

    private String findBackFlashCamera(CameraManager manager) throws Exception {
        for (String cameraId : manager.getCameraIdList()) {
            CameraCharacteristics characteristics =
                manager.getCameraCharacteristics(cameraId);
            Integer facing = characteristics.get(CameraCharacteristics.LENS_FACING);
            Boolean hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
            if (facing != null &&
                facing == CameraCharacteristics.LENS_FACING_BACK &&
                Boolean.TRUE.equals(hasFlash)) {
                return cameraId;
            }
        }
        return null;
    }

    private void turnOffAndReject(
        CameraManager manager, String cameraId, PluginCall call, Exception error
    ) {
        try {
            manager.setTorchMode(cameraId, false);
        } catch (Exception ignored) {}
        activeCameraId = null;
        call.reject("Flashlight sequence failed.", error);
    }

    @Override
    protected void handleOnDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (activeCameraId != null) {
            try {
                CameraManager manager = (CameraManager) getContext()
                    .getSystemService(Context.CAMERA_SERVICE);
                if (manager != null) manager.setTorchMode(activeCameraId, false);
            } catch (Exception ignored) {}
            activeCameraId = null;
        }
        super.handleOnDestroy();
    }
}
