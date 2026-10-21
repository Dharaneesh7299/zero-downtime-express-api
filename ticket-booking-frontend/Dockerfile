# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests and install clean production/build dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Optional build-time argument for API URL (defaults to empty string for relative proxying)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build the React application into /app/dist
RUN npm run build

# Stage 2: Production serve stage using Nginx
FROM nginx:1.27-alpine AS runner

# Remove default nginx HTML files and configuration
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build artifacts from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Health check to ensure Nginx is healthy and serving requests
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/nginx-health || exit 1

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
