FROM ubuntu:22.04

# Install prerequisites
RUN apt-get update && apt-get install -y curl git build-essential

# Install devkitPro pacman
RUN curl -L https://packages.devkitpro.org/packages/devkitpro-pacman.deb -o devkitpro-pacman.deb && \
    dpkg -i devkitpro-pacman.deb && \
    apt-get install -f -y

# Initialize devkitPro environment
RUN dkp-pacman -Sy libctru

ENV DEVKITPRO=/opt/devkitpro
ENV DEVKITARM=$DEVKITPRO/devkitARM
ENV PATH=$DEVKITARM/bin:$PATH