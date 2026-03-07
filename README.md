# PoultryCure 🐔

A comprehensive mobile application for poultry disease diagnosis and management, powered by AI and built with React Native/Expo.

## Overview

PoultryCure is a sophisticated mobile application designed to help poultry farmers, veterinarians, and enthusiasts identify and manage poultry diseases through AI-powered analysis. The app supports both symptom-based and image-based diagnosis, with offline capabilities and real-time synchronization.

## Key Features

### 🤖 AI-Powered Diagnosis
- **Symptom Analysis**: Input symptoms and get AI-powered disease identification
- **Image Recognition**: Capture or upload images of poultry for visual disease detection
- **Google Gemini Integration**: Uses advanced AI models for accurate diagnosis
- **Confidence Scoring**: Provides confidence levels for all diagnoses

### 📚 Comprehensive Disease Database
- **Extensive Disease Library**: Covers viral, bacterial, parasitic, nutritional, genetic, and environmental diseases
- **Detailed Information**: Symptoms, treatments, prevention, transmission, and mortality data
- **Search & Filter**: Advanced search with filtering by category, severity, and species
- **Offline Access**: Full disease database available offline

### 👤 User Management
- **Secure Authentication**: User signup/login with Supabase authentication
- **Profile Management**: User profiles with preferences and history
- **Cross-Device Sync**: Real-time synchronization across multiple devices

### 📱 Modern Mobile Experience
- **React Native/Expo**: Cross-platform mobile app (iOS, Android, Web)
- **File-Based Routing**: Clean navigation structure with Expo Router
- **Responsive Design**: Optimized for various screen sizes
- **Offline-First Architecture**: Works seamlessly without internet connection

### 🔄 Data Synchronization
- **Real-Time Updates**: Live data synchronization using Supabase Realtime
- **Offline Queue**: Automatic sync when connection is restored
- **Conflict Resolution**: Intelligent handling of data conflicts
- **Retry Logic**: Robust error handling with exponential backoff

## Technology Stack

### Frontend Framework
- **React Native 0.81.5** with **Expo SDK 54**
- **TypeScript** for type safety
- **Expo Router** for navigation
- **React Hook Form** for form management

### Backend & Database
- **Supabase** for authentication, database, and real-time features
- **PostgreSQL** database with Row Level Security (RLS)
- **Supabase Storage** for image uploads

### AI & Machine Learning
- **Google Gemini API** for AI-powered diagnosis
- **Image Analysis** with computer vision capabilities
- **Natural Language Processing** for symptom analysis

### State Management
- **React Context API** for global state
- **AsyncStorage** for local data persistence
- **Real-time subscriptions** for live updates

### Development Tools
- **Jest** for testing
- **ESLint** for code quality
- **TypeScript** for static typing
- **Expo Development Build** for development

## Project Structure

```
PoultryCure/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   ├── auth/              # Authentication screens
│   ├── diagnosis/        # Diagnosis screens
│   ├── profile/           # User profile screens
│   ├── settings/          # Settings screens
│   └── glossary/          # Disease glossary
├── components/            # Reusable UI components
├── contexts/              # React Context providers
├── services/              # Business logic and API services
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
├── utils/                 # Helper functions
├── data/                  # Static data and disease database
├── hooks/                 # Custom React hooks
├── constants/             # App constants and themes
└── __tests__/            # Test files
```

## Core Services

### Authentication Service (`services/supabase-auth.ts`)
- User signup/login with email/password
- Session management and token refresh
- Profile management
- Password reset functionality

### Diagnosis Service (`services/supabase-diagnoses.ts`)
- CRUD operations for diagnosis records
- Image upload and management
- Real-time synchronization
- Offline queue management

### AI Service (`services/gemini-client.ts`)
- Symptom analysis with context
- Image analysis for visual diagnosis
- Error handling and retry logic
- API key validation

### Disease Service (`services/diseaseService.ts`)
- Disease database management
- Search and filtering
- Caching and offline support
- Bookmark management

## Data Models

### User & Authentication
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Diagnosis Results
```typescript
interface DiagnosisResult {
  id: string;
  type: 'symptom' | 'image';
  input: string;
  diagnosis: string;
  confidence: number;
  recommendations: string[];
  treatment?: string;
  prevention?: string;
  severity: 'low' | 'moderate' | 'high';
  date: string;
  imageUri?: string;
  imageUrl?: string;
  imagePath?: string;
  imageMetadata?: ImageMetadata;
  updated_at: string;
}
```

