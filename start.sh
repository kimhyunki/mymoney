#!/bin/bash

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

