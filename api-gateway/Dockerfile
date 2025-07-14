FROM denoland/deno:alpine-1.43.1

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Cache dependencies
RUN deno cache main.ts

# Expose port
EXPOSE 8000

# Set environment variables
ENV PORT=8000
ENV DENO_ENV=production

# Run with minimal permissions
USER deno

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD deno run --allow-net https://deno.land/std/http/file_server.ts --help || exit 1

# Start the application
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "main.ts"]