### Disease Information
```typescript
interface ExtendedDiseaseInfo {
  id: string;
  name: string;
  category: DiseaseCategory;
  symptoms: string[];
  treatment: string;
  prevention: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  causes: string[];
  transmission: TransmissionInfo;
  incubationPeriod: string;
  mortality: MortalityInfo;
  commonIn: string[];
  images: DiseaseImage[];
  relatedDiseases: string[];
  tags: string[];
  lastUpdated: Date;
  sources: string[];
}
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Gemini API Configuration
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_GEMINI_MODEL=gemini-2.5-flash
EXPO_PUBLIC_GEMINI_MAX_TOKENS=2048
EXPO_PUBLIC_GEMINI_TIMEOUT=30000

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio / Xcode (for device testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd poultry/PoultryCure
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your API keys and Supabase credentials

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/simulator**
   - Scan QR code with Expo Go app
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` for web browser

### Database Setup

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project

2. **Run SQL Setup**
   ```sql
   -- Run the SQL from SUPABASE_SETUP.sql
   -- This creates all necessary tables and RLS policies
   ```

3. **Configure Environment**
   - Update `.env` with your Supabase URL and anon key

## Development Workflow

### Code Organization
- **Components**: Reusable UI components in `/components`
- **Screens**: Page components in `/app` directory
- **Services**: Business logic in `/services`
- **Types**: TypeScript definitions in `/types`
- **Utils**: Helper functions in `/utils`

### State Management
- **AuthContext**: User authentication state
- **DiagnosisContext**: Diagnosis history and management
- **Local State**: Component-level state with React hooks

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

## API Integration

### Google Gemini API
- Used for AI-powered diagnosis
- Supports both text and image analysis
- Configurable models and parameters
- Built-in error handling and retry logic

### Supabase Integration
- **Authentication**: User management and session handling
- **Database**: PostgreSQL with real-time subscriptions
- **Storage**: File uploads for diagnosis images
- **Real-time**: Live data synchronization

## Offline Architecture

### Caching Strategy
- **Disease Database**: Static data cached locally
- **User History**: Diagnosis history stored locally
- **Pending Operations**: Queued for sync when online
- **Conflict Resolution**: Timestamp-based conflict handling

### Sync Mechanism
- **Real-time Subscriptions**: Live updates when online
- **Offline Queue**: Operations queued during offline mode
- **Retry Logic**: Exponential backoff for failed operations
- **Status Indicators**: Visual feedback for sync status

## Security Features

### Authentication
- **JWT Tokens**: Secure session management
- **Password Hashing**: bcrypt for password security
- **Session Persistence**: Secure storage with AsyncStorage
- **Auto-refresh**: Automatic token refresh

### Data Protection
- **Row Level Security**: Database-level access control
- **API Key Security**: Environment variable storage
- **Input Validation**: Client and server-side validation
- **Error Handling**: Secure error message handling

## Performance Optimizations

### Image Handling
- **Compression**: Automatic image compression
- **Caching**: Local image caching
- **Lazy Loading**: On-demand image loading
- **Resizing**: Responsive image sizing

### Data Management
- **Pagination**: Large dataset pagination
- **Debouncing**: Search input debouncing
- **Memoization**: React.memo for component optimization
- **Virtual Lists**: Efficient list rendering

## Deployment

### Expo Development Build
```bash
# Build for development
eas build --profile development --platform all

# Build for production
eas build --profile production --platform all
```

### App Store Distribution
- Configure `eas.json` for build profiles
- Set up app icons and splash screens
- Configure app store metadata
- Submit to app stores

## Contributing

### Development Guidelines
1. **Code Style**: Follow ESLint configuration
2. **TypeScript**: Use strict type checking
3. **Testing**: Write tests for new features
4. **Documentation**: Update README and code comments
5. **Git**: Use conventional commit messages

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

## Troubleshooting

### Common Issues
- **Metro Bundler**: Clear cache with `npx expo start -c`
- **Dependencies**: Reinstall with `npm install --force`
- **Environment**: Check `.env` file configuration
- **API Keys**: Verify API key validity and permissions

### Debug Tools
- **React Native Debugger**: For debugging React Native apps
- **Expo Dev Tools**: Built-in development tools
- **Supabase Dashboard**: Database and auth debugging
- **Network Inspector**: API request debugging

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

**Built with ❤️ for the poultry farming community**
