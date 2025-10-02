import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  children?: React.ReactNode;
  onReset?: () => void;
};

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Optionally send to your logger here
    console.warn("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          {!!this.state.error?.message && (
            <Text style={styles.message} numberOfLines={3}>
              {this.state.error?.message}
            </Text>
          )}
          <Pressable onPress={this.handleReset} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: "black",
  },
  title: { color: "white", fontSize: 18, fontWeight: "700" },
  message: { color: "white", opacity: 0.8, textAlign: "center" },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "white",
  },
  buttonText: { color: "black", fontWeight: "600" },
});
