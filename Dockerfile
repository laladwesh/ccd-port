# Build stage: compile Tailwind output.css
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage: plain static file server (default nginx config, nothing custom)
FROM nginx:1.27-alpine
COPY --from=build /app/index.html /app/app.js /app/projects.json /app/output.css /usr/share/nginx/html/
EXPOSE 80
