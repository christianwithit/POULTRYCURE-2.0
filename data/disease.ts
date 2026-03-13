// data/diseases.ts
import { DiseaseInfo, ExtendedDiseaseInfo } from '../types/types';

export const POULTRY_DISEASES: Record<string, DiseaseInfo> = {
  'Newcastle Disease': {
    name: 'Newcastle Disease',
    symptoms: [
      'respiratory distress',
      'diarrhea',
      'greenish watery droppings',
      'twisted neck',
      'paralysis',
      'decreased egg production',
      'soft-shelled eggs',
      'gasping',
      'coughing',
      'sneezing'
    ],
    treatment: 'No specific treatment. Supportive care with antibiotics to prevent secondary infections. Isolate affected birds immediately.',
    prevention: 'Regular vaccination (live or killed vaccines), strict biosecurity measures, quarantine new birds.',
    severity: 'high',
    description: 'A highly contagious viral disease affecting most bird species. Can cause up to 100% mortality in unvaccinated flocks.',
    commonIn: ['chickens', 'turkeys', 'ducks', 'geese']
  },
  
  'Fowl Cholera': {
    name: 'Fowl Cholera',
    symptoms: [
      'sudden death',
      'swelling of wattles',
      'swelling of joints',
      'fever',
      'greenish diarrhea',
      'loss of appetite',
      'ruffled feathers',
      'labored breathing',
      'mucus discharge from mouth'
    ],
    treatment: 'Antibiotics: Sulfonamides, Tetracyclines, or Penicillin. Early treatment is crucial for recovery.',
    prevention: 'Vaccination, good sanitation, proper ventilation, rodent control, avoid overcrowding.',
    severity: 'high',
    description: 'A bacterial disease caused by Pasteurella multocida. Can occur in acute or chronic forms.',
    commonIn: ['chickens', 'turkeys', 'ducks', 'geese']
  },

  'Infectious Bronchitis': {
    name: 'Infectious Bronchitis',
    symptoms: [
      'coughing',
      'sneezing',
      'nasal discharge',
      'gasping',
      'watery eyes',
      'decreased egg production',
      'soft-shelled eggs',
      'wrinkled eggs',
      'loss of appetite'
    ],
    treatment: 'No specific treatment. Provide supportive care, maintain optimal temperature, prevent secondary infections with antibiotics.',
    prevention: 'Vaccination at day-old and boosters, good ventilation, biosecurity measures.',
    severity: 'moderate',
    description: 'A highly contagious viral respiratory disease. Primarily affects the respiratory tract, but can also affect the reproductive system.',
    commonIn: ['chickens']
  },

  'Coccidiosis': {
    name: 'Coccidiosis',
    symptoms: [
      'bloody diarrhea',
      'droopiness',
      'loss of appetite',
      'ruffled feathers',
      'weight loss',
      'pale comb',
      'decreased growth',
      'huddling'
    ],
    treatment: 'Anticoccidial drugs: Amprolium, Sulfadimethoxine, or Toltrazuril. Provide clean water and electrolytes.',
    prevention: 'Coccidiostats in feed, good litter management, avoid dampness, gradual immunity development.',
    severity: 'moderate',
    description: 'A parasitic disease affecting the intestinal tract. Common in young birds (3-6 weeks old).',
    commonIn: ['chickens', 'turkeys', 'ducks', 'geese']
  },

  'Fowl Pox': {
    name: 'Fowl Pox',
    symptoms: [
      'wart-like nodules',
      'scabs on comb',
      'scabs on wattles',
      'scabs around eyes',
      'difficulty breathing',
      'decreased egg production',
      'weight loss',
      'yellow lesions in mouth'
    ],
    treatment: 'No specific treatment. Remove scabs with tweezers, apply iodine or antiseptic. Provide supportive care.',
    prevention: 'Vaccination, mosquito control, good sanitation, avoid introducing new birds without quarantine.',
    severity: 'moderate',
    description: 'A viral disease transmitted by mosquitoes or direct contact. Exists in dry (skin) and wet (diphtheritic) forms.',
    commonIn: ['chickens', 'turkeys', 'pigeons']
  },

  'Marek\'s Disease': {
    name: 'Marek\'s Disease',
    symptoms: [
      'paralysis of legs',
      'paralysis of wings',
      'twisted neck',
      'gray iris',
      'irregular pupil',
      'weight loss',
      'tumors',
      'depression'
    ],
    treatment: 'No treatment available. Cull severely affected birds to prevent disease spread.',
    prevention: 'Vaccination at hatch (day-old chicks), strict biosecurity, genetic resistance selection.',
    severity: 'high',
    description: 'A highly contagious viral disease causing tumors and paralysis. Affects young chickens (3-4 months).',
    commonIn: ['chickens']
  },

  'Infectious Coryza': {
    name: 'Infectious Coryza',
    symptoms: [
      'nasal discharge',
      'facial swelling',
      'swollen eyes',
      'foul smell',
      'decreased egg production',
      'loss of appetite',
      'sneezing',
      'rattling breathing'
    ],
    treatment: 'Antibiotics: Sulfadimethoxine, Erythromycin, or Trimethoprim. Treat entire flock.',
    prevention: 'All-in/all-out management, vaccination, avoid mixing different age groups, good ventilation.',
    severity: 'moderate',
    description: 'A bacterial respiratory disease causing characteristic facial swelling. Highly contagious within flocks.',
    commonIn: ['chickens']
  },

  'Avian Influenza': {
    name: 'Avian Influenza',
    symptoms: [
      'sudden death',
      'respiratory distress',
      'swelling of head',
      'blue discoloration of comb',
      'diarrhea',
      'decreased egg production',
      'soft-shelled eggs',
      'depression',
      'lack of coordination'
    ],
    treatment: 'No treatment. Highly reportable disease - contact veterinary authorities immediately. Quarantine and culling may be required.',
    prevention: 'Strict biosecurity, limit wild bird contact, vaccination in endemic areas, monitor and report suspicious deaths.',
    severity: 'high',
    description: 'A highly contagious viral disease. Low pathogenic strains cause mild symptoms; highly pathogenic strains cause severe disease and death.',
    commonIn: ['chickens', 'turkeys', 'ducks', 'geese', 'all poultry']
  }
};

// Helper function to match symptoms to diseases
export function matchDisease(symptomInput: string): {
  disease: string;
  confidence: number;
  info: DiseaseInfo;
}[] {
  const input = symptomInput.toLowerCase();
  const results: { disease: string; confidence: number; info: DiseaseInfo }[] = [];

  Object.entries(POULTRY_DISEASES).forEach(([diseaseName, diseaseInfo]) => {
    let matchCount = 0;
    let totalSymptoms = diseaseInfo.symptoms.length;

    diseaseInfo.symptoms.forEach(symptom => {
      if (input.includes(symptom.toLowerCase())) {
        matchCount++;
      }
    });

    if (matchCount > 0) {
      const confidence = Math.min((matchCount / totalSymptoms) * 100, 95);
      results.push({
        disease: diseaseName,
        confidence: Math.round(confidence),
        info: diseaseInfo
      });
    }
  });

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);
  
  return results.slice(0, 3); // Return top 3 matches
}
// Enhanced Disease Data for Glossary Feature
export const ENHANCED_POULTRY_DISEASES: Record<string, ExtendedDiseaseInfo> = {
  'newcastle-disease': {
    id: 'newcastle-disease',
    name: 'Newcastle Disease',
    category: 'viral',
    symptoms: [
      'respiratory distress',
      'diarrhea',
      'greenish watery droppings',
      'twisted neck',
      'paralysis',
      'decreased egg production',
      'soft-shelled eggs',
      'gasping',
      'coughing',
      'sneezing'
    ],
    causes: [
      'Newcastle Disease Virus (NDV)',
      'Paramyxovirus type 1',
      'Contact with infected birds',
      'Contaminated equipment',
      'Wild bird carriers'
    ],
    treatment: 'No specific treatment. Supportive care with antibiotics to prevent secondary infections. Isolate affected birds immediately.',
    prevention: 'Regular vaccination (live or killed vaccines), strict biosecurity measures, quarantine new birds.',
    severity: 'high',
    description: 'A highly contagious viral disease affecting most bird species. Can cause up to 100% mortality in unvaccinated flocks.',
    commonIn: ['chickens', 'turkeys', 'ducks', 'geese'],
    transmission: {
      method: 'airborne',
      contagiousness: 'high',
      quarantinePeriod: '21 days'
    },
    incubationPeriod: '2-15 days (average 5-6 days)',
    mortality: {
      rate: '50-100%',
      timeframe: '2-12 days',
      ageGroups: [
        { ageGroup: 'Chicks (0-4 weeks)', mortalityRate: '90-100%' },
        { ageGroup: 'Young birds (4-20 weeks)', mortalityRate: '50-90%' },
        { ageGroup: 'Adult birds (>20 weeks)', mortalityRate: '10-50%' }
      ]
    },
    images: [
      {
        id: 'newcastle-1',
        url: 'https://example.com/images/newcastle-respiratory.jpg',
        caption: 'Respiratory distress and gasping in affected chickens',
        type: 'symptom'
      },
      {
        id: 'newcastle-2',
        url: 'https://example.com/images/newcastle-twisted-neck.jpg',
        caption: 'Characteristic twisted neck (torticollis) in Newcastle disease',
        type: 'symptom'
      },
      {
        id: 'newcastle-3',
        url: 'https://example.com/images/newcastle-lesions.jpg',
        caption: 'Post-mortem lesions in the respiratory tract',
        type: 'lesion'
      }
    ],
    relatedDiseases: ['avian-influenza', 'infectious-bronchitis'],
    lastUpdated: new Date('2024-01-15'),
    sources: [
      'OIE Manual of Diagnostic Tests and Vaccines',
      'Merck Veterinary Manual',
      'Poultry Disease Handbook'
    ],
    tags: ['viral', 'respiratory', 'neurological', 'high-mortality', 'reportable']
  },

  'fowl-cholera': {
    id: 'fowl-cholera',
    name: 'Fowl Cholera',
    category: 'bacterial',
    symptoms: [
      'sudden death',
      'swelling of wattles',
      'swelling of joints',
      'fever',
      'greenish diarrhea',
      'loss of appetite',
      'ruffled feathers',
      'labored breathing',
      'mucus discharge from mouth'
    ],
    causes: [
      'Pasteurella multocida bacteria',
      'Stress factors',
      'Poor sanitation',
      'Overcrowding',
      'Contaminated water or feed'
    ],
    treatment: 'Antibiotics: Sulfonamides, Tetracyclines, or Penicillin. Early treatment is crucial for recovery.',
    prevention: 'Vaccination, good sanitation, proper ventilation, rodent control, avoid overcrowding.',
    severity: 'high',
    description: 'A bacterial disease caused by Pasteurella multocida. Can occur in acute or chronic forms.',
    commonIn: ['chickens', 'turkeys', 'ducks', 'geese'],
    transmission: {
      method: 'direct',
      contagiousness: 'high',
      quarantinePeriod: '14 days'
    },
    incubationPeriod: '4-9 days',
    mortality: {
      rate: '0-20% (chronic) to 100% (acute)',
      timeframe: '6-12 hours (acute) to several weeks (chronic)',
      ageGroups: [
        { ageGroup: 'Young birds (<12 weeks)', mortalityRate: '80-100%' },
        { ageGroup: 'Adult birds (>12 weeks)', mortalityRate: '5-50%' }
      ]
    },
    images: [
      {
        id: 'fowl-cholera-1',
        url: 'https://example.com/images/fowl-cholera-swelling.jpg',
        caption: 'Swelling of wattles and facial area in fowl cholera',
        type: 'symptom'
      },
      {
        id: 'fowl-cholera-2',
        url: 'https://example.com/images/fowl-cholera-lesions.jpg',
        caption: 'Hemorrhagic lesions in liver and spleen',
        type: 'lesion'
      }
    ],
    relatedDiseases: ['infectious-coryza', 'fowl-typhoid'],
    lastUpdated: new Date('2024-01-15'),
    sources: [
      'Diseases of Poultry 14th Edition',
      'Merck Veterinary Manual'
    ],
    tags: ['bacterial', 'septicemic', 'sudden-death', 'treatable']
  },

  'infectious-bronchitis': {
    id: 'infectious-bronchitis',
    name: 'Infectious Bronchitis',
    category: 'viral',
    symptoms: [
      'coughing',
      'sneezing',
      'nasal discharge',
      'gasping',
      'watery eyes',
      'decreased egg production',
      'soft-shelled eggs',
      'wrinkled eggs',
      'loss of appetite'
    ],
    causes: [
      'Infectious Bronchitis Virus (IBV)',
      'Coronavirus',
      'Multiple serotypes',
      'Airborne transmission',
      'Contaminated equipment'
    ],
    treatment: 'No specific treatment. Provide supportive care, maintain optimal temperature, prevent secondary infections with antibiotics.',
    prevention: 'Vaccination at day-old and boosters, good ventilation, biosecurity measures.',
    severity: 'moderate',
    description: 'A highly contagious viral respiratory disease. Primarily affects the respiratory tract, but can also affect the reproductive system.',
    commonIn: ['chickens'],
    transmission: {
      method: 'airborne',
      contagiousness: 'high',
      quarantinePeriod: '18-21 days'
    },
    incubationPeriod: '18-36 hours',
    mortality: {
      rate: '25-30% (young chicks) to 5% (adults)',
      timeframe: '4-7 days',
      ageGroups: [
        { ageGroup: 'Chicks (0-3 weeks)', mortalityRate: '25-30%' },
        { ageGroup: 'Growing birds (3-20 weeks)', mortalityRate: '5-10%' },
        { ageGroup: 'Adult layers (>20 weeks)', mortalityRate: '1-5%' }
      ]
    },
    images: [],
    relatedDiseases: ['newcastle-disease', 'infectious-laryngotracheitis'],
    lastUpdated: new Date('2024-01-15'),
    sources: [
      'Diseases of Poultry 14th Edition',
      'Avian Disease Manual'
    ],
    tags: ['viral', 'respiratory', 'egg-production', 'vaccine-preventable']
  },

  'coccidiosis': {
    id: 'coccidiosis',
    name: 'Coccidiosis',
    category: 'parasitic',
    symptoms: [
      'bloody diarrhea',
      'droopiness',
      'loss of appetite',
      'ruffled feathers',
      'weight loss',
      'pale comb',
      'decreased growth',
      'huddling'
    ],
    causes: [
      'Eimeria species protozoa',
      'Eimeria tenella',
      'Eimeria necatrix',
      'Eimeria acervulina',
      'Poor litter management',
      'Overcrowding',
      'Damp conditions'
    ],
    treatment: 'Anticoccidial drugs: Amprolium, Sulfadimethoxine, or Toltrazuril. Provide clean water and electrolytes.',
    prevention: 'Coccidiostats in feed, good litter management, avoid dampness, gradual immunity development.',
    severity: 'moderate',
    description: 'A parasitic disease affecting the intestinal tract. Common in young birds (3-6 weeks old).',
    commonIn: ['chickens', 'turkeys', 'ducks', 'geese'],
    transmission: {
      method: 'indirect',
      contagiousness: 'moderate',
      quarantinePeriod: '7-10 days'
    },
    incubationPeriod: '4-7 days',
    mortality: {
      rate: '10-80% depending on species and management',
      timeframe: '5-7 days after onset',
      ageGroups: [
        { ageGroup: 'Chicks (3-6 weeks)', mortalityRate: '50-80%' },
        { ageGroup: 'Growing birds (6-12 weeks)', mortalityRate: '10-30%' },
        { ageGroup: 'Adult birds (>12 weeks)', mortalityRate: '5-10%' }
      ]
    },
    images: [],
    relatedDiseases: ['necrotic-enteritis', 'blackhead'],
    lastUpdated: new Date('2024-01-15'),
    sources: [
      'Coccidiosis in Poultry - FAO Manual',
      'Merck Veterinary Manual'
    ],
    tags: ['parasitic', 'intestinal', 'young-birds', 'treatable', 'preventable']
  },

  'fowl-pox': {
    id: 'fowl-pox',
    name: 'Fowl Pox',
    category: 'viral',
    symptoms: [
      'wart-like nodules',
      'scabs on comb',
      'scabs on wattles',
      'scabs around eyes',
      'difficulty breathing',
      'decreased egg production',
      'weight loss',
      'yellow lesions in mouth'
    ],
    causes: [
      'Fowl Pox Virus',
      'Avipoxvirus',
      'Mosquito transmission',
      'Direct contact',
      'Contaminated surfaces',
      'Wound contamination'
    ],
    treatment: 'No specific treatment. Remove scabs with tweezers, apply iodine or antiseptic. Provide supportive care.',
    prevention: 'Vaccination, mosquito control, good sanitation, avoid introducing new birds without quarantine.',
    severity: 'moderate',
    description: 'A viral disease transmitted by mosquitoes or direct contact. Exists in dry (skin) and wet (diphtheritic) forms.',
    commonIn: ['chickens', 'turkeys', 'pigeons'],
    transmission: {
      method: 'vector',
      contagiousness: 'moderate',
      quarantinePeriod: '14-21 days'
    },
    incubationPeriod: '4-10 days',
    mortality: {
      rate: '0-50% depending on form',
      timeframe: '2-4 weeks',
      ageGroups: [
        { ageGroup: 'Young birds (<12 weeks)', mortalityRate: '10-50%' },
        { ageGroup: 'Adult birds (>12 weeks)', mortalityRate: '0-10%' }
      ]
    },
    images: [
      {
        id: 'fowl-pox-1',
        url: 'https://example.com/images/fowl-pox-nodules.jpg',
        caption: 'Characteristic wart-like nodules on comb and wattles',
        type: 'symptom'
      },
      {
        id: 'fowl-pox-2',
        url: 'https://example.com/images/fowl-pox-diphtheritic.jpg',
        caption: 'Diphtheritic form with yellow lesions in mouth and throat',
        type: 'symptom'
      },
      {
        id: 'fowl-pox-3',
        url: 'https://example.com/images/fowl-pox-treatment.jpg',
        caption: 'Proper removal and treatment of pox lesions',
        type: 'treatment'
      }
    ],
    relatedDiseases: ['canary-pox', 'pigeon-pox'],
    lastUpdated: new Date('2024-01-15'),
    sources: [
      'Diseases of Poultry 14th Edition',
      'Poxvirus Infections in Birds'
    ],
    tags: ['viral', 'skin-lesions', 'mosquito-borne', 'vaccine-preventable']
  },

  'mareks-disease': {
    id: 'mareks-disease',
    name: 'Marek\'s Disease',
    category: 'viral',
    symptoms: [
      'paralysis of legs',
      'paralysis of wings',
      'twisted neck',
      'gray iris',
      'irregular pupil',
      'weight loss',
      'tumors',
      'depression'
    ],
    causes: [
      'Marek\'s Disease Virus (MDV)',
      'Herpesvirus',
      'Airborne transmission',
      'Feather follicle dander',
      'Contaminated environment'
    ],
    treatment: 'No treatment available. Cull severely affected birds to prevent disease spread.',
    prevention: 'Vaccination at hatch (day-old chicks), strict biosecurity, genetic resistance selection.',
    severity: 'high',
    description: 'A highly contagious viral disease causing tumors and paralysis. Affects young chickens (3-4 months).',
    commonIn: ['chickens'],
    transmission: {
      method: 'airborne',
      contagiousness: 'high',
      quarantinePeriod: 'Lifelong shedding'
    },
    incubationPeriod: '2-16 weeks',
    mortality: {
      rate: '10-50%',
      timeframe: 'Chronic progression over weeks',
      ageGroups: [
        { ageGroup: 'Young birds (6-20 weeks)', mortalityRate: '30-50%' },
        { ageGroup: 'Adult birds (>20 weeks)', mortalityRate: '10-30%' }
      ]
    },
    images: [],
    relatedDiseases: ['lymphoid-leukosis', 'reticuloendotheliosis'],
    lastUpdated: new Date('2024-01-15'),
    sources: [
      'Marek\'s Disease - OIE Manual',
      'Diseases of Poultry 14th Edition'
    ],
    tags: ['viral', 'oncogenic', 'neurological', 'vaccine-preventable', 'tumors']
  },

  'infectious-coryza': {
    id: 'infectious-coryza',
    name: 'Infectious Coryza',
    category: 'bacterial',
    symptoms: [
      'nasal discharge',
      'facial swelling',
      'swollen eyes',
      'foul smell',
      'decreased egg production',
      'loss of appetite',
      'sneezing',
      'rattling breathing'
    ],
    causes: [
      'Avibacterium paragallinarum',
      'Poor ventilation',
      'Stress factors',
      'Mixing different age groups',
      'Contaminated water'
    ],
    treatment: 'Antibiotics: Sulfadimethoxine, Erythromycin, or Trimethoprim. Treat entire flock.',
    prevention: 'All-in/all-out management, vaccination, avoid mixing different age groups, good ventilation.',
    severity: 'moderate',
    description: 'A bacterial respiratory disease causing characteristic facial swelling. Highly contagious within flocks.',
    commonIn: ['chickens'],
    transmission: {
      method: 'direct',
      contagiousness: 'high',
      quarantinePeriod: '14-21 days'
    },
    incubationPeriod: '1-3 days',
    mortality: {
      rate: '0-20%',
      timeframe: '7-14 days',
      ageGroups: [
        { ageGroup: 'Young birds (<12 weeks)', mortalityRate: '10-20%' },
        { ageGroup: 'Adult birds (>12 weeks)', mortalityRate: '0-10%' }
      ]
    },
    images: [],
    relatedDiseases: ['fowl-cholera', 'chronic-respiratory-disease'],
    lastUpdated: new Date('2024-01-15'),
    sources: [
      'Infectious Coryza - Poultry Hub',
      'Merck Veterinary Manual'
    ],
    tags: ['bacterial', 'respiratory', 'facial-swelling', 'treatable']
  },

  'avian-influenza': {
    id: 'avian-influenza',
    name: 'Avian Influenza',
    category: 'viral',
    symptoms: [
      'sudden death',
      'respiratory distress',
      'swelling of head',
      'blue discoloration of comb',
      'diarrhea',
      'decreased egg production',
      'soft-shelled eggs',
      'depression',
      'lack of coordination'
    ],
    causes: [
      'Influenza A virus',
      'H5N1, H7N9 and other subtypes',
      'Wild bird reservoirs',
      'Contaminated equipment',
      'Airborne transmission'
    ],
    treatment: 'No treatment. Highly reportable disease - contact veterinary authorities immediately. Quarantine and culling may be required.',
    prevention: 'Strict biosecurity, limit wild bird contact, vaccination in endemic areas, monitor and report suspicious deaths.',
    severity: 'high',
    description: 'A highly contagious viral disease. Low pathogenic strains cause mild symptoms; highly pathogenic strains cause severe disease and death.',
    commonIn: ['chickens', 'turkeys', 'ducks', 'geese', 'all poultry'],
    transmission: {
      method: 'airborne',
      contagiousness: 'high',
      quarantinePeriod: '21 days minimum'
    },
    incubationPeriod: '3-5 days (range 1-7 days)',
    mortality: {
      rate: '0-100% depending on pathogenicity',
      timeframe: '24-48 hours (HPAI) to weeks (LPAI)',
      ageGroups: [
        { ageGroup: 'All ages (HPAI)', mortalityRate: '90-100%' },
        { ageGroup: 'All ages (LPAI)', mortalityRate: '0-10%' }
      ]
    },
    images: [],
    relatedDiseases: ['newcastle-disease', 'fowl-plague'],
    lastUpdated: new Date('2024-01-15'),
    sources: [
      'OIE Avian Influenza Manual',
      'WHO Avian Influenza Fact Sheet',
      'USDA APHIS Guidelines'
    ],
    tags: ['viral', 'reportable', 'zoonotic', 'high-pathogenic', 'wild-birds']
  }
};