#!/bin/bash
# 已当前分支和时间作为镜像tag
TAG=$(git branch --show-current)-$(date +%Y%m%d%H%M%S)
IMAGE=registry.cn-shenzhen.aliyuncs.com/xiaoantest/xattp-web
docker build -t $IMAGE:$TAG . 
#同时也要打latest标签
docker tag $IMAGE:$TAG $IMAGE:latest
#推送镜像
docker push $IMAGE:$TAG
docker push $IMAGE:latest