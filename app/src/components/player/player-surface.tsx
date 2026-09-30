import { useEvent, useEventListener } from "expo";
import { BlurTargetView, BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { isPictureInPictureSupported, useVideoPlayer, VideoView, type SeekTolerance, type VideoPlayer } from "expo-video";
import {
  ChevronLeft,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Settings,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import { lockAsync, OrientationLock } from "expo-screen-orientation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PlayerSettings } from "@/components/player/player-settings";
import { SeekBar } from "@/components/player/seek-bar";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatSeconds } from "@/data/courses";
import type { Quality } from "@/types/course";

const AUTO_HIDE_MS = 3600;
const DOUBLE_TAP_MS = 280;
const SEEK_STEP = 10;
const SCRUB_TOLERANCE: SeekTolerance = { toleranceBefore: 0.5, toleranceAfter: 0.5 };
const EXACT_TOLERANCE: SeekTolerance = { toleranceBefore: 0, toleranceAfter: 0 };

function setCurrentTime(player: VideoPlayer, seconds: number) {
  player.currentTime = seconds;
}

function setMuted(player: VideoPlayer, muted: boolean) {
  player.muted = muted;
}

function setVolume(player: VideoPlayer, volume: number) {
  player.volume = volume;
}

function setLoop(player: VideoPlayer, loop: boolean) {
  player.loop = loop;
}

function setPlaybackRate(player: VideoPlayer, rate: number) {
  player.playbackRate = rate;
}

function setTime(player: VideoPlayer, seconds: number) {
  player.currentTime = seconds;
}

function playVideo(player: VideoPlayer) {
  player.play();
}

function pauseVideo(player: VideoPlayer) {
  player.pause();
}

function loadSource(player: VideoPlayer, uri: string) {
  return player.replaceAsync({ uri, useCaching: true });
}

function setSeekTolerance(player: VideoPlayer, tolerance: SeekTolerance) {
  player.seekTolerance = tolerance;
}

type SeekFeedback = { id: number; side: "left" | "right" } | null;

type PlayerSurfaceProps = {
  player: VideoPlayer;
  source: string;
  title: string;
  hasNext: boolean;
  quality: Quality;
  onQualityChange: (quality: Quality) => void;
  onBack: () => void;
  onNext: () => void;
  onEnded: () => void;
};

export function PlayerSurface({
  player,
  source,
  title,
  hasNext,
  quality,
  onQualityChange,
  onBack,
  onNext,
  onEnded,
}: PlayerSurfaceProps) {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<VideoView>(null);
  const glowTargetRef = useRef<View>(null);
  const widthRef = useRef(0);
  const lastTapAt = useRef(0);
  const tapX = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekCounter = useRef(0);

  const fade = useState(() => new Animated.Value(1))[0];
  const feedbackScale = useState(() => new Animated.Value(0))[0];
  const feedbackFade = useState(() => new Animated.Value(0))[0];

  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const [rate, setRate] = useState(1);
  const [autoplay, setAutoplay] = useState(true);
  const [feedback, setFeedback] = useState<SeekFeedback>(null);
  const [pipSupported] = useState(() => {
    try {
      return isPictureInPictureSupported();
    } catch {
      return false;
    }
  });

  const glowPlayer = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const { status } = useEvent(player, "statusChange", { status: player.status });
  const { status: glowStatus } = useEvent(glowPlayer, "statusChange", { status: glowPlayer.status });
  const { muted } = useEvent(player, "mutedChange", { muted: player.muted });
  const { volume } = useEvent(player, "volumeChange", { volume: player.volume });
  const timeUpdate = useEvent(player, "timeUpdate", {
    currentTime: player.currentTime,
    bufferedPosition: player.bufferedPosition,
    currentLiveTimestamp: player.currentLiveTimestamp,
    currentOffsetFromLive: player.currentOffsetFromLive,
  });

  const duration = player.duration;
  const loading = status === "loading";
  const currentTime = timeUpdate?.currentTime ?? player.currentTime;
  const bufferedPosition = timeUpdate?.bufferedPosition ?? player.bufferedPosition;
  const displayTime = scrubTime ?? currentTime;
  const scrubbing = scrubTime != null;

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  useEventListener(player, "playToEnd", () => {
    if (autoplay && hasNext) {
      onEnded();
    }
  });

  useEffect(() => {
    Animated.timing(fade, {
      toValue: controlsVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, fade]);

  useEffect(() => {
    if (!controlsVisible || !isPlaying || scrubbing || settingsOpen) return;

    const timeout = setTimeout(() => setControlsVisible(false), AUTO_HIDE_MS);
    return () => clearTimeout(timeout);
  }, [controlsVisible, isPlaying, scrubbing, settingsOpen]);

  useEffect(() => {
    return () => {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const lockOrientation = useCallback(async (lock: OrientationLock) => {
    if (Platform.OS === "web") return;
    try {
      await lockAsync(lock);
    } catch {}
  }, []);

  const enterFullscreen = useCallback(() => {
    setSettingsOpen(false);
    setControlsVisible(true);
    setFullscreen(true);
    void lockOrientation(OrientationLock.LANDSCAPE);
  }, [lockOrientation]);

  const leaveFullscreen = useCallback(() => {
    setFullscreen(false);
    setControlsVisible(true);
    void lockOrientation(OrientationLock.PORTRAIT_UP);
  }, [lockOrientation]);

  const enterAmbient = useCallback(() => {
    setSettingsOpen(false);
    setAmbient(true);
    setControlsVisible(true);
  }, []);

  const exitAmbient = useCallback(() => {
    setAmbient(false);
    setControlsVisible(true);
  }, []);

  useEffect(() => {
    if (!ambient) {
      pauseVideo(glowPlayer);
      return;
    }

    let cancelled = false;
    setLoop(glowPlayer, false);
    setMuted(glowPlayer, true);

    void loadSource(glowPlayer, source)
      .then(() => {
        if (cancelled) return;
        setTime(glowPlayer, player.currentTime);
        setPlaybackRate(glowPlayer, rate);
        if (player.playing) {
          playVideo(glowPlayer);
        } else {
          pauseVideo(glowPlayer);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [ambient, glowPlayer, player, rate, source]);

  useEffect(() => {
    if (!ambient || glowStatus !== "readyToPlay") return;

    setPlaybackRate(glowPlayer, rate);
    if (Math.abs(glowPlayer.currentTime - player.currentTime) > 0.4) {
      setTime(glowPlayer, player.currentTime);
    }
    if (isPlaying && !glowPlayer.playing) {
      playVideo(glowPlayer);
    } else if (!isPlaying && glowPlayer.playing) {
      pauseVideo(glowPlayer);
    }
  }, [ambient, currentTime, glowPlayer, glowStatus, isPlaying, player, rate]);

  const exitFullscreen = leaveFullscreen;

  useEffect(() => {
    if (!fullscreen) return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      exitFullscreen();
      return true;
    });

    return () => {
      subscription.remove();
      void lockOrientation(OrientationLock.PORTRAIT_UP);
    };
  }, [fullscreen, exitFullscreen, lockOrientation]);

  const showSeekFeedback = useCallback(
    (side: "left" | "right") => {
      seekCounter.current += 1;
      setFeedback({ id: seekCounter.current, side });

      feedbackScale.setValue(0.4);
      feedbackFade.setValue(1);

      Animated.parallel([
        Animated.timing(feedbackScale, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackFade, {
          toValue: 0,
          duration: 620,
          useNativeDriver: true,
        }),
      ]).start(() => setFeedback(null));

      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setFeedback(null), 700);
    },
    [feedbackFade, feedbackScale],
  );

  const seekBy = useCallback(
    (delta: number, side: "left" | "right") => {
      player.seekBy(delta);
      showSeekFeedback(side);
      setControlsVisible(true);
    },
    [player, showSeekFeedback],
  );

  const handleTapIn = (event: GestureResponderEvent) => {
    tapX.current = event.nativeEvent.locationX;
  };

  const handleTap = () => {
    const now = Date.now();

    if (now - lastTapAt.current < DOUBLE_TAP_MS) {
      lastTapAt.current = 0;
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }

      const side = tapX.current < widthRef.current / 2 ? "left" : "right";
      seekBy(side === "left" ? -SEEK_STEP : SEEK_STEP, side);
      return;
    }

    lastTapAt.current = now;
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    singleTapTimer.current = setTimeout(() => {
      singleTapTimer.current = null;
      setSettingsOpen(false);
      setControlsVisible((visible) => !visible);
    }, DOUBLE_TAP_MS);
  };

  const handleStageLayout = (event: LayoutChangeEvent) => {
    widthRef.current = event.nativeEvent.layout.width;
  };

  const startScrub = () => {
    setSettingsOpen(false);
    setSeekTolerance(player, SCRUB_TOLERANCE);
  };

  const endScrub = () => {
    setSeekTolerance(player, EXACT_TOLERANCE);
  };

  const cycleVolume = () => {
    if (muted) {
      setMuted(player, false);
      setVolume(player, 1);
    } else if (volume > 0.6) {
      setVolume(player, 0.5);
    } else {
      setMuted(player, true);
    }
  };

  const retry = () => {
    void player.replaceAsync(source).then(() => player.play());
  };

  const VolumeIcon = muted ? VolumeX : volume > 0.6 ? Volume2 : Volume1;

  return (
    <View
      style={[
        fullscreen ? styles.fullscreenContainer : styles.inlineContainer,
        { paddingTop: fullscreen ? 0 : insets.top },
      ]}>
      <View
        style={fullscreen ? styles.fullscreenStage : styles.inlineStage}
        onLayout={handleStageLayout}>
        {ambient ? (
          <View style={styles.glowLayer} pointerEvents="none">
            <BlurTargetView ref={glowTargetRef} style={styles.glowTarget}>
              <VideoView
                player={glowPlayer}
                style={styles.glowVideo}
                contentFit="cover"
                nativeControls={false}
                fullscreenOptions={{ enable: false }}
                playsInline
                surfaceType="textureView"
              />
            </BlurTargetView>
            <BlurView
              blurTarget={glowTargetRef}
              blurMethod="dimezisBlurView"
              intensity={100}
              tint="dark"
              style={styles.glowBlur}
            />
            <View style={styles.glowScrim} />
          </View>
        ) : null}

        <VideoView
          ref={videoRef}
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture={pipSupported}
          fullscreenOptions={{ enable: false }}
          playsInline
          surfaceType="textureView"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={controlsVisible ? "Hide player controls" : "Show player controls"}
          style={StyleSheet.absoluteFill}
          onPressIn={handleTapIn}
          onPress={handleTap}
        />

        {feedback ? (
          <Animated.View
            key={feedback.id}
            pointerEvents="none"
            style={[
              styles.feedbackLayer,
              feedback.side === "left" ? styles.feedbackLeft : styles.feedbackRight,
              { opacity: feedbackFade, transform: [{ scale: feedbackScale }] },
            ]}>
            {feedback.side === "left" ? (
              <RotateCcw size={26} color="#FFFFFF" />
            ) : (
              <RotateCw size={26} color="#FFFFFF" />
            )}
            <ThemedText type="smallBold" style={styles.feedbackText}>
              {SEEK_STEP} seconds
            </ThemedText>
          </Animated.View>
        ) : null}

        <Animated.View
          pointerEvents={controlsVisible ? "box-none" : "none"}
          style={[styles.overlay, { opacity: fade }]}>
          <View style={styles.topBar} pointerEvents="box-none">
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.topBarRow} pointerEvents="box-none">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={fullscreen ? "Exit fullscreen" : "Go back"}
                hitSlop={8}
                onPress={fullscreen ? exitFullscreen : onBack}
                style={styles.iconButton}>
                <ChevronLeft size={22} color="#FFFFFF" />
              </Pressable>
              <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
                {title}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Playback settings"
                hitSlop={8}
                onPress={() => {
                  setSettingsOpen((open) => !open);
                  setControlsVisible(true);
                }}
                style={[styles.iconButton, settingsOpen ? styles.iconButtonActive : null]}>
                <Settings size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View pointerEvents="none" style={styles.centerOverlay}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}

          {status === "error" ? (
            <View style={styles.centerOverlay}>
              <ThemedText type="smallBold" style={styles.errorText}>
                This video could not be loaded
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry loading video"
                onPress={retry}
                style={styles.retryButton}>
                <RefreshCw size={16} color="#FFFFFF" />
                <ThemedText type="smallBold" style={styles.retryText}>
                  Retry
                </ThemedText>
              </Pressable>
            </View>
          ) : null}

          {!isPlaying && !loading && status !== "error" ? (
            <View pointerEvents="box-none" style={styles.centerOverlay}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Play"
                onPress={togglePlay}
                style={styles.bigButton}>
                <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.bottomBar} pointerEvents="box-none">
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.seekWrap} pointerEvents="box-none">
              <SeekBar
                position={currentTime}
                duration={duration}
                buffered={bufferedPosition}
                onSeek={(seconds) => {
                  setCurrentTime(player, seconds);
                }}
                onScrubStart={startScrub}
                onScrubChange={setScrubTime}
                onScrubEnd={endScrub}
              />
            </View>

            <View style={styles.controlsRow} pointerEvents="box-none">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? "Pause" : "Play"}
                hitSlop={6}
                onPress={togglePlay}
                style={styles.iconButton}>
                {isPlaying ? (
                  <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
                ) : (
                  <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next lesson"
                hitSlop={6}
                disabled={!hasNext}
                onPress={onNext}
                style={[styles.iconButton, !hasNext ? styles.disabled : null]}>
                <SkipForward size={20} color="#FFFFFF" fill="#FFFFFF" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={muted ? "Unmute" : "Mute"}
                accessibilityHint={ambient ? "Ambient mode is always muted" : undefined}
                hitSlop={6}
                disabled={ambient}
                onPress={cycleVolume}
                style={[styles.iconButton, ambient ? styles.disabled : null]}>
                <VolumeIcon size={20} color="#FFFFFF" />
              </Pressable>

              <ThemedText type="small" numberOfLines={1} style={styles.time}>
                {formatSeconds(displayTime)} / {formatSeconds(duration)}
              </ThemedText>

              <View style={styles.spacer} />

              {pipSupported ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Picture in picture"
                  hitSlop={6}
                  onPress={() => {
                    void videoRef.current?.startPictureInPicture().catch(() => {});
                  }}
                  style={styles.iconButton}>
                  <PictureInPicture2 size={20} color="#FFFFFF" />
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                hitSlop={6}
                onPress={fullscreen ? exitFullscreen : enterFullscreen}
                style={styles.iconButton}>
                {fullscreen ? (
                  <Minimize size={20} color="#FFFFFF" />
                ) : (
                  <Maximize size={20} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>

          {settingsOpen ? (
            <PlayerSettings
              rate={rate}
              onRateChange={(next) => {
                setRate(next);
                setPlaybackRate(player, next);
              }}
              quality={quality}
              onQualityChange={onQualityChange}
              autoplay={autoplay}
              onAutoplayChange={setAutoplay}
              canAutoplay={hasNext}
              ambient={ambient}
              onAmbientChange={(value) => {
                if (value) {
                  enterAmbient();
                } else {
                  exitAmbient();
                }
              }}
              onClose={() => setSettingsOpen(false)}
            />
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineContainer: {
    width: "100%",
    backgroundColor: "#000000",
  },
  fullscreenContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
    zIndex: 20,
  },
  inlineStage: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  fullscreenStage: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  glowLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
  },
  glowTarget: {
    flex: 1,
  },
  glowVideo: {
    flex: 1,
    transform: [{ scale: 1.25 }],
    opacity: 0.9,
  },
  glowBlur: {
    ...StyleSheet.absoluteFill,
  },
  glowScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
  },
  topBar: {
    paddingTop: Spacing.one,
  },
  topBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.three,
  },
  title: {
    flex: 1,
    color: "#FFFFFF",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
  },
  bigButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  bottomBar: {
    paddingBottom: Spacing.two,
  },
  seekWrap: {
    paddingHorizontal: Spacing.three,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  iconButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  disabled: {
    opacity: 0.35,
  },
  time: {
    marginLeft: Spacing.one,
    color: "#FFFFFF",
  },
  errorText: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  retryText: {
    color: "#FFFFFF",
  },
  spacer: {
    flex: 1,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  feedbackLayer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
    width: 120,
  },
  feedbackLeft: {
    left: 0,
  },
  feedbackRight: {
    right: 0,
  },
  feedbackText: {
    color: "#FFFFFF",
  },
});
