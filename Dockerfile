FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_POSTHOG_PROJECT_TOKEN
ARG VITE_POSTHOG_HOST
ARG VITE_POSTHOG_DASHBOARD_EMBED_URL

RUN npm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build/ /usr/share/nginx/html/

EXPOSE 80