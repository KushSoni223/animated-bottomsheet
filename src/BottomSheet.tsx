import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  LayoutChangeEvent,
  Easing,
} from "react-native";

interface BottomSheetProps {
  isOpen: boolean;
  toggleSheet: (open: boolean) => void;
  snapPoints?: string[]; // Example: ['30%', '60%']
  animationDuration?: number;
  backgroundColor?: string;
  borderRadius?: number;
  overlayStyle?: object;
  fitContentHeight?: boolean;
  children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function BottomSheet({
  isOpen,
  toggleSheet,
  snapPoints = ["50%"],
  animationDuration = 300,
  backgroundColor = "#fff",
  borderRadius = 16,
  overlayStyle,
  fitContentHeight = false,
  children,
}: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const pan = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Track translateY value
  const translateYValue = useRef(SCREEN_HEIGHT);

  // Handle width animation
  const handleWidth = useRef(new Animated.Value(40)).current;

  // Parse snap points
  const parsedSnapPoints = snapPoints.map((point) => {
    if (point.endsWith("%")) {
      const percentage = parseFloat(point.replace("%", ""));
      return SCREEN_HEIGHT - (percentage / 100) * SCREEN_HEIGHT;
    }
    return parseFloat(point) || SCREEN_HEIGHT / 2; // Fallback to half screen
  });

  const initialSnap = parsedSnapPoints[0];

  const animateSheet = (toValue: number, callback?: () => void) => {
    setIsAnimating(true);
    Animated.timing(translateY, {
      toValue,
      duration: animationDuration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsAnimating(false);
      pan.setValue(0); // Reset pan after animation
      translateYValue.current = toValue;
      callback?.();
    });
  };

  const animateHandle = (toValue: number) => {
    Animated.timing(handleWidth, {
      toValue,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease),
    }).start();
  };

  useEffect(() => {
    // Update translateYValue when translateY changes
    const id = translateY.addListener(({ value }) => {
      translateYValue.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  useEffect(() => {
    if (fitContentHeight && isOpen && contentHeight === 0) {
      return; // Wait for content height measurement
    }
    const targetPosition = fitContentHeight
      ? Math.max(SCREEN_HEIGHT - contentHeight, parsedSnapPoints[0]) // Ensure not too high
      : initialSnap;
    animateSheet(isOpen ? targetPosition : SCREEN_HEIGHT);
  }, [isOpen, contentHeight]);

  const sheetTranslateY = Animated.add(translateY, pan);

  const backdropOpacity = sheetTranslateY.interpolate({
    inputRange: [Math.min(...parsedSnapPoints), SCREEN_HEIGHT],
    outputRange: [0.5, 0],
    extrapolate: "clamp",
  });

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Lower threshold for better responsiveness
      return Math.abs(gestureState.dy) > 2 || Math.abs(gestureState.dx) > 2;
    },
    onPanResponderGrant: () => {
      animateHandle(30); // Shrink handle on drag start
      pan.setValue(0); // Reset pan to avoid jumps
    },
    onPanResponderMove: Animated.event(
      [null, { dy: pan }], // Bind gesture dy to pan
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gestureState) => {
      animateHandle(40); // Expand handle back
      const { vy: velocity, dy: movedDistance } = gestureState;
      const currentPos = translateYValue.current + movedDistance;

      // Fast swipe down to close
      if (velocity > 0.7 || (movedDistance > 100 && velocity >= 0)) {
        animateSheet(SCREEN_HEIGHT, () => toggleSheet(false));
        return;
      }
      // Fast swipe up to open fully
      if (velocity < -0.7) {
        animateSheet(Math.min(...parsedSnapPoints));
        return;
      }

      // Snap to nearest point
      let closestSnap = SCREEN_HEIGHT;
      let minDistance = Infinity;
      parsedSnapPoints.forEach((snap) => {
        const distance = Math.abs(currentPos - snap);
        if (distance < minDistance) {
          minDistance = distance;
          closestSnap = snap;
        }
      });

      // If close to bottom, dismiss
      if (closestSnap >= SCREEN_HEIGHT - 50) {
        animateSheet(SCREEN_HEIGHT, () => toggleSheet(false));
      } else {
        animateSheet(closestSnap);
      }
    },
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (fitContentHeight && height > 0) {
      setContentHeight(height);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={StyleSheet.absoluteFill}
      pointerEvents={isOpen ? "auto" : "none"}
    >
      {/* Backdrop */}
      {isOpen && (
        <Animated.View
          style={[styles.backdrop, overlayStyle, { opacity: backdropOpacity }]}
          pointerEvents="auto"
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (!isAnimating) {
                animateSheet(SCREEN_HEIGHT, () => toggleSheet(false));
              }
            }}
          />
        </Animated.View>
      )}

      {/* Bottom Sheet */}
      <Animated.View
        {...panResponder.panHandlers}
        onLayout={fitContentHeight ? handleLayout : undefined}
        style={[
          styles.sheet,
          {
            backgroundColor,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            transform: [{ translateY: sheetTranslateY }],
            minHeight: fitContentHeight
              ? undefined
              : SCREEN_HEIGHT - Math.min(...parsedSnapPoints),
          },
        ]}
        pointerEvents="auto"
      >
        {/* Handle */}
        <Animated.View
          style={[styles.handle, { width: handleWidth }]}
          {...panResponder.panHandlers} // Allow dragging from handle
        />
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  handle: {
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 12,
  },
  content: {
    flexShrink: 1, // Prevent content from overflowing
  },
});
