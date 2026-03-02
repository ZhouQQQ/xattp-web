# build stage
FROM docker.m.daocloud.io/node:18.15.0-alpine AS build-stage
ENV NODE_OPTIONS="--max_old_space_size=8098"

WORKDIR /app

# 仅复制依赖描述，先安装依赖（未改 package 时该层可复用，节省约 72s）
COPY package.json ./

# Install pnpm
RUN npm config set registry https://registry.npmmirror.com/ && npm install -g pnpm

# 依赖安装：使用缓存挂载，重复构建时复用 pnpm store
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm install

# 再复制源码（改代码时不会重新 pnpm install）
COPY . .

# 构建：Docker 内仅跑 vite build，跳过 vue-tsc（约省 30–60s）；类型检查请在 CI 单独执行 pnpm run build 或 vue-tsc
# 使用缓存挂载减轻重复构建时的耗时
RUN --mount=type=cache,target=/app/node_modules/.vite \
  pnpm run build:docker

# production stage
FROM docker.m.daocloud.io/nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
