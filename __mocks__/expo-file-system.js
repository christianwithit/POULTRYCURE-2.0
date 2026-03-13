// Mock for expo-file-system
export const documentDirectory = 'file://mock/document/directory/';
export const cacheDirectory = 'file://mock/cache/directory/';

export const makeDirectoryAsync = jest.fn();
export const readAsStringAsync = jest.fn();
export const writeAsStringAsync = jest.fn();
export const deleteAsync = jest.fn();
export const getInfoAsync = jest.fn();
export const copyAsync = jest.fn();
export const moveAsync = jest.fn();

export default {
  documentDirectory,
  cacheDirectory,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  getInfoAsync,
  copyAsync,
  moveAsync,
};
