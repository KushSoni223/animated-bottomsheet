# react-native-common-bottomsheet

A lightweight, dependency-free Bottom Sheet component for React Native, built without Reanimated or Gesture Handler.

---

## 🚀 Features

- ⚡ No external dependencies like Reanimated or Gesture Handler
- 🎯 Simple and customizable
- 📱 Smooth drag-to-close support
- 💡 Written in TypeScript

---

## 📦 Installation

```bash
npm install react-native-common-bottomsheet

or

yarn add react-native-common-bottomsheet
```

### Usage

```bash
import React, { useState } from 'react';
import { Text, Button } from 'react-native';
import { BottomSheet } from 'react-native-common-bottomsheet';

const App = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button title="Open Sheet" onPress={() => setVisible(true)} />
      <BottomSheet
        isOpen={visible}
        toggleSheet={(open) => setVisible(open)}
        snapPoints={['30%', '60%']} // Optional: Define snap points for sheet height
        animationDuration={300} // Optional: Set the duration of the animation
        backgroundColor="#fff" // Optional: Customize background color
        borderRadius={16} // Optional: Customize border radius
        overlayStyle={{}} // Optional: Customize overlay style
        fitContentHeight={false} // Optional: Adjust height to content size
      >
        <Text>Hello from the bottom!</Text>
      </BottomSheet>
    </>
  );
};
```

#### Common Props

```bash
Prop | Type | Description | Default Value
isOpen | boolean | Controls the visibility of the bottom sheet. | false
toggleSheet | (open: boolean) => void | A function to toggle the bottom sheet state (open or close). | N/A
snapPoints | string[] | Snap points for the sheet height, e.g., ['30%', '60%']. | ['30%', '60%']
animationDuration | number | Duration of the animation when the bottom sheet opens or closes (in milliseconds). | 300
backgroundColor | string | The background color of the bottom sheet. | #fff
borderRadius | number | The border radius for the bottom sheet corners. | 16
overlayStyle | object | Custom style for the backdrop overlay. | {}
fitContentHeight | boolean | Adjust the height of the bottom sheet to fit the content. If true, it will fit to the content height. | false
children | React.ReactNode | The content to display inside the bottom sheet. | N/A
```

##### 🌍 Contributing

If you'd like to contribute to this project, feel free to open an issue or submit a pull request!
