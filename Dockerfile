# Multi-stage build for ETH DEX Backend
FROM rust:1.75 as builder

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash
RUN /root/.foundry/bin/foundryup

# Set working directory
WORKDIR /app

# Copy dependency files
COPY Cargo.toml Cargo.lock ./
COPY foundry.toml remappings.txt ./

# Copy source code
COPY src/ ./src/
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/

# Build the application
RUN cargo build --release
RUN forge build

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 app

# Set working directory
WORKDIR /app

# Copy binaries from builder
COPY --from=builder /app/target/release/eth-deploy ./eth-deploy
COPY --from=builder /app/target/release/eth-interact ./eth-interact
COPY --from=builder /app/target/release/eth-dex ./eth-dex

# Copy contract artifacts
COPY --from=builder /app/out/ ./out/

# Copy scripts
COPY --from=builder /app/scripts/ ./scripts/

# Make scripts executable
RUN chmod +x scripts/*.sh

# Change ownership to app user
RUN chown -R app:app /app

# Switch to app user
USER app

# Expose port (if needed for API)
EXPOSE 8080

# Default command
CMD ["./eth-deploy"]