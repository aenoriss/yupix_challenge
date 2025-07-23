# Todo App

## Running with Docker (Recommended)

```bash
# Start MongoDB and both servers
npm run dev

# Stop MongoDB
npm run docker:down

# View MongoDB logs
npm run docker:logs
```

## Running without Docker

```bash
# Make sure MongoDB is running locally
npm run dev:no-docker
```

## Docker Commands

- `npm run docker:up` - Start MongoDB container
- `npm run docker:down` - Stop MongoDB container
- `npm run docker:logs` - View MongoDB logs