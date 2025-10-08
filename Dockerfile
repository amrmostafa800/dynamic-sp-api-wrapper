# Stage 1: Builder
# This stage installs all dependencies, including devDependencies,
# and runs the build script.
FROM oven/bun:1.0.25-alpine AS builder

WORKDIR /usr/src/app

# Copy package definition and lockfile
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies for the build)
RUN bun install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Run the build script to generate routers, types, etc.
RUN bun run build

# Stage 2: Production
# This stage creates the final, lean production image.
FROM oven/bun:1.0.25-alpine

WORKDIR /usr/src/app

# Copy only the necessary files from the builder stage
COPY --from=builder /usr/src/app/package.json .
COPY --from=builder /usr/src/app/bun.lock .
COPY --from=builder /usr/src/app/src/ src/
COPY --from=builder /usr/src/app/node_modules/ node_modules/
COPY --from=builder /usr/src/app/tsconfig.json .

# Expose the port the application will run on
EXPOSE 3000

# Set the default command to start the application
CMD ["bun", "run", "start"]