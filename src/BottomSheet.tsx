import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: string[];
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  snapPoints = ["50%"],
}) => {
  const translateY = useRef<Animated.Value>(
    new Animated.Value(SCREEN_HEIGHT)
  ).current;

  const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT);
  const numericSnapPoints = snapPoints
    .map((p) => {
      const percent = parseFloat(p.replace("%", ""));
      return SCREEN_HEIGHT - (SCREEN_HEIGHT * percent) / 100;
    })
    .sort((a, b) => a - b);

  const lastTranslateY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        const value = Math.max(0, gestureState.dy);
        translateY.setValue(value);
        lastTranslateY.current = value;
      },
      onPanResponderRelease: (_, gestureState) => {
        const draggedY = gestureState.dy;
        const endY = draggedY + lastTranslateY.current;

        if (draggedY > 100) {
          Animated.timing(translateY, {
            toValue: containerHeight,
            duration: 300,
            useNativeDriver: true,
          }).start(onClose);
          return;
        }

        const closestSnap = numericSnapPoints.reduce((prev, curr) =>
          Math.abs(curr - endY) < Math.abs(prev - endY) ? curr : prev
        );

        Animated.spring(translateY, {
          toValue: closestSnap,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: numericSnapPoints[0],
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: containerHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  return visible ? (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        {...panResponder.panHandlers}
        onLayout={handleLayout}
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    minHeight: 200,
  },
});
