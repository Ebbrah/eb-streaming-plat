# CADF

A cross-platform streaming application that works on Web, Mobile (iOS/Android), and Android TV.

## Features

- User authentication (signup/login)
- Movie browsing and searching
- Movie details and streaming
- User profiles and watchlists
- Responsive design for all platforms
- Cross-platform compatibility

## Project Structure

```
netflix-clone/
├── packages/
│   ├── core/           # Shared business logic and utilities
│   ├── web/            # Web application (React)
│   ├── mobile/         # Mobile app (React Native)
│   ├── android-tv/     # Android TV app (React Native)
│   └── server/         # Backend server (Node.js/Express)
```

## Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Android TV emulator or device

## Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start the development server:
   ```bash
   yarn dev
   ```

3. Run specific platforms:
   - Web: `yarn web`
   - Mobile: `yarn mobile`
   - Android TV: `yarn android-tv`
   - Server: `yarn server`

## Development

- Web app runs on: http://localhost:3000
- Backend server runs on: http://localhost:5000
- Mobile app can be run on iOS simulator or Android emulator
- Android TV app can be run on Android TV emulator or device

## Technologies Used

- Frontend:
  - React (Web)
  - React Native (Mobile & Android TV)
  - Redux for state management
  - React Navigation
  - Styled Components

- Backend:
  - Node.js
  - Express
  - MongoDB
  - JWT Authentication

- Development:
  - TypeScript
  - ESLint
  - Prettier
  - Jest for testing 