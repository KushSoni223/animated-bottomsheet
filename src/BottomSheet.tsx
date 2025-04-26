// import React, { useRef, useEffect, useState } from "react";
// import {
//   Animated,
//   Dimensions,
//   PanResponder,
//   StyleSheet,
//   View,
//   TouchableWithoutFeedback,
//   LayoutChangeEvent,
// } from "react-native";

// const SCREEN_HEIGHT = Dimensions.get("window").height;

// interface BottomSheetProps {
//   visible: boolean;
//   onClose: () => void;
//   snapPoints?: string[];
//   children: React.ReactNode;
// }

// export const BottomSheet: React.FC<BottomSheetProps> = ({
//   visible,
//   onClose,
//   children,
//   snapPoints = ["50%"],
// }) => {
//   const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
//   const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT);

//   const numericSnapPoints = snapPoints
//     .map((p) => {
//       const percent = parseFloat(p.replace("%", ""));
//       return SCREEN_HEIGHT - (SCREEN_HEIGHT * percent) / 100;
//     })
//     .sort((a, b) => a - b);

//   const lastTranslateY = useRef(0);

//   const panResponder = useRef(
//     PanResponder.create({
//       onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
//       onPanResponderMove: (_, gestureState) => {
//         const value = Math.max(0, gestureState.dy);
//         translateY.setValue(value + numericSnapPoints[0]);
//         lastTranslateY.current = value;
//       },
//       onPanResponderRelease: (_, gestureState) => {
//         const draggedY = gestureState.dy;
//         const endY = draggedY + numericSnapPoints[0];

//         if (draggedY > 100) {
//           Animated.timing(translateY, {
//             toValue: containerHeight,
//             duration: 300,
//             useNativeDriver: true,
//           }).start(onClose);
//           return;
//         }

//         const closestSnap = numericSnapPoints.reduce((prev, curr) =>
//           Math.abs(curr - endY) < Math.abs(prev - endY) ? curr : prev
//         );

//         Animated.spring(translateY, {
//           toValue: closestSnap,
//           useNativeDriver: true,
//         }).start();
//       },
//     })
//   ).current;

//   useEffect(() => {
//     if (visible) {
//       Animated.timing(translateY, {
//         toValue: numericSnapPoints[0],
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(translateY, {
//         toValue: containerHeight,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [visible]);

//   const handleLayout = (event: LayoutChangeEvent) => {
//     setContainerHeight(event.nativeEvent.layout.height);
//   };

//   return (
//     <View
//       style={StyleSheet.absoluteFill}
//       pointerEvents={visible ? "auto" : "none"}
//     >
//       <TouchableWithoutFeedback onPress={onClose}>
//         <View style={styles.overlay} />
//       </TouchableWithoutFeedback>

//       <Animated.View
//         {...panResponder.panHandlers}
//         onLayout={handleLayout}
//         style={[
//           styles.sheet,
//           {
//             transform: [{ translateY }],
//           },
//         ]}
//       >
//         {children}
//       </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.4)",
//   },
//   sheet: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 16,
//     minHeight: 200,
//   },
// });

// BottomSheet.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
} from "react-native";

interface BottomSheetProps {
  isOpen: boolean;
  toggleSheet: (open: boolean) => void;
  backgroundColor?: string;
  borderRadius?: number;
  overlayStyle?: object;
  sheetHeight?: number;
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  toggleSheet,
  backgroundColor,
  borderRadius = 16,
  overlayStyle,
  sheetHeight = 300,
  children,
}: BottomSheetProps) {
  const progress = useRef(new Animated.Value(isOpen ? 0 : 1)).current;
  const pan = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dy) > 5,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        pan.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > sheetHeight / 4) {
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
    Animated.timing(progress, {
      toValue: open ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsAnimating(false);
    });
  };

  useEffect(() => {
    animateSheet(isOpen);
  }, [isOpen]);

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const sheetTranslateY = Animated.add(
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, sheetHeight],
    }),
    pan
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, overlayStyle]}
    >
      <Animated.View
        style={[
          styles.backdrop,
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
        style={[
          styles.sheet,
          {
            transform: [{ translateY: sheetTranslateY }],
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            backgroundColor: backgroundColor ?? "white",
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
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#aaa",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 10,
  },
});
