import React, { Component, ErrorInfo, ReactNode } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from "../constants/theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("❌ Error Boundary caught an error:", error);
    console.error("Error Info:", errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Application Error</Text>

              <View style={styles.errorBox}>
                <Text style={styles.errorLabel}>Error Message:</Text>
                <Text style={styles.errorText}>
                  {this.state.error?.message || "Unknown error occurred"}
                </Text>
              </View>

              {this.state.error?.stack && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorLabel}>Stack Trace:</Text>
                  <ScrollView style={styles.stackScroll}>
                    <Text style={styles.stackText}>
                      {this.state.error.stack}
                    </Text>
                  </ScrollView>
                </View>
              )}

              {this.state.errorInfo && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorLabel}>Component Stack:</Text>
                  <ScrollView style={styles.stackScroll}>
                    <Text style={styles.stackText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </ScrollView>
                </View>
              )}

              <View style={styles.helpBox}>
                <Text style={styles.helpTitle}>Common Solutions:</Text>
                <Text style={styles.helpText}>
                  • Check that all environment variables are set in EAS secrets
                </Text>
                <Text style={styles.helpText}>
                  • Verify your internet connection
                </Text>
                <Text style={styles.helpText}>• Try restarting the app</Text>
                <Text style={styles.helpText}>
                  • Contact support if the issue persists
                </Text>
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={this.handleReset}
              >
                <Text style={styles.resetButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: SPACING.xxl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.error,
    marginBottom: SPACING.xl,
    textAlign: "center",
  },
  errorBox: {
    width: "100%",
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontFamily: "monospace",
  },
  stackScroll: {
    maxHeight: 150,
  },
  stackText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: "monospace",
  },
  helpBox: {
    width: "100%",
    backgroundColor: "#FFF9E6",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  helpTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
});
