# W.A.L.T. - World-class Authentication and Lookup Tool

A mobile-first web application for Disney pin collectors, providing AI-powered pin authentication through advanced image recognition.

## Features

- W.A.L.T. AI Analysis: Advanced image processing for pin verification
- Mobile-Optimized Interface: Responsive design built for mobile devices
- Real-time Authentication: Instant pin authenticity verification
- User Feedback System: Thumbs up/down rating for analysis accuracy
- Comprehensive Reporting: Detailed analysis with authenticity ratings
- Multi-angle Capture: Front, back, and angled pin photography

## Technology Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Build Tool: Vite
- Image Processing: Advanced AI-powered analysis
- Database: PostgreSQL with Drizzle ORM

## Quick Start

1. Install dependencies
```bash
npm install
```

2. Set up environment variables
```bash
cp .env.example .env
# Add your API keys and configuration
```

3. Start the development server
```bash
npm run dev
```

## Environment Variables

Create a `.env` file with the following variables:

```
PIM_API_KEY=your_pim_api_key_here
PIM_API_BASE_URL=https://your-api-url.com
DATABASE_URL=your_database_url_here
```

## Usage

1. Open the app on your mobile device
2. Capture pin images using the guided camera interface
3. Submit for analysis and wait for W.A.L.T.'s AI assessment
4. Review results including authenticity rating and detailed analysis
5. Provide feedback using the thumbs up/down system

## Mobile Optimization

- Touch-friendly interface designed for smartphones
- Optimized camera controls with angle guidance
- Large, readable text and buttons
- Responsive layout that works on all screen sizes

## License

This project is proprietary software for Disney pin authentication.