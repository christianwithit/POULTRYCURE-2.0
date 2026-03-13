import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiseaseBookmark } from '../types/types';

export class BookmarkService {
  private static instance: BookmarkService;
  private bookmarksKey = 'disease_bookmarks';

  private constructor() {}

  public static getInstance(): BookmarkService {
    if (!BookmarkService.instance) {
      BookmarkService.instance = new BookmarkService();
    }
    return BookmarkService.instance;
  }

  public async getBookmarkedDiseases(userId: string): Promise<string[]> {
    try {
      const bookmarks = await this.getAllBookmarks();
      return bookmarks
        .filter(bookmark => bookmark.userId === userId)
        .map(bookmark => bookmark.diseaseId);
    } catch (error) {
      console.error('Error getting bookmarked diseases:', error);
      return [];
    }
  }

  public async addBookmark(userId: string, diseaseId: string): Promise<void> {
    try {
      const bookmarks = await this.getAllBookmarks();
      
      // Check if bookmark already exists
      const existingBookmark = bookmarks.find(
        b => b.userId === userId && b.diseaseId === diseaseId
      );
      
      if (existingBookmark) {
        return; // Already bookmarked
      }

      const newBookmark: DiseaseBookmark = {
        id: `${userId}_${diseaseId}_${Date.now()}`,
        userId,
        diseaseId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      bookmarks.push(newBookmark);
      await this.saveBookmarks(bookmarks);

      // Queue for sync if offline (optional - avoid circular dependency in tests)
      try {
        const { cacheManager } = await import('./cacheManager');
        const isOnline = await cacheManager.getConnectivityStatus();
        if (!isOnline) {
          await cacheManager.queueOfflineAction({
            type: 'bookmark_add',
            data: { userId, diseaseId },
            timestamp: new Date()
          });
        }
      } catch (error) {
        // Ignore cache manager errors in tests or if not available
        console.debug('Cache manager not available for offline queuing');
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  public async removeBookmark(userId: string, diseaseId: string): Promise<void> {
    try {
      const bookmarks = await this.getAllBookmarks();
      const filteredBookmarks = bookmarks.filter(
        b => !(b.userId === userId && b.diseaseId === diseaseId)
      );
      
      await this.saveBookmarks(filteredBookmarks);

      // Queue for sync if offline (optional - avoid circular dependency in tests)
      try {
        const { cacheManager } = await import('./cacheManager');
        const isOnline = await cacheManager.getConnectivityStatus();
        if (!isOnline) {
          await cacheManager.queueOfflineAction({
            type: 'bookmark_remove',
            data: { userId, diseaseId },
            timestamp: new Date()
          });
        }
      } catch (error) {
        // Ignore cache manager errors in tests or if not available
        console.debug('Cache manager not available for offline queuing');
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  public async isBookmarked(userId: string, diseaseId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getAllBookmarks();
      return bookmarks.some(b => b.userId === userId && b.diseaseId === diseaseId);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  public async getUserBookmarkNotes(userId: string, diseaseId: string): Promise<string> {
    try {
      const bookmarks = await this.getAllBookmarks();
      const bookmark = bookmarks.find(b => b.userId === userId && b.diseaseId === diseaseId);
      return bookmark?.note || '';
    } catch (error) {
      console.error('Error getting bookmark notes:', error);
      return '';
    }
  }

  public async updateBookmarkNote(userId: string, diseaseId: string, note: string): Promise<void> {
    try {
      const bookmarks = await this.getAllBookmarks();
      const bookmarkIndex = bookmarks.findIndex(
        b => b.userId === userId && b.diseaseId === diseaseId
      );

      if (bookmarkIndex !== -1) {
        bookmarks[bookmarkIndex].note = note;
        bookmarks[bookmarkIndex].updatedAt = new Date();
        await this.saveBookmarks(bookmarks);

        // Queue for sync if offline (optional - avoid circular dependency in tests)
        try {
          const { cacheManager } = await import('./cacheManager');
          const isOnline = await cacheManager.getConnectivityStatus();
          if (!isOnline) {
            await cacheManager.queueOfflineAction({
              type: 'bookmark_note_update',
              data: { userId, diseaseId, note },
              timestamp: new Date()
            });
          }
        } catch (error) {
          // Ignore cache manager errors in tests or if not available
          console.debug('Cache manager not available for offline queuing');
        }
      }
    } catch (error) {
      console.error('Error updating bookmark note:', error);
      throw error;
    }
  }

  public async getUserBookmarks(userId: string): Promise<DiseaseBookmark[]> {
    try {
      const bookmarks = await this.getAllBookmarks();
      return bookmarks.filter(bookmark => bookmark.userId === userId);
    } catch (error) {
      console.error('Error getting user bookmarks:', error);
      return [];
    }
  }

  private async getAllBookmarks(): Promise<DiseaseBookmark[]> {
    try {
      const bookmarksData = await AsyncStorage.getItem(this.bookmarksKey);
      if (bookmarksData) {
        const parsed = JSON.parse(bookmarksData);
        // Convert date strings back to Date objects
        return parsed.map((bookmark: any) => ({
          ...bookmark,
          createdAt: new Date(bookmark.createdAt),
          updatedAt: new Date(bookmark.updatedAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  }

  private async saveBookmarks(bookmarks: DiseaseBookmark[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.bookmarksKey, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
      throw error;
    }
  }

  public async clearUserBookmarks(userId: string): Promise<void> {
    try {
      const bookmarks = await this.getAllBookmarks();
      const filteredBookmarks = bookmarks.filter(b => b.userId !== userId);
      await this.saveBookmarks(filteredBookmarks);
    } catch (error) {
      console.error('Error clearing user bookmarks:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const bookmarkService = BookmarkService.getInstance();