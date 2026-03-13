// Comprehensive React Native mock for Jest

export const View = ({ children, ...props }) => <div {...props}>{children}</div>;
export const Text = ({ children, ...props }) => <span {...props}>{children}</span>;
export const ScrollView = ({ children, ...props }) => <div {...props}>{children}</div>;
export const FlatList = ({ data, renderItem, keyExtractor, ...props }) => (
  <div {...props}>
    {data.map((item, index) => (
      <div key={keyExtractor(item, index)}>
        {renderItem({ item, index })}
      </div>
    ))}
  </div>
);
export const TouchableOpacity = ({ children, onPress, ...props }) => (
  <div onClick={onPress} {...props}>{children}</div>
);
export const Button = ({ title, onPress, ...props }) => (
  <button onClick={onPress} {...props}>{title}</button>
);
export const TextInput = ({ onChangeText, value, ...props }) => (
  <input onChange={(e) => onChangeText(e.target.value)} value={value} {...props} />
);
export const Image = ({ source, ...props }) => <img src={source?.uri} {...props} />;
export const ActivityIndicator = ({ size, color, ...props }) => (
  <div {...props}>Loading...</div>
);

// Mock React Native APIs
export const Platform = {
  OS: 'web',
  select: (obj) => obj.web,
  Version: 1,
};

export const Dimensions = {
  get: (dimension) => ({
    width: 375,
    height: 667,
  }),
};

export const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => style,
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

export const Alert = {
  alert: jest.fn(),
  prompt: jest.fn(),
};

export const Linking = {
  openURL: jest.fn(),
  canOpenURL: jest.fn().mockResolvedValue(true),
};

export const AsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
};

export const PixelRatio = {
  get: () => 2,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (layoutSize) => layoutSize,
  roundToNearestPixel: (layoutSize) => layoutSize,
};

export const StatusBar = {
  setBarStyle: jest.fn(),
  setHidden: jest.fn(),
  setNetworkActivityIndicatorVisible: jest.fn(),
  setBackgroundColor: jest.fn(),
  setTranslucent: jest.fn(),
};

export const SafeAreaView = ({ children, ...props }) => <div {...props}>{children}</div>;

// Mock Animated API
export const Animated = {
  Value: class Value {
    constructor(value = 0) {
      this._value = value;
      this._listeners = [];
    }
    setValue(value) {
      this._value = value;
      this._listeners.forEach(listener => listener({ value }));
    }
    addListener(listener) {
      this._listeners.push(listener);
      return { remove: () => {} };
    }
    removeAllListeners() {
      this._listeners = [];
    }
  },
  timing: (value, config) => ({
    start: (callback) => {
      setTimeout(() => callback?.({ finished: true }), config.duration || 0);
    },
    stop: jest.fn(),
  }),
  spring: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
  decay: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
  sequence: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
  parallel: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
  stagger: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
  loop: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
  delay: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
  event: jest.fn(() => jest.fn()),
  createAnimatedComponent: (component) => component,
  View: ({ children, ...props }) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }) => <span {...props}>{children}</span>,
  Image: ({ source, ...props }) => <img src={source?.uri} {...props} />,
  ScrollView: ({ children, ...props }) => <div {...props}>{children}</div>,
};

// Mock native modules
export const NativeModules = {
  DevSettings: {
    addMenuItem: jest.fn(),
  },
  Settings: {
    AirplaneMode: false,
  },
  StatusBarManager: {
    HEIGHT: 44,
    getHeight: jest.fn(() => Promise.resolve(44)),
  },
};

// Mock TurboModuleRegistry
export const TurboModuleRegistry = {
  get: jest.fn(),
  getEnforcing: jest.fn(() => ({})),
};

export default {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Button,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
  StyleSheet,
  Alert,
  Linking,
  AsyncStorage,
  PixelRatio,
  StatusBar,
  SafeAreaView,
  Animated,
  NativeModules,
  TurboModuleRegistry,
};
