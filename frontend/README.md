# Scouting Outing Manager - Frontend

React-based frontend application for the Scouting Outing Manager system.

## Technology Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Context API** for state management
- **Google Fonts**: Roboto (headings) and Inter (body text)

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

Builds the app for production to the `build` folder.

## Project Structure

```
frontend/
├── public/           # Static files
│   └── index.html   # HTML template
├── src/
│   ├── components/  # React components
│   │   ├── Admin/   # Admin-specific components
│   │   ├── Participant/ # Participant signup components
│   │   └── Shared/  # Shared components
│   ├── contexts/    # React contexts (Auth, etc.)
│   ├── pages/       # Page components
│   ├── services/    # API services
│   ├── types/       # TypeScript type definitions
│   ├── App.tsx      # Main app component
│   ├── index.tsx    # Entry point
│   └── index.css    # Global styles
├── package.json
└── tsconfig.json
```

## Features

### Admin Interface
- Create and manage outings
- View outing signups
- Export roster as CSV
- Manage outing dates (single day or overnight with start/end dates)

### Participant Interface
- Browse available outings
- Sign up for outings
- Add multiple participants (scouts and adults)
- Specify dietary restrictions and allergies
- Youth Protection Training verification for adults

## Environment Variables

Create a `.env` file in the frontend directory:

```
VITE_API_URL=http://localhost:8000/api
```

## Typography

- **Headings**: Roboto font family (weights: 400, 500, 700, 900)
- **Body Text**: Inter font family (weights: 400, 500, 600, 700)
- **Buttons & UI**: Inter font family

## Authentication

The frontend uses JWT-based authentication with access and refresh tokens stored in localStorage.