#!/bin/bash
# 已当前分支、commit id 和时间作为镜像tag，并把构建元数据注入前端
BRANCH=$(git branch --show-current)
COMMIT_SHA=$(git rev-parse --short HEAD)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TAG=${BRANCH}-$(date +%Y%m%d%H%M%S)
IMAGE=registry.cn-shenzhen.aliyuncs.com/xiaoantest/xattp-web

docker build \
  --build-arg VITE_BUILD_BRANCH="${BRANCH}" \
  --build-arg VITE_VERCEL_GIT_COMMIT_SHA="${COMMIT_SHA}" \
  --build-arg VITE_BUILD_TIME="${BUILD_TIME}" \
  -t $IMAGE:latest . 
#同时也要打latest标签
# docker tag $IMAGE:latest $IMAGE:$TAG
#推送镜像
# docker push $IMAGE:$TAG
docker push $IMAGE:latest
#删除本地镜像
# docker rmi $IMAGE:$TAG
docker rmi $IMAGE:latest