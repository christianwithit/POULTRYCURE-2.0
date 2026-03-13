// Mock for expo-image-manipulator
export const Action = {
  resize: 'resize',
  crop: 'crop',
  rotate: 'rotate',
  flip: 'flip',
};

export const ResizeMode = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
};

export const FlipType = {
  horizontal: 'horizontal',
  vertical: 'vertical',
};

export const manipulateAsync = jest.fn();
export const flipAsync = jest.fn();
export const cropAsync = jest.fn();
export const rotateAsync = jest.fn();
export const resizeAsync = jest.fn();

export default {
  Action,
  ResizeMode,
  FlipType,
  manipulateAsync,
  flipAsync,
  cropAsync,
  rotateAsync,
  resizeAsync,
};
