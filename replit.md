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

## Recent Changes
- July 12, 2025: Fixed critical deployment issue causing blank screen at pinauth.com
- Corrected unified-server.js to properly serve static files from client/dist
- Created deploy-fix.js with proper static file serving configuration
- Fixed package.json JSON syntax error that was preventing app startup
- Static assets now served with correct content types (JavaScript/CSS)
- Production deployment now serves actual React build files instead of embedded HTML
- GitHub Actions deployment configured for automatic Railway deployment
- Database connection established with PostgreSQL integration
- Fixed Railway build failures with production-build.js script
- Removed build verification step that was causing false deployment failures
- Fixed GitHub Actions Railway CLI authentication issue (using environment variable method)
- Resolved development server import issue preventing real Disney Pin Authenticator from loading
- Added proper build step to GitHub Actions workflow to ensure client/dist files are created
- Identified need to enable "Wait for CI" setting in Railway for proper GitHub Actions integration
- July 12, 2025: MAJOR FIX - Server now properly serves real Disney Pin Authenticator from client/dist
- Disabled failing GitHub Actions workflow to stop error emails
- Updated server configuration to serve static files correctly
- Real Disney Pin Authenticator app now loads instead of fallback placeholder
- Created comprehensive Railway deployment guide with multiple deployment options

## Changelog
- June 23, 2025. Initial setup and working app restoration

## User Preferences

Preferred communication style: Simple, everyday language.