FROM debian:bookworm

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install devkitPro pacman + dependencies
RUN apt-get update && apt-get install -y \
    git curl wget make build-essential \
    python3 ca-certificates gnupg2 unzip

# Set environment variables
ENV DEVKITPRO=/opt/devkitpro
ENV DEVKITARM=/opt/devkitpro/devkitARM
ENV PATH=$DEVKITARM/bin:$PATH
