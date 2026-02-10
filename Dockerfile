# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy source code and transpile TypeScript
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy transpiled code from build stage
COPY --from=build /app/dist ./dist

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
