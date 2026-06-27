# Stage 1: Build — compile React + Vite app
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source and build
COPY . .
RUN npm run build
# Output lands in /app/dist

# Stage 2: Serve — lightweight nginx serving the compiled SPA
FROM nginx:alpine AS runner

# Remove the default nginx catch-all config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy compiled React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom SPA nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
