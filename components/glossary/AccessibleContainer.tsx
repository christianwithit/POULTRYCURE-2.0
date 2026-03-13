import { useAccessibilityFocus } from '@/hooks/useAccessibility';
import React, { useRef } from 'react';
import {
  View,
  ViewProps,
  findNodeHandle
} from 'react-native';

interface AccessibleContainerProps extends ViewProps {
  children: React.ReactNode;
  focusOnMount?: boolean;
  announceOnMount?: string;
  role?: 'main' | 'navigation' | 'complementary' | 'banner' | 'contentinfo' | 'region';
  label?: string;
  hint?: string;
}

/**
 * Enhanced container component with accessibility features
 * Provides proper focus management and announcements
 */
export const AccessibleContainer: React.FC<AccessibleContainerProps> = ({
  children,
  focusOnMount = false,
  announceOnMount,
  role,
  label,
  hint,
  accessible = true,
  ...viewProps
}) => {
  const containerRef = useRef<View>(null);
  const { announceChange, setFocus } = useAccessibilityFocus();

  React.useEffect(() => {
    if (focusOnMount && containerRef.current) {
      const reactTag = findNodeHandle(containerRef.current);
      if (reactTag) {
        // Delay focus to ensure component is fully rendered
        setTimeout(() => {
          setFocus(reactTag);
        }, 100);
      }
    }

    if (announceOnMount) {
      // Delay announcement to ensure screen reader is ready
      setTimeout(() => {
        announceChange(announceOnMount);
      }, 200);
    }
  }, [focusOnMount, announceOnMount, setFocus, announceChange]);

  // Map semantic roles to valid accessibility roles
  const getAccessibilityRole = (): ViewProps['accessibilityRole'] => {
    switch (role) {
      case 'main':
      case 'navigation':
        return 'none'; // React Native doesn't support these semantic roles
      case 'banner':
      case 'complementary':
      case 'contentinfo':
      case 'region':
        return 'none'; // These are not valid React Native accessibility roles
      default:
        return undefined;
    }
  };

  return (
    <View
      ref={containerRef}
      accessible={accessible}
      accessibilityRole={getAccessibilityRole()}
      accessibilityLabel={label}
      accessibilityHint={hint}
      {...viewProps}
    >
      {children}
    </View>
  );
};

export default AccessibleContainer;