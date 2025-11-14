FROM node:22
RUN apt-get update -y && \
  apt-get install -y ca-certificates tzdata && \
  curl -L "https://dl.k8s.io/release/v1.32.0/bin/linux/amd64/kubectl" -o /usr/local/bin/kubectl && \
  chmod +x /usr/local/bin/kubectl

WORKDIR /backend

# install dependencies
COPY package.json ./
COPY packages/api/package.json ./packages/api/
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
RUN npm i -g corepack@latest && corepack enable
COPY packages/api/src/database/prisma/schema.prisma ./packages/api/src/database/prisma/schema.prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter=@mcdo-incentive-program/api

# build package
COPY packages/api/tsconfig.json ./packages/api/

COPY packages/api/src ./packages/api/src
RUN cd packages/api && pnpm run build

# Set working directory to the API package for runtime
WORKDIR /backend/packages/api
 
ENV NODE_OPTIONS=--max_old_space_size=65536                               