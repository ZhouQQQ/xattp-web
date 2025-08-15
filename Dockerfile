# build stage
FROM docker.m.daocloud.io/node:18.15.0-alpine AS build-stage
ENV NODE_OPTIONS="--max_old_space_size=8098"

WORKDIR /app

# Copy package files
COPY package.json ./

# Install pnpm and dependencies
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install -g pnpm

# Copy source code
COPY . .

# Install dependencies
RUN pnpm install

# Build the project
RUN pnpm build

# production stage
FROM docker.m.daocloud.io/nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
