# AuthGate 🔐

A secure, production-ready authentication backend built with Node.js and Express.
Handles user authentication with JWT tokens and integrates ML-based anomaly detection
via a trained model in the `models/` directory.

## Features
- JWT-based stateless authentication
- Secure password handling
- ML model integration for anomaly/fraud detection
- RESTful API structure

## Tech Stack
Node.js · Express · JWT · JavaScript

## Setup
```bash
npm install
node server.js
```

## Structure
```
AuthGate/
├── server.js        # Main Express server & routes
├── models/          # ML model for anomaly detection
├── package.json     # Dependencies
└── .gitignore
```

## Author
[Nithish](https://github.com/NITHISH-2006)
