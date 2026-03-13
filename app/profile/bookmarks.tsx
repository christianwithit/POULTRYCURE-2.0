import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DiseaseCard from '../../components/glossary/DiseaseCard';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { bookmarkService } from '../../services/bookmarkService';
import { diseaseService } from '../../services/diseaseService';
import { DiseaseBookmark, ExtendedDiseaseInfo } from '../../types/types';

interface BookmarkedDisease extends ExtendedDiseaseInfo {
  bookmark: DiseaseBookmark;
}

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [bookmarkedDiseases, setBookmarkedDiseases] = useState<BookmarkedDisease[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (user) {
      loadBookmarkedDiseases();
    }
  }, [user]);

  const loadBookmarkedDiseases = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const bookmarks = await bookmarkService.getUserBookmarks(user.id);
      
      // Get disease details for each bookmark
      const diseasesWithBookmarks = await Promise.all(
        bookmarks.map(async (bookmark) => {
          const disease = await diseaseService.getDiseaseById(bookmark.diseaseId);
          if (disease) {
            return {
              ...disease,
              bookmark,
            };
          }
          return null;
        })
      );

      // Filter out null values and sort by bookmark creation date (newest first)
      const validDiseases = diseasesWithBookmarks
        .filter((item): item is BookmarkedDisease => item !== null)
        .sort((a, b) => b.bookmark.createdAt.getTime() - a.bookmark.createdAt.getTime());

      setBookmarkedDiseases(validDiseases);
    } catch (error) {
      console.error('Error loading bookmarked diseases:', error);
      Alert.alert('Error', 'Failed to load bookmarked diseases');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (diseaseId: string) => {
    if (!user) return;

    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this disease from your bookmarks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookmarkService.removeBookmark(user.id, diseaseId);
              setBookmarkedDiseases(prev => 
                prev.filter(disease => disease.id !== diseaseId)
              );
            } catch (error) {
              console.error('Error removing bookmark:', error);
              Alert.alert('Error', 'Failed to remove bookmark');
            }
          },
        },
      ]
    );
  };

  const handleEditNote = (diseaseId: string, currentNote: string) => {
    setEditingNote(diseaseId);
    setNoteText(currentNote);
  };

  const handleSaveNote = async () => {
    if (!user || !editingNote) return;

    try {
      await bookmarkService.updateBookmarkNote(user.id, editingNote, noteText);
      
      // Update local state
      setBookmarkedDiseases(prev =>
        prev.map(disease =>
          disease.id === editingNote
            ? {
                ...disease,
                bookmark: {
                  ...disease.bookmark,
                  note: noteText,
                  updatedAt: new Date(),
                },
              }
            : disease
        )
      );
      
      setEditingNote(null);
      setNoteText('');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setNoteText('');
  };

  const handleDiseasePress = (diseaseId: string) => {
    router.push(`/glossary/${diseaseId}` as any);
  };

  const renderBookmarkedDisease = useCallback(({ item }: { item: BookmarkedDisease }) => (
    <View style={styles.bookmarkContainer}>
      <DiseaseCard
        disease={item}
        onPress={() => handleDiseasePress(item.id)}
        isBookmarked={true}
        onBookmarkToggle={() => handleRemoveBookmark(item.id)}
      />
      
      <View style={styles.bookmarkDetails}>
        <View style={styles.bookmarkMeta}>
          <Text style={styles.bookmarkDate}>
            Bookmarked on {item.bookmark.createdAt.toLocaleDateString()}
          </Text>
          {item.bookmark.updatedAt.getTime() !== item.bookmark.createdAt.getTime() && (
            <Text style={styles.bookmarkUpdated}>
              Note updated {item.bookmark.updatedAt.toLocaleDateString()}
            </Text>
          )}
        </View>

        {editingNote === item.id ? (
          <View style={styles.noteEditContainer}>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add your notes about this disease..."
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <View style={styles.noteActions}>
              <TouchableOpacity
                style={[styles.noteButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.noteButton, styles.saveButton]}
                onPress={handleSaveNote}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noteDisplayContainer}>
            {item.bookmark.note ? (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Your notes:</Text>
                <Text style={styles.noteText}>{item.bookmark.note}</Text>
              </View>
            ) : (
              <Text style={styles.noNoteText}>No notes added</Text>
            )}
            <TouchableOpacity
              style={styles.editNoteButton}
              onPress={() => handleEditNote(item.id, item.bookmark.note || '')}
            >
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={styles.editNoteText}>
                {item.bookmark.note ? 'Edit note' : 'Add note'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  ), [editingNote, noteText]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>No Bookmarked Diseases</Text>
      <Text style={styles.emptyText}>
        Start bookmarking diseases from the glossary to build your personal reference collection.
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.push('/(tabs)/glossary')}
      >
        <Text style={styles.browseButtonText}>Browse Glossary</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Loading bookmarked diseases...</Text>
    </View>
  );

  const keyExtractor = useCallback((item: BookmarkedDisease) => item.bookmark.id, []);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookmarked Diseases</Text>
          <View style={styles.headerSpacer} />
        </View>
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookmarked Diseases</Text>
        <View style={styles.headerSpacer} />
      </View>

      {bookmarkedDiseases.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {bookmarkedDiseases.length} disease{bookmarkedDiseases.length !== 1 ? 's' : ''} bookmarked
          </Text>
        </View>
      )}

      <FlatList
        data={bookmarkedDiseases}
        renderItem={renderBookmarkedDisease}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          bookmarkedDiseases.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  statsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  bookmarkContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  bookmarkDetails: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bookmarkMeta: {
    marginBottom: SPACING.sm,
  },
  bookmarkDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  bookmarkUpdated: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  noteDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  noteLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  noteText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  noNoteText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    flex: 1,
    marginRight: SPACING.md,
  },
  editNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
  },
  editNoteText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  noteEditContainer: {
    marginTop: SPACING.sm,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: SPACING.sm,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  noteButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
});