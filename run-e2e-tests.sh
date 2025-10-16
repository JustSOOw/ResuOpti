#!/bin/bash

# E2E测试运行脚本
# 此脚本启动测试环境并运行Cypress E2E测试

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  ResuOpti E2E测试执行脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在清理测试环境...${NC}"
    docker-compose -f docker-compose.test.yml down -v
    echo -e "${GREEN}清理完成${NC}"
}

# 设置陷阱，确保脚本退出时清理资源
trap cleanup EXIT INT TERM

# 步骤1: 启动测试环境
echo -e "\n${YELLOW}步骤1: 启动测试环境${NC}"
echo "启动 PostgreSQL, Backend, Frontend..."
docker-compose -f docker-compose.test.yml up -d

# 步骤2: 等待服务就绪
echo -e "\n${YELLOW}步骤2: 等待服务就绪${NC}"
echo "等待后端服务启动..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 后端服务已就绪${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "等待中... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ 后端服务启动超时${NC}"
    docker-compose -f docker-compose.test.yml logs backend-test
    exit 1
fi

echo "等待前端服务启动..."
sleep 5

# 检查前端服务
if curl -f http://localhost:5174 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端服务已就绪${NC}"
else
    echo -e "${RED}✗ 前端服务未就绪${NC}"
    docker-compose -f docker-compose.test.yml logs frontend-test
    exit 1
fi

# 步骤3: 运行E2E测试
echo -e "\n${YELLOW}步骤3: 运行E2E测试${NC}"

# 检查是否有命令行参数指定特定测试文件
if [ -n "$1" ]; then
    echo "运行指定测试: $1"
    cd frontend && CYPRESS_baseUrl=http://localhost:5174 CYPRESS_apiUrl=http://localhost:3001/api/v1 npx cypress run --spec "tests/e2e/$1"
else
    echo "运行所有E2E测试..."
    cd frontend && CYPRESS_baseUrl=http://localhost:5174 CYPRESS_apiUrl=http://localhost:3001/api/v1 npx cypress run
fi

# 步骤4: 显示测试结果
echo -e "\n${GREEN}=========================================="
echo "  E2E测试执行完成"
echo "==========================================${NC}"

# cleanup函数会在脚本退出时自动执行
