FROM node:18-alpine as build

# First, set up the React app build
WORKDIR /app

# Copy all project files
COPY . .

# Install dependencies and build React app
RUN npm install
RUN npm run build

# Now set up the server
FROM node:18-alpine

WORKDIR /app

# Copy built frontend from the React app
COPY --from=build /app/dist ./dist

# Copy server files
COPY --from=build /app/server/ ./server/

# Copy package files for production
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./

# Install production dependencies
RUN npm install --omit=dev

# Create runtime env vars
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"]