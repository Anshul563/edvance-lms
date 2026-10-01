import { useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatSeconds } from "@/data/courses";

const TRACK_HEIGHT = 2;
const TRACK_HEIGHT_ACTIVE = 4;
const THUMB_SIZE = 11;
const CHAR_WIDTH = 7;
const TOOLTIP_PADDING = 14;

type SeekBarProps = {
  position: number;
  duration: number;
  buffered?: number;
  onSeek: (seconds: number) => void;
  onScrubStart: () => void;
  onScrubChange: (seconds: number | null) => void;
  onScrubEnd: () => void;
};

export function SeekBar({
  position,
  duration,
  buffered = 0,
  onSeek,
  onScrubStart,
  onScrubChange,
  onScrubEnd,
}: SeekBarProps) {
  const [width, setWidth] = useState(0);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  const active = dragValue != null;

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const updateFromX = (x: number) => {
    if (width <= 0 || duration <= 0) return;
    const clampedX = Math.max(0, Math.min(width, x));
    const value = (clampedX / width) * duration;
    dragRef.current = value;
    setDragValue(value);
    onScrubChange(value);
  };

  const finishScrub = () => {
    const target = dragRef.current;
    dragRef.current = null;
    setDragValue(null);
    onScrubChange(null);
    if (target != null) onSeek(target);
    onScrubEnd();
  };

  const cancelScrub = () => {
    dragRef.current = null;
    setDragValue(null);
    onScrubChange(null);
    onScrubEnd();
  };

  const value = dragValue ?? position;
  const progress = duration > 0 ? Math.min(1, Math.max(0, value / duration)) : 0;
  const bufferedRatio = duration > 0 ? Math.min(1, Math.max(0, buffered / duration)) : 0;

  const label = formatSeconds(value);
  const tooltipWidth = label.length * CHAR_WIDTH + TOOLTIP_PADDING * 2;
  const thumbX = progress * width;
  const tooltipLeft = Math.max(0, Math.min(thumbX - tooltipWidth / 2, width - tooltipWidth));

  return (
    <View
      onLayout={handleLayout}
      style={styles.hitArea}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        onScrubStart();
        updateFromX(event.nativeEvent.locationX);
      }}
      onResponderMove={(event) => updateFromX(event.nativeEvent.locationX)}
      onResponderRelease={finishScrub}
      onResponderTerminate={cancelScrub}>
      {active ? (
        <View style={[styles.tooltip, { left: tooltipLeft, width: tooltipWidth }]}>
          <ThemedText type="smallBold" style={styles.tooltipText}>
            {label}
          </ThemedText>
        </View>
      ) : null}

      <View
        style={[
          styles.track,
          { height: active ? TRACK_HEIGHT_ACTIVE : TRACK_HEIGHT },
        ]}>
        <View style={[styles.buffered, { width: `${bufferedRatio * 100}%` }]} />
        <View style={[styles.played, { width: `${progress * 100}%` }]} />
      </View>

      <View
        style={[
          styles.thumb,
          {
            left: thumbX - THUMB_SIZE / 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            opacity: active ? 1 : 0,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    justifyContent: "flex-end",
    paddingBottom: Spacing.two,
    paddingTop: Spacing.two,
  },
  track: {
    width: "100%",
    borderRadius: Radius.pill,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
  },
  buffered: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  played: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#FF0033",
  },
  thumb: {
    position: "absolute",
    bottom: (TRACK_HEIGHT_ACTIVE - THUMB_SIZE) / 2,
    backgroundColor: "#FFFFFF",
  },
  tooltip: {
    position: "absolute",
    bottom: Spacing.two + TRACK_HEIGHT_ACTIVE,
    alignItems: "center",
    paddingVertical: Spacing.one,
    borderRadius: Radius.small,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  tooltipText: {
    color: "#FFFFFF",
  },
});
