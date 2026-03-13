import { FilterCriteria } from '../../types/types';
import { DiseaseService } from '../diseaseService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('DiseaseService', () => {
  let diseaseService: DiseaseService;

  beforeEach(() => {
    diseaseService = DiseaseService.getInstance();
  });

  describe('getAllDiseases', () => {
    it('should return all diseases', async () => {
      const diseases = await diseaseService.getAllDiseases();
      expect(diseases).toBeDefined();
      expect(diseases.length).toBeGreaterThan(0);
      expect(diseases[0]).toHaveProperty('id');
      expect(diseases[0]).toHaveProperty('name');
      expect(diseases[0]).toHaveProperty('category');
    });
  });

  describe('getDiseaseById', () => {
    it('should return a specific disease by ID', async () => {
      const disease = await diseaseService.getDiseaseById('newcastle-disease');
      expect(disease).toBeDefined();
      expect(disease?.name).toBe('Newcastle Disease');
      expect(disease?.category).toBe('viral');
    });

    it('should return null for non-existent disease', async () => {
      const disease = await diseaseService.getDiseaseById('non-existent');
      expect(disease).toBeNull();
    });
  });

  describe('searchDiseases', () => {
    it('should search diseases by name', async () => {
      const results = await diseaseService.searchDiseases('Newcastle');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Newcastle');
    });

    it('should search diseases by symptoms', async () => {
      const results = await diseaseService.searchDiseases('respiratory distress');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(d => d.symptoms.includes('respiratory distress'))).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const results = await diseaseService.searchDiseases('nonexistentsymptom');
      expect(results).toEqual([]);
    });
  });

  describe('getDiseasesbyCategory', () => {
    it('should return viral diseases', async () => {
      const viralDiseases = await diseaseService.getDiseasesbyCategory('viral');
      expect(viralDiseases.length).toBeGreaterThan(0);
      viralDiseases.forEach(disease => {
        expect(disease.category).toBe('viral');
      });
    });

    it('should return bacterial diseases', async () => {
      const bacterialDiseases = await diseaseService.getDiseasesbyCategory('bacterial');
      expect(bacterialDiseases.length).toBeGreaterThan(0);
      bacterialDiseases.forEach(disease => {
        expect(disease.category).toBe('bacterial');
      });
    });
  });

  describe('filtering', () => {
    it('should filter by category', async () => {
      const filters: FilterCriteria = {
        categories: ['viral'],
        severities: [],
        species: []
      };
      const results = await diseaseService.searchDiseases('', filters);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(disease => {
        expect(disease.category).toBe('viral');
      });
    });

    it('should filter by severity', async () => {
      const filters: FilterCriteria = {
        categories: [],
        severities: ['high'],
        species: []
      };
      const results = await diseaseService.searchDiseases('', filters);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(disease => {
        expect(disease.severity).toBe('high');
      });
    });

    it('should filter by species', async () => {
      const filters: FilterCriteria = {
        categories: [],
        severities: [],
        species: ['chickens']
      };
      const results = await diseaseService.searchDiseases('', filters);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(disease => {
        expect(disease.commonIn).toContain('chickens');
      });
    });
  });

  describe('getRelatedDiseases', () => {
    it('should return related diseases', async () => {
      const relatedDiseases = await diseaseService.getRelatedDiseases('newcastle-disease');
      expect(relatedDiseases).toBeDefined();
      expect(Array.isArray(relatedDiseases)).toBe(true);
    });
  });

  describe('getDiseaseStatistics', () => {
    it('should return disease statistics', async () => {
      const stats = await diseaseService.getDiseaseStatistics();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byCategory');
      expect(stats).toHaveProperty('bySeverity');
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions', async () => {
      const suggestions = await diseaseService.getSearchSuggestions('resp');
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should return empty array for short queries', async () => {
      const suggestions = await diseaseService.getSearchSuggestions('a');
      expect(suggestions).toEqual([]);
    });
  });

  describe('getRecommendedDiseases', () => {
    it('should return recommended diseases based on symptoms', async () => {
      const recommendations = await diseaseService.getRecommendedDiseases(
        ['respiratory distress', 'coughing'],
        'chickens'
      );
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty('disease');
        expect(recommendations[0]).toHaveProperty('score');
      }
    });
  });
});