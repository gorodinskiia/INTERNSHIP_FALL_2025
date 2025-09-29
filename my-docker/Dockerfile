# Use a base image (Node, just for JS runtime)
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy your application code
COPY . .

# Expose app port (only if your app listens on 5000)
EXPOSE 5000

# Default command — replace this with what you actually want to run
# For now, this just keeps the container alive
CMD ["node", "-e", "console.log('Container is running!')"]
