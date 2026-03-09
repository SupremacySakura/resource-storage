FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/resource-server

RUN pnpm build

# Copy config files to dist
RUN cp -r src/config dist/config

# Copy user.json to a location that can be persisted/mounted if needed, or rely on default
# But for Docker, we might want to allow mounting config.
# For now, we keep it simple but allow overriding via env var if we mount a file.

CMD ["node", "dist/index.js"]
