# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# SvelteKit $env/static/public vars are inlined at build time
ARG PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG PUBLIC_SUPABASE_ANON_KEY=placeholder
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm ci --omit=dev

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
USER appuser
EXPOSE 3000
ENV NODE_ENV=production PORT=3000
CMD ["node", "build/index.js"]
