import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";
import { Platform } from "react-native";

export function usePortraitLock() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
      () => {},
    );
  }, []);
}
