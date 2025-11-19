#!/bin/bash

# 기존 컨테이너 종료 및 정리
echo "Stopping existing containers..."
docker-compose down -v 2>/dev/null || true

# 특정 컨테이너가 실행 중이면 강제 종료
docker stop mymoney-frontend mymoney-backend mymoney-database 2>/dev/null || true
docker rm mymoney-frontend mymoney-backend mymoney-database 2>/dev/null || true

# Docker 이미지 빌드
echo "Building Docker images..."
docker-compose build

# 컨테이너 실행
echo "Starting containers..."
docker-compose up -d

echo "Containers are running!"
echo "Frontend: http://localhost:8050"
echo "Backend API: http://localhost:8051"
echo "PostgreSQL: localhost:8052"

