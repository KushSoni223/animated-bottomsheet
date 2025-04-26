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

  const backdropOpacity = translateY.interpolate({
    inputRange: [Math.min(...parsedSnapPoints), SCREEN_HEIGHT],
    outputRange: [0.5, 0],
    extrapolate: "clamp",
  });

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 2 || Math.abs(gestureState.dx) > 2;
    },
    onPanResponderGrant: () => {
      pan.setValue(0); // Reset pan to avoid jumps
    },
    onPanResponderMove: Animated.event(
      [null, { dy: pan }], // Bind gesture dy to pan
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gestureState) => {
      const { vy: velocity, dy: movedDistance } = gestureState;
      const currentPos = translateYValue.current + movedDistance;

      // Snap to next snap point (upwards)
      let closestSnap = SCREEN_HEIGHT;
      if (velocity < -0.7) {
        closestSnap = Math.min(...parsedSnapPoints);
      }

      // Snap to previous snap point (downwards)
      if (velocity > 0.7 || movedDistance > 100) {
        closestSnap = SCREEN_HEIGHT;
      }

      // Handle if within the snap point range, snap to closest point
      if (movedDistance < 0) {
        parsedSnapPoints.forEach((snap) => {
          if (currentPos > snap) {
            closestSnap = snap;
          }
        });
      } else {
        parsedSnapPoints.forEach((snap) => {
          if (currentPos < snap) {
            closestSnap = snap;
          }
        });
      }

      // If dragging down and releasing between 100% and 50%, go to 50%
      if (
        currentPos > Math.min(...parsedSnapPoints) &&
        currentPos < SCREEN_HEIGHT - 50
      ) {
        closestSnap = Math.min(...parsedSnapPoints);
      }

      // If dragging up and releasing above 50% to 100%, go to 100%
      if (currentPos < SCREEN_HEIGHT - 50) {
        closestSnap = Math.max(...parsedSnapPoints);
      }

      // Handle closure if dragged down too far
      if (currentPos > SCREEN_HEIGHT - 50) {
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
            transform: [{ translateY: translateY }],
            minHeight: fitContentHeight
              ? undefined
              : SCREEN_HEIGHT - Math.min(...parsedSnapPoints),
          },
        ]}
        pointerEvents="auto"
      >
        {/* Handle */}
        <View style={styles.handle} />
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
