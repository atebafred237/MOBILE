import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const AppSafeArea = ({ children, style, edges = ['top', 'bottom'] }) => (
  <SafeAreaView style={[{ flex: 1 }, style]} edges={edges}>
    {children}
  </SafeAreaView>
);

export default AppSafeArea;
