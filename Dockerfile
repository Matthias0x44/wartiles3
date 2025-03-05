FROM node:18-alpine as build

# First, set up the React app build
WORKDIR /app

# Copy the wartiles-online project files
COPY wartiles-online/ ./wartiles-online/
WORKDIR /app/wartiles-online

# Install dependencies and build React app
RUN npm install
RUN npm run build

# Now set up the server
FROM node:18-alpine

WORKDIR /app

# Copy built frontend from the React app
COPY --from=build /app/wartiles-online/dist ./dist

# Copy server files
COPY server/ ./server/

# Copy root package.json (if exists) or use the one from wartiles-online directory
COPY package.json ./
# If package-lock.json exists in root, copy it too (but make it optional)
COPY package-lock.json* ./

# Install production dependencies (using --if-present to make it optional if package-lock.json doesn't exist)
RUN npm install --omit=dev || npm install --only=production

# Create runtime env vars
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"] 