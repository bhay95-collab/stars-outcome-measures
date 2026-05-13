import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { animation } from '../../theme/tokens';

interface StepTransitionProps {
  children: React.ReactNode;
}

export function StepTransition({ children }: StepTransitionProps) {
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(reducedMotion ? 0 : 28);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    translateX.value = withSpring(0, animation.springGentle);
    opacity.value = withTiming(1, { duration: animation.durationBase });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}
