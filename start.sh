#!/bin/bash

# Docker 이미지 빌드
echo "Building Docker images..."
docker-compose build

# 기존 컨테이너 종료
echo "Stopping existing containers..."
docker-compose down

# 컨테이너 실행
echo "Starting containers..."
docker-compose up -d

echo "Containers are running!"
echo "Frontend: http://localhost:7000"
echo "Backend API: http://localhost:7001"
echo "PostgreSQL: localhost:7002"

