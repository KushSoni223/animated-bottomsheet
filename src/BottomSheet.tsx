import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
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

export function BottomSheet({
  isOpen,
  toggleSheet,
  snapPoints = ["50%"],
  animationDuration = 300,
  backgroundColor = "white",
  borderRadius = 16,
  overlayStyle,
  fitContentHeight = false,
  children,
}: BottomSheetProps) {
  const screenHeight =
    useRef<number>(0).current ||
    require("react-native").Dimensions.get("window").height;
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const pan = useRef(new Animated.Value(0)).current;
  const [sheetHeight, setSheetHeight] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const numericSnapPoints = snapPoints
    .map((p) => {
      const percent = parseFloat(p.replace("%", ""));
      return screenHeight - (screenHeight * percent) / 100;
    })
    .sort((a, b) => a - b);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dy) > 5,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        pan.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > (sheetHeight || screenHeight) / 4) {
        toggleSheet(false);
      } else {
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const animateSheet = (open: boolean) => {
    setIsAnimating(true);
    Animated.timing(translateY, {
      toValue: open ? numericSnapPoints[0] ?? 0 : screenHeight,
      duration: animationDuration,
      useNativeDriver: true,
    }).start(() => {
      setIsAnimating(false);
    });
  };

  useEffect(() => {
    animateSheet(isOpen);
  }, [isOpen]);

  const sheetTranslateY = Animated.add(translateY, pan);

  const backdropOpacity = translateY.interpolate({
    inputRange: [numericSnapPoints[0] ?? 0, screenHeight],
    outputRange: [1, 0],
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (fitContentHeight && height !== sheetHeight) {
      setSheetHeight(height);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.backdrop,
          overlayStyle,
          { opacity: backdropOpacity, backgroundColor: "rgba(0,0,0,0.5)" },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!isAnimating) toggleSheet(false);
          }}
        />
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        onLayout={handleLayout}
        style={[
          styles.sheet,
          {
            backgroundColor,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            transform: [{ translateY: sheetTranslateY }],
            minHeight: fitContentHeight
              ? undefined
              : screenHeight - (numericSnapPoints[0] ?? 0),
          },
        ]}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
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
