FROM node:18-alpine

# Set working directory to /app
WORKDIR /app

# Copy package configuration files
COPY backend/package*.json ./backend/

# Install only production dependencies
RUN npm install --prefix backend --omit=dev

# Copy all files including static assets and backend code
COPY . .

# Expose port 3000
EXPOSE 3000

# Set default env variables (can be overridden)
ENV PORT=3000
ENV MONGO_URI=mongodb://localhost:27017/hotelease

# Start the Node.js Express server
CMD ["node", "backend/server.js"]
