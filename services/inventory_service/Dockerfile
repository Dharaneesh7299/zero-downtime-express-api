
FROM node:22-bookworm-slim

WORKDIR /app

# Install dependencies first for better build caching.
COPY package*.json ./
RUN npm ci

# Copy application code and Prisma schema.
COPY . .

# Generate the Prisma client inside the container.
RUN npx prisma generate --schema=prisma/schema.prisma

EXPOSE 4001

CMD ["node", "src/server.js"]
