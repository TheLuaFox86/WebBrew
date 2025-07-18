FROM debian:bookworm

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install devkitPro pacman + dependencies
RUN apt-get update && apt-get install -y \
    git curl wget make build-essential \
    python3 ca-certificates gnupg2 unzip

# Install devkitPro pacman (official script)
RUN curl -fsSL https://apt.devkitpro.org/install-devkitpro-pacman | bash

# Install 3DS toolchain
RUN dkp-pacman -Syu --noconfirm devkitARM libctru 3ds-dev

# Set environment variables
ENV DEVKITPRO=/opt/devkitpro
ENV DEVKITARM=/opt/devkitpro/devkitARM
ENV PATH=$DEVKITARM/bin:$PATH
