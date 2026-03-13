// Mock for React Navigation
import React from 'react';

const mockNavigation = {
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  dangerouslyGetParent: jest.fn(),
  dangerouslyGetState: jest.fn(),
};

const mockRoute = {
  params: {},
  key: 'test-key',
  name: 'TestScreen',
  path: '/test',
};

const useNavigation = () => mockNavigation;
const useRoute = () => mockRoute;
const useFocusEffect = jest.fn();

const NavigationContainer = ({ children }) => <div>{children}</div>;

const MockLink = ({ children, to, ...props }) => (
  <div {...props} onClick={() => mockNavigation.navigate(to)}>
    {children}
  </div>
);

export {
  NavigationContainer,
  useNavigation,
  useRoute,
  useFocusEffect,
  MockLink as Link,
};

export default {
  NavigationContainer,
  useNavigation,
  useRoute,
  useFocusEffect,
  Link: MockLink,
};
