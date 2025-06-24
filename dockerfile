# Build stage
FROM node:18-alpine AS builder

ARG VITE_ENCRYPTION_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_CACHE_KEY

ENV VITE_ENCRYPTION_KEY=$VITE_ENCRYPTION_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_CACHE_KEY=$VITE_CACHE_KEY

WORKDIR /app
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY . .

RUN npm ci
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
