import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface ClinicalTimerProps {
  onUseTime: (seconds: number) => void;
  resetSignal?: number;
}

type TimerState = 'idle' | 'running' | 'stopped';

export function ClinicalTimer({ onUseTime, resetSignal }: ClinicalTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const reducedMotion = useReducedMotion();
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (resetSignal === undefined) return;
    reset();
  }, [resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timerState === 'running' && !reducedMotion) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0.2, { duration: 700 })
        ),
        -1,
        false
      );
    } else {
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [timerState, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  function start() {
    startTimeRef.current = Date.now() - elapsed;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 50);
    setTimerState('running');
  }

  function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerState('stopped');
  }

  function reset() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsed(0);
    setTimerState('idle');
  }

  function useTime() {
    onUseTime(elapsed / 1000);
  }

  const displaySeconds = (elapsed / 1000).toFixed(1);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.microLabel}>STOPWATCH</Text>
        <Animated.View style={[styles.pulseIndicator, pulseStyle]} />
      </View>

      <View style={styles.displayRow}>
        <Text style={[styles.display, timerState === 'running' && styles.displayRunning]}>
          {displaySeconds}
        </Text>
        <Text style={styles.displayUnit}>sec</Text>
      </View>

      <View style={styles.controls}>
        {timerState === 'idle' && (
          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Start timer"
          >
            <Text style={styles.btnTextLight}>Start</Text>
          </Pressable>
        )}

        {timerState === 'running' && (
          <Pressable
            onPress={stop}
            style={({ pressed }) => [styles.btn, styles.btnStop, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Stop timer"
          >
            <Text style={styles.btnTextLight}>Stop</Text>
          </Pressable>
        )}

        {timerState === 'stopped' && (
          <View style={styles.stoppedRow}>
            <Pressable
              onPress={useTime}
              style={({ pressed }) => [
                styles.btn, styles.btnPrimary, styles.btnFlex, pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Use this time"
            >
              <Text style={styles.btnTextLight}>Use Time</Text>
            </Pressable>
            <Pressable
              onPress={reset}
              style={({ pressed }) => [
                styles.btn, styles.btnOutline, styles.btnReset, pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Reset timer"
            >
              <Text style={styles.btnTextDark}>Reset</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  microLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  pulseIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.actionBlue,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  display: {
    fontSize: 48,
    fontWeight: typography.weightBold,
    color: colors.ink,
    lineHeight: 56,
    minWidth: 100,
    textAlign: 'right',
  },
  displayRunning: {
    color: colors.actionBlue,
  },
  displayUnit: {
    fontSize: typography.sizeLg,
    color: colors.muted,
    fontWeight: typography.weightMedium,
    marginBottom: 4,
  },
  controls: {
    gap: spacing.xs,
  },
  stoppedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    height: 48,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnFlex: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnStop: {
    backgroundColor: colors.coral,
  },
  btnOutline: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnReset: {
    width: 88,
    flex: 0,
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnTextLight: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
  },
  btnTextDark: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
});
