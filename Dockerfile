FROM nginx:1.27-alpine
COPY index.html app.js projects.json style.css /usr/share/nginx/html/
EXPOSE 80
