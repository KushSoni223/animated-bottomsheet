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

  const snapValue = snapPoints.length
    ? SCREEN_HEIGHT -
      (parseFloat(snapPoints[0].replace("%", "")) / 100) * SCREEN_HEIGHT
    : SCREEN_HEIGHT / 2;

  const targetPosition = fitContentHeight
    ? SCREEN_HEIGHT - contentHeight
    : snapValue;

  const animateSheet = (open: boolean) => {
    setIsAnimating(true);
    Animated.timing(translateY, {
      toValue: open ? targetPosition : SCREEN_HEIGHT,
      duration: animationDuration,
      useNativeDriver: true,
    }).start(() => {
      setIsAnimating(false);
      pan.setValue(0); // reset pan
    });
  };

  useEffect(() => {
    if (fitContentHeight && isOpen && contentHeight === 0) {
      return; // wait for measuring
    }
    animateSheet(isOpen);
  }, [isOpen, contentHeight]);

  const backdropOpacity = translateY.interpolate({
    inputRange: [targetPosition, SCREEN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const sheetTranslateY = Animated.add(translateY, pan);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dy) > 5,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        pan.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        toggleSheet(false);
      } else {
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (fitContentHeight) {
      setContentHeight(height);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
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
              if (!isAnimating) toggleSheet(false);
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
              : SCREEN_HEIGHT - targetPosition,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.handle} />
        {children}
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
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 12,
  },
});
