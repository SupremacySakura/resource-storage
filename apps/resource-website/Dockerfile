FROM node:22-alpine as builder

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/resource-website

# Set the environment variable for the build to empty string
# This makes API calls relative, e.g., /api/file/..., which Nginx will proxy
ENV VITE_SERVER_URL=""

RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/apps/resource-website/dist /usr/share/nginx/html

# Copy config templates to a temporary location, NOT /etc/nginx/templates/
# This prevents Nginx from automatically processing them with envsubst
COPY apps/resource-website/nginx.conf /usr/share/nginx/templates-store/nginx-http.conf.template
COPY apps/resource-website/nginx-ssl.conf /usr/share/nginx/templates-store/nginx-ssl.conf.template

# Set default template (HTTP) initially
COPY apps/resource-website/nginx.conf /etc/nginx/templates/default.conf.template

# Add setup script
COPY apps/resource-website/setup-nginx.sh /docker-entrypoint.d/10-setup-nginx.sh
RUN chmod +x /docker-entrypoint.d/10-setup-nginx.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
