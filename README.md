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
      <BottomSheet visible={visible} onClose={() => setVisible(false)}>
        <Text>Hello from the bottom!</Text>
      </BottomSheet>
    </>
  );
};
```
