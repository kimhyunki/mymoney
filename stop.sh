#!/bin/bash

# 컨테이너 종료 및 정리
echo "Stopping containers..."
docker-compose down -v 2>/dev/null || true

# 특정 컨테이너가 실행 중이면 강제 종료
docker stop mymoney-frontend mymoney-backend mymoney-database 2>/dev/null || true
docker rm mymoney-frontend mymoney-backend mymoney-database 2>/dev/null || true

echo "Containers stopped."
