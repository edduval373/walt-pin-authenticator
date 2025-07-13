# Disney Pin Authenticator - W.A.L.T. (World-class Authentication and Lookup Tool)

## Overview

This is a mobile-first web application for Disney pin collectors that provides AI-powered pin authentication through advanced image recognition. The application features a comprehensive authentication system that analyzes pin images and provides detailed authenticity verification.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with optimized production builds
- **Styling**: Tailwind CSS with Radix UI components
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Custom component library based on Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Integration**: External Pin Authentication API (master.pinauth.com)
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL storage

### Deployment Strategy
- **Development**: Replit with hot reloading via Vite
- **Production**: Railway platform with static build serving
- **Build Process**: Custom build scripts that generate optimized static assets
- **Environment Detection**: Separate configurations for development and production

## Key Components

### Authentication Flow
1. **Introduction Page**: Legal notices and user acknowledgment
2. **Camera Interface**: Multi-angle image capture (front, back, angled)
3. **Processing Page**: Real-time analysis with progress indicators
4. **Results Display**: Comprehensive authentication results with user feedback system

### Image Processing Pipeline
- **Capture**: Native browser camera API integration
- **Preprocessing**: Base64 encoding and validation
- **Transmission**: Secure API calls to master authentication service
- **Analysis**: AI-powered pin recognition and authenticity verification

### User Interface Features
- **Mobile-First Design**: Responsive layouts optimized for mobile devices
- **Progressive Loading**: Step-by-step workflow with progress indicators
- **Feedback System**: User rating system with thumbs up/down functionality
- **Real-time Updates**: Live processing status and results display

## Data Flow

### Image Capture to Analysis
1. User captures pin images through camera interface
2. Images are converted to base64 and validated
3. Data is transmitted to external authentication API
4. Results are processed and displayed with feedback options
5. User feedback is stored in local database

### Database Schema
- **Users**: Authentication and session management
- **Pins**: Pin metadata and identification information
- **Analyses**: Analysis results and confidence metrics
- **Feedback**: User ratings and comments on analysis accuracy

## External Dependencies

### Pin Authentication API
- **Endpoint**: https://master.pinauth.com/mobile-upload
- **Authentication**: API key-based authentication
- **Data Format**: JSON with base64-encoded image data
- **Response**: Detailed analysis results with confidence scores

### Third-Party Libraries
- **UI Framework**: React ecosystem with Radix UI
- **Image Processing**: Browser-native APIs
- **HTTP Client**: Native fetch API with node-fetch for server-side
- **Database**: PostgreSQL with connection pooling

## Deployment Strategy

### Build Configuration
- **Development**: Live server with hot module replacement
- **Production**: Static asset generation with Express.js API server
- **Asset Management**: Optimized bundling with code splitting
- **Environment Variables**: Secure API key and database configuration management

### Platform-Specific Optimizations
- **Replit**: Configured for development with live reloading
- **Railway**: Production deployment with health checks and auto-scaling
- **Docker**: Containerized deployment support with multi-stage builds

### Health Monitoring
- **Health Checks**: Multiple endpoint monitoring for uptime verification
- **Error Handling**: Comprehensive error logging and user-friendly error messages
- **Performance**: Response time monitoring and optimization

## Mobile App Architecture

### Expo React Native App
- **Location**: `mobile-app/` directory
- **Framework**: Expo 50.0.0 with React Native 0.73.6
- **Navigation**: React Navigation with Stack Navigator
- **Screens**: 5 complete screens (Splash, Overview, Camera, Processing, Results)
- **Features**: Camera integration, photo selection, API connectivity
- **Deployment**: Ready for Expo Application Services (EAS) or web deployment

### App Configuration
- **Bundle ID**: com.walt.disneypinauthenticator
- **App Name**: Disney Pin Authenticator
- **Permissions**: Camera and photo library access configured
- **Assets**: Complete icon set, splash screen, and adaptive icons
- **API Integration**: Connected to master.pinauth.com service

## Recent Changes
- July 13, 2025: FINAL RAILWAY DEPLOYMENT READY - All issues resolved
- Fixed all TypeScript compilation errors with proper type assertions
- Resolved client/package.json JSON formatting preventing Railway deployment
- Created comprehensive static build system (final-railway-deploy.cjs)
- Built complete Disney Pin Authenticator with camera integration
- Added mobile-responsive design with Alpine.js interactivity
- Implemented professional authentication UI with results display
- Fixed all schema type issues in shared/schema.ts
- Updated railway-storage.ts with proper type handling
- Corrected railway-api.ts type assertions
- Verified build output and server functionality
- Database connection established with PostgreSQL
- Health check endpoint configured for Railway
- Static file serving working correctly
- Mobile app structure complete but blocked by Expo dependency conflicts
- All Railway configuration files ready (railway.json, nixpacks.toml, Procfile)
- Server properly serves Disney Pin Authenticator from client/dist
- Production build generates working static files with full functionality

## Changelog
- June 23, 2025. Initial setup and working app restoration

## User Preferences

Preferred communication style: Simple, everyday language.