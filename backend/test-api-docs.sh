#!/bin/bash

# ResuOpti API 文档测试脚本
# 用于验证 Swagger UI 集成是否成功

echo "======================================"
echo "ResuOpti API 文档集成测试"
echo "======================================"
echo ""

# 检查服务器是否运行
echo "1. 检查服务器状态..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ 服务器正在运行"
else
    echo "✗ 服务器未启动，请先运行: npm start"
    exit 1
fi

echo ""

# 测试健康检查端点
echo "2. 测试健康检查端点..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✓ 健康检查端点正常"
    echo "   响应: $HEALTH_RESPONSE"
else
    echo "✗ 健康检查端点异常"
fi

echo ""

# 测试文档说明端点
echo "3. 测试文档说明端点..."
DOCS_RESPONSE=$(curl -s http://localhost:3000/docs)
if echo "$DOCS_RESPONSE" | grep -q "ResuOpti API 文档服务"; then
    echo "✓ 文档说明端点正常"
else
    echo "✗ 文档说明端点异常"
fi

echo ""

# 测试 OpenAPI JSON 端点
echo "4. 测试 OpenAPI 规范端点..."
API_SPEC_RESPONSE=$(curl -s http://localhost:3000/api-docs.json)
if echo "$API_SPEC_RESPONSE" | grep -q "ResuOpti API"; then
    echo "✓ OpenAPI 规范端点正常"
    echo "   API 版本: $(echo "$API_SPEC_RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)"
else
    echo "✗ OpenAPI 规范端点异常"
fi

echo ""

# 测试 Swagger UI 端点
echo "5. 测试 Swagger UI 端点..."
SWAGGER_UI_RESPONSE=$(curl -s http://localhost:3000/api-docs/)
if echo "$SWAGGER_UI_RESPONSE" | grep -q "swagger-ui"; then
    echo "✓ Swagger UI 端点正常"
    echo "   提示: 在浏览器中访问 http://localhost:3000/api-docs 查看完整界面"
else
    echo "✗ Swagger UI 端点异常"
fi

echo ""

# 测试 API 根路径
echo "6. 测试 API 根路径..."
API_ROOT_RESPONSE=$(curl -s http://localhost:3000/api/v1)
if echo "$API_ROOT_RESPONSE" | grep -q "ResuOpti API"; then
    echo "✓ API 根路径正常"
else
    echo "✗ API 根路径异常"
fi

echo ""
echo "======================================"
echo "测试完成！"
echo "======================================"
echo ""
echo "📚 访问 API 文档:"
echo "   Swagger UI: http://localhost:3000/api-docs"
echo "   文档说明:   http://localhost:3000/docs"
echo "   OpenAPI:    http://localhost:3000/api-docs.json"
echo ""