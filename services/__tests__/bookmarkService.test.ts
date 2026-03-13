import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookmarkService } from '../bookmarkService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('BookmarkService', () => {
  const testUserId = 'test-user-123';
  const testDiseaseId = 'avian-influenza';
  const testDiseaseId2 = 'newcastle-disease';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AsyncStorage mock to return empty array by default
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  describe('addBookmark', () => {
    it('should add a new bookmark successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      
      await bookmarkService.addBookmark(testUserId, testDiseaseId);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'disease_bookmarks',
        expect.stringContaining(testUserId)
      );
      
      const savedData = JSON.parse(mockAsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].userId).toBe(testUserId);
      expect(savedData[0].diseaseId).toBe(testDiseaseId);
      expect(savedData[0].id).toBeDefined();
      expect(savedData[0].createdAt).toBeDefined();
      expect(savedData[0].updatedAt).toBeDefined();
    });

    it('should not add duplicate bookmarks', async () => {
      const existingBookmark = {
        id: 'existing-bookmark',
        userId: testUserId,
        diseaseId: testDiseaseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingBookmark]));
      
      await bookmarkService.addBookmark(testUserId, testDiseaseId);
      
      // Should not call setItem since bookmark already exists
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle AsyncStorage save errors', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Save error'));
      
      await expect(bookmarkService.addBookmark(testUserId, testDiseaseId))
        .rejects.toThrow('Save error');
    });
  });

  describe('removeBookmark', () => {
    it('should remove an existing bookmark', async () => {
      const existingBookmarks = [
        {
          id: 'bookmark-1',
          userId: testUserId,
          diseaseId: testDiseaseId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'bookmark-2',
          userId: testUserId,
          diseaseId: testDiseaseId2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingBookmarks));
      
      await bookmarkService.removeBookmark(testUserId, testDiseaseId);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'disease_bookmarks',
        expect.stringContaining(testDiseaseId2)
      );
      
      const savedData = JSON.parse(mockAsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].diseaseId).toBe(testDiseaseId2);
    });

    it('should handle removing non-existent bookmark gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      
      await bookmarkService.removeBookmark(testUserId, 'non-existent-disease');
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('disease_bookmarks', '[]');
    });
  });

  describe('isBookmarked', () => {
    it('should return true for bookmarked disease', async () => {
      const existingBookmark = {
        id: 'bookmark-1',
        userId: testUserId,
        diseaseId: testDiseaseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingBookmark]));
      
      const result = await bookmarkService.isBookmarked(testUserId, testDiseaseId);
      
      expect(result).toBe(true);
    });

    it('should return false for non-bookmarked disease', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      
      const result = await bookmarkService.isBookmarked(testUserId, testDiseaseId);
      
      expect(result).toBe(false);
    });

    it('should return false on storage errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const result = await bookmarkService.isBookmarked(testUserId, testDiseaseId);
      
      expect(result).toBe(false);
    });
  });

  describe('getBookmarkedDiseases', () => {
    it('should return list of bookmarked disease IDs for user', async () => {
      const bookmarks = [
        {
          id: 'bookmark-1',
          userId: testUserId,
          diseaseId: testDiseaseId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'bookmark-2',
          userId: testUserId,
          diseaseId: testDiseaseId2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'bookmark-3',
          userId: 'other-user',
          diseaseId: 'other-disease',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(bookmarks));
      
      const result = await bookmarkService.getBookmarkedDiseases(testUserId);
      
      expect(result).toEqual([testDiseaseId, testDiseaseId2]);
    });

    it('should return empty array for user with no bookmarks', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      
      const result = await bookmarkService.getBookmarkedDiseases(testUserId);
      
      expect(result).toEqual([]);
    });
  });

  describe('updateBookmarkNote', () => {
    it('should update note for existing bookmark', async () => {
      const existingBookmark = {
        id: 'bookmark-1',
        userId: testUserId,
        diseaseId: testDiseaseId,
        note: 'old note',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingBookmark]));
      
      const newNote = 'updated note';
      await bookmarkService.updateBookmarkNote(testUserId, testDiseaseId, newNote);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      
      const savedData = JSON.parse(mockAsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].note).toBe(newNote);
      expect(new Date(savedData[0].updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(existingBookmark.updatedAt).getTime());
    });

    it('should handle updating note for non-existent bookmark', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      
      await bookmarkService.updateBookmarkNote(testUserId, testDiseaseId, 'new note');
      
      // Should not call setItem since bookmark doesn't exist
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getUserBookmarkNotes', () => {
    it('should return note for existing bookmark', async () => {
      const existingBookmark = {
        id: 'bookmark-1',
        userId: testUserId,
        diseaseId: testDiseaseId,
        note: 'test note',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingBookmark]));
      
      const result = await bookmarkService.getUserBookmarkNotes(testUserId, testDiseaseId);
      
      expect(result).toBe('test note');
    });

    it('should return empty string for bookmark without note', async () => {
      const existingBookmark = {
        id: 'bookmark-1',
        userId: testUserId,
        diseaseId: testDiseaseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingBookmark]));
      
      const result = await bookmarkService.getUserBookmarkNotes(testUserId, testDiseaseId);
      
      expect(result).toBe('');
    });
  });

  describe('getUserBookmarks', () => {
    it('should return full bookmark objects for user', async () => {
      const bookmarks = [
        {
          id: 'bookmark-1',
          userId: testUserId,
          diseaseId: testDiseaseId,
          note: 'test note',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'bookmark-2',
          userId: 'other-user',
          diseaseId: testDiseaseId2,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(bookmarks));
      
      const result = await bookmarkService.getUserBookmarks(testUserId);
      
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(testUserId);
      expect(result[0].diseaseId).toBe(testDiseaseId);
      expect(result[0].note).toBe('test note');
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('clearUserBookmarks', () => {
    it('should remove all bookmarks for a specific user', async () => {
      const bookmarks = [
        {
          id: 'bookmark-1',
          userId: testUserId,
          diseaseId: testDiseaseId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'bookmark-2',
          userId: 'other-user',
          diseaseId: testDiseaseId2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(bookmarks));
      
      await bookmarkService.clearUserBookmarks(testUserId);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      
      const savedData = JSON.parse(mockAsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].userId).toBe('other-user');
    });
  });
});