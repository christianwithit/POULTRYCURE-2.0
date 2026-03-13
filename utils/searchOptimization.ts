/**
 * Search Performance Optimization Utilities
 * Advanced search algorithms and caching for better performance
 */

import { ExtendedDiseaseInfo } from '../types/types';
import { performanceMonitor } from './performanceMonitor';

export interface SearchIndex {
  [key: string]: Set<number>; // word -> set of disease indices
}

export interface SearchResult {
  disease: ExtendedDiseaseInfo;
  score: number;
  matchedFields: string[];
  highlightedText: Record<string, string>;
}

export interface SearchConfig {
  enableFuzzySearch: boolean;
  maxFuzzyDistance: number;
  enableStemming: boolean;
  enableSynonyms: boolean;
  boostFactors: {
    name: number;
    symptoms: number;
    description: number;
    causes: number;
    tags: number;
  };
}

class SearchOptimizer {
  private searchIndex: SearchIndex = {};
  private diseases: ExtendedDiseaseInfo[] = [];
  private synonyms: Map<string, string[]> = new Map();
  private stemCache: Map<string, string> = new Map();
  private searchCache: Map<string, SearchResult[]> = new Map();
  
  private config: SearchConfig = {
    enableFuzzySearch: true,
    maxFuzzyDistance: 2,
    enableStemming: true,
    enableSynonyms: true,
    boostFactors: {
      name: 3.0,
      symptoms: 2.0,
      description: 1.0,
      causes: 1.5,
      tags: 2.5,
    },
  };

  constructor(config?: Partial<SearchConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeSynonyms();
  }

  /**
   * Initialize synonym dictionary
   */
  private initializeSynonyms(): void {
    const synonymGroups = [
      ['bird', 'poultry', 'fowl', 'chicken', 'hen', 'rooster'],
      ['disease', 'illness', 'condition', 'disorder', 'infection'],
      ['symptom', 'sign', 'indication', 'manifestation'],
      ['treatment', 'therapy', 'cure', 'remedy', 'medication'],
      ['prevention', 'prophylaxis', 'precaution', 'protection'],
      ['respiratory', 'breathing', 'lung', 'airway'],
      ['digestive', 'gastrointestinal', 'stomach', 'intestinal'],
      ['viral', 'virus', 'viral infection'],
      ['bacterial', 'bacteria', 'bacterial infection'],
      ['parasitic', 'parasite', 'parasitic infection'],
    ];

    synonymGroups.forEach(group => {
      group.forEach(word => {
        this.synonyms.set(word.toLowerCase(), group.map(w => w.toLowerCase()));
      });
    });
  }

  /**
   * Build search index from diseases
   */
  public buildIndex(diseases: ExtendedDiseaseInfo[]): void {
    performanceMonitor.startMetric('search_index_build');
    
    this.diseases = diseases;
    this.searchIndex = {};
    this.searchCache.clear();

    diseases.forEach((disease, index) => {
      // Index all searchable fields
      const searchableText = [
        disease.name,
        disease.description,
        ...disease.symptoms,
        ...disease.causes,
        ...disease.tags,
        disease.category,
        disease.severity,
        ...disease.commonIn,
      ].join(' ').toLowerCase();

      // Tokenize and index
      const words = this.tokenize(searchableText);
      words.forEach(word => {
        const stemmed = this.stem(word);
        
        if (!this.searchIndex[stemmed]) {
          this.searchIndex[stemmed] = new Set();
        }
        this.searchIndex[stemmed].add(index);

        // Also index synonyms
        if (this.config.enableSynonyms) {
          const synonyms = this.synonyms.get(word) || [];
          synonyms.forEach(synonym => {
            const stemmedSynonym = this.stem(synonym);
            if (!this.searchIndex[stemmedSynonym]) {
              this.searchIndex[stemmedSynonym] = new Set();
            }
            this.searchIndex[stemmedSynonym].add(index);
          });
        }
      });
    });

    const indexTime = performanceMonitor.endMetric('search_index_build');
    console.log(`Search index built in ${indexTime}ms for ${diseases.length} diseases`);
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out very short words
  }

  /**
   * Simple stemming algorithm
   */
  private stem(word: string): string {
    if (this.stemCache.has(word)) {
      return this.stemCache.get(word)!;
    }

    let stemmed = word;
    
    // Simple suffix removal rules
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment'];
    
    for (const suffix of suffixes) {
      if (stemmed.endsWith(suffix) && stemmed.length > suffix.length + 2) {
        stemmed = stemmed.slice(0, -suffix.length);
        break;
      }
    }

    this.stemCache.set(word, stemmed);
    return stemmed;
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Find fuzzy matches for a word
   */
  private findFuzzyMatches(word: string): string[] {
    if (!this.config.enableFuzzySearch) return [];

    const matches: string[] = [];
    const indexKeys = Object.keys(this.searchIndex);

    for (const key of indexKeys) {
      const distance = this.levenshteinDistance(word, key);
      if (distance <= this.config.maxFuzzyDistance && distance > 0) {
        matches.push(key);
      }
    }

    return matches;
  }

  /**
   * Search diseases with advanced scoring
   */
  public search(query: string): SearchResult[] {
    if (!query.trim()) return [];

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    performanceMonitor.startMetric('search_query');

    const queryWords = this.tokenize(query);
    const diseaseScores: Map<number, { score: number; matchedFields: Set<string> }> = new Map();

    // Search for each query word
    queryWords.forEach(word => {
      const stemmed = this.stem(word);
      const matchingIndices = new Set<number>();

      // Exact matches
      if (this.searchIndex[stemmed]) {
        this.searchIndex[stemmed].forEach(index => matchingIndices.add(index));
      }

      // Fuzzy matches
      if (this.config.enableFuzzySearch) {
        const fuzzyMatches = this.findFuzzyMatches(stemmed);
        fuzzyMatches.forEach(match => {
          if (this.searchIndex[match]) {
            this.searchIndex[match].forEach(index => matchingIndices.add(index));
          }
        });
      }

      // Score matches
      matchingIndices.forEach(index => {
        const disease = this.diseases[index];
        const fieldScores = this.calculateFieldScores(disease, word);
        
        const existing = diseaseScores.get(index) || { score: 0, matchedFields: new Set() };
        existing.score += fieldScores.totalScore;
        
        Object.keys(fieldScores.fieldScores).forEach(field => {
          if (fieldScores.fieldScores[field] > 0) {
            existing.matchedFields.add(field);
          }
        });
        
        diseaseScores.set(index, existing);
      });
    });

    // Convert to results and sort by score
    const results: SearchResult[] = Array.from(diseaseScores.entries())
      .map(([index, { score, matchedFields }]) => ({
        disease: this.diseases[index],
        score,
        matchedFields: Array.from(matchedFields),
        highlightedText: this.generateHighlights(this.diseases[index], queryWords),
      }))
      .sort((a, b) => b.score - a.score);

    // Cache results
    this.searchCache.set(cacheKey, results);
    
    // Limit cache size
    if (this.searchCache.size > 100) {
      const firstKey = this.searchCache.keys().next().value;
      if (firstKey !== undefined) {
        this.searchCache.delete(firstKey);
      }
    }

    const searchTime = performanceMonitor.endMetric('search_query');
    
    performanceMonitor.trackSearchPerformance({
      queryLength: query.length,
      resultCount: results.length,
      searchTime: searchTime || 0,
      filterTime: 0,
      renderTime: 0,
    });

    return results;
  }

  /**
   * Calculate field-specific scores
   */
  private calculateFieldScores(disease: ExtendedDiseaseInfo, word: string): {
    totalScore: number;
    fieldScores: Record<string, number>;
  } {
    const fieldScores: Record<string, number> = {};
    
    // Check each field for matches
    const fields = {
      name: disease.name,
      description: disease.description,
      symptoms: disease.symptoms.join(' '),
      causes: disease.causes.join(' '),
      tags: disease.tags.join(' '),
    };

    Object.entries(fields).forEach(([field, text]) => {
      const fieldText = text.toLowerCase();
      const wordLower = word.toLowerCase();
      
      let score = 0;
      
      // Exact word match
      if (fieldText.includes(wordLower)) {
        score += 1;
        
        // Bonus for word boundary matches
        const wordBoundaryRegex = new RegExp(`\\b${wordLower}\\b`);
        if (wordBoundaryRegex.test(fieldText)) {
          score += 0.5;
        }
        
        // Bonus for position (earlier = better)
        const position = fieldText.indexOf(wordLower);
        const positionBonus = Math.max(0, 1 - (position / fieldText.length));
        score += positionBonus * 0.3;
      }
      
      // Apply field-specific boost
      const boostFactor = this.config.boostFactors[field as keyof typeof this.config.boostFactors] || 1;
      fieldScores[field] = score * boostFactor;
    });

    const totalScore = Object.values(fieldScores).reduce((sum, score) => sum + score, 0);
    
    return { totalScore, fieldScores };
  }

  /**
   * Generate highlighted text for search results
   */
  private generateHighlights(disease: ExtendedDiseaseInfo, queryWords: string[]): Record<string, string> {
    const highlights: Record<string, string> = {};
    
    const fields = {
      name: disease.name,
      description: disease.description,
      symptoms: disease.symptoms.join(', '),
    };

    Object.entries(fields).forEach(([field, text]) => {
      let highlightedText = text;
      
      queryWords.forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
      });
      
      highlights[field] = highlightedText;
    });

    return highlights;
  }

  /**
   * Get search suggestions
   */
  public getSuggestions(partialQuery: string, limit: number = 5): string[] {
    if (partialQuery.length < 2) return [];

    const suggestions = new Set<string>();
    const partialLower = partialQuery.toLowerCase();

    // Find matching words in index
    Object.keys(this.searchIndex).forEach(word => {
      if (word.startsWith(partialLower) && suggestions.size < limit) {
        suggestions.add(word);
      }
    });

    // Add fuzzy suggestions if not enough exact matches
    if (suggestions.size < limit && this.config.enableFuzzySearch) {
      const fuzzyMatches = this.findFuzzyMatches(partialLower);
      fuzzyMatches.slice(0, limit - suggestions.size).forEach(match => {
        suggestions.add(match);
      });
    }

    return Array.from(suggestions);
  }

  /**
   * Clear search cache
   */
  public clearCache(): void {
    this.searchCache.clear();
    this.stemCache.clear();
  }

  /**
   * Update search configuration
   */
  public updateConfig(newConfig: Partial<SearchConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.clearCache(); // Clear cache when config changes
  }

  /**
   * Get search statistics
   */
  public getSearchStats(): {
    indexSize: number;
    cacheSize: number;
    totalDiseases: number;
    averageWordsPerDisease: number;
  } {
    const totalWords = Object.keys(this.searchIndex).length;
    const averageWords = this.diseases.length > 0 ? totalWords / this.diseases.length : 0;

    return {
      indexSize: totalWords,
      cacheSize: this.searchCache.size,
      totalDiseases: this.diseases.length,
      averageWordsPerDisease: averageWords,
    };
  }
}

// Singleton instance
export const searchOptimizer = new SearchOptimizer();

export default searchOptimizer;