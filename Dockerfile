# Use Node.js as base image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if it exists)
COPY package.json ./

# Install dependencies using pnpm
RUN npm install -g pnpm && pnpm install

# Copy the rest of the backend files
COPY . .

# Expose the application port
EXPOSE 5000

# Start the backend server
CMD ["pnpm", "start"]
