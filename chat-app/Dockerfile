# Dockerfile for React (Frontend)
# Step 1: Build the React app using Node.js
FROM node:20 AS build

WORKDIR /app

# Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the React app
RUN npm run build

# Step 2: Serve the built app using Nginx
FROM nginx:alpine

# Copy the build output from the build step to Nginx's default directory
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for the web server
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
