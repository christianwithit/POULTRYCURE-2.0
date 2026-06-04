import React from "react";
import { View } from "react-native";
import { EdgeFunctionTest } from "../../components/EdgeFunctionTest";

export default function DebugEdgeTestScreen() {
  // This screen is for development use only — renders nothing in production builds
  if (!__DEV__) return <View />;
  return <EdgeFunctionTest />;
}
