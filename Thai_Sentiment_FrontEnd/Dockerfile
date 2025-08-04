# --- Thai_Sentiment_FrontEnd/Dockerfile ---
FROM nginx:alpine

# 1. Remove default site 
RUN rm -rf /usr/share/nginx/html/*

# 2. Copy your built HTML/CSS/JS
COPY . /usr/share/nginx/html

# 3. Expose port 80
EXPOSE 80

# NGINX starts automatically
