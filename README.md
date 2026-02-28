# OpenAI Auth Tester

Automated Node.js testing tool for OpenAI authentication signup flow using phone numbers.

## Project Structure

```
openai-auth-tester/
├── src/
│   ├── lib/          # Core library components
│   ├── utils/        # Utility functions
│   └── index.js      # Main entry point
├── tests/            # Test files
├── config/           # Configuration files
├── results/          # Test results output (generated)
└── package.json      # Project dependencies
```

## Installation

```bash
npm install
```

## Development

### Run Tests
```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
```

### Linting
```bash
npm run lint          # Check code style
npm run lint:fix      # Fix code style issues
```

## Dependencies

- **axios**: HTTP client for API requests
- **tough-cookie**: Cookie jar management
- **playwright**: Browser automation for token generation
- **commander**: CLI argument parsing
- **fast-check**: Property-based testing
- **vitest**: Testing framework
- **eslint**: Code linting

## Requirements

- Node.js v16 or higher
- npm or yarn

## Status

Project setup complete. Implementation in progress.
