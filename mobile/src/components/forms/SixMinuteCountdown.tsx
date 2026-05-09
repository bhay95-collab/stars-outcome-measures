import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';

export type SixMWTTimerStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'complete';

interface SixMinuteCountdownProps {
  onStatusChange: (status: SixMWTTimerStatus) => void;
}

const DURATION_MS = 360_000;

function formatMmSs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SixMinuteCountdown({ onStatusChange }: SixMinuteCountdownProps) {
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const [status, setStatus] = useState<SixMWTTimerStatus>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function changeStatus(next: SixMWTTimerStatus) {
    setStatus(next);
    onStatusChange(next);
  }

  function startInterval(remaining: number) {
    targetRef.current = Date.now() + remaining;
    intervalRef.current = setInterval(() => {
      const left = Math.max(0, targetRef.current - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setStatus('complete');
        onStatusChange('complete');
      }
    }, 50);
  }

  function start() {
    startInterval(DURATION_MS);
    changeStatus('running');
  }

  function pause() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    changeStatus('paused');
  }

  function resume() {
    startInterval(remainingMs);
    changeStatus('running');
  }

  function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    changeStatus('stopped');
  }

  function reset() {
    setRemainingMs(DURATION_MS);
    changeStatus('idle');
  }

  const isComplete = status === 'complete';

  return (
    <View style={styles.container}>
      <Text style={styles.microLabel}>COUNTDOWN TIMER</Text>

      <View style={styles.displayRow}>
        <Text
          style={[
            styles.display,
            status === 'running' && styles.displayRunning,
            isComplete && styles.displayComplete,
          ]}
        >
          {formatMmSs(isComplete ? 0 : remainingMs)}
        </Text>
      </View>

      <View style={styles.controls}>
        {status === 'idle' && (
          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Start 6-minute countdown"
          >
            <Text style={styles.btnTextLight}>Start</Text>
          </Pressable>
        )}

        {status === 'running' && (
          <View style={styles.buttonRow}>
            <Pressable
              onPress={pause}
              style={({ pressed }) => [
                styles.btn, styles.btnOutline, styles.btnFlex, pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Pause timer"
            >
              <Text style={styles.btnTextDark}>Pause</Text>
            </Pressable>
            <Pressable
              onPress={stop}
              style={({ pressed }) => [
                styles.btn, styles.btnStop, styles.btnStopFixed, pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Stop test early"
            >
              <Text style={styles.btnTextLight}>Stop</Text>
            </Pressable>
          </View>
        )}

        {status === 'paused' && (
          <View style={styles.buttonRow}>
            <Pressable
              onPress={resume}
              style={({ pressed }) => [
                styles.btn, styles.btnPrimary, styles.btnFlex, pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Resume timer"
            >
              <Text style={styles.btnTextLight}>Resume</Text>
            </Pressable>
            <Pressable
              onPress={stop}
              style={({ pressed }) => [
                styles.btn, styles.btnStop, styles.btnStopFixed, pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Stop test early"
            >
              <Text style={styles.btnTextLight}>Stop</Text>
            </Pressable>
          </View>
        )}

        {(status === 'stopped' || status === 'complete') && (
          <Pressable
            onPress={reset}
            style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Reset timer"
          >
            <Text style={styles.btnTextDark}>Reset</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  microLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
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
    minWidth: 120,
    textAlign: 'right',
  },
  displayRunning: {
    color: colors.actionBlue,
  },
  displayComplete: {
    color: colors.success,
  },
  controls: {
    gap: spacing.xs,
  },
  buttonRow: {
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
  btnStopFixed: {
    width: 88,
  },
  btnOutline: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
