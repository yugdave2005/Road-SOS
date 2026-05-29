import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Logger } from '@core/utils/Logger';
import { theme } from '@shared/theme/theme';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error('ErrorBoundary caught an error', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.props.fallbackMessage || this.state.error?.message || 'An unexpected error occurred.'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.sosRed,
    borderWidth: 2,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...theme.typography.screenTitle,
    color: theme.colors.sosRed,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.sosRed,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  buttonText: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});
