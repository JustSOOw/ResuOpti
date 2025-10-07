#!/bin/bash
# 批量更新契约测试文件的token生成方式
#
# 此脚本将所有契约测试中的硬编码token替换为使用token-generator生成的有效token

CONTRACT_DIR="D:/Users/JUSTsoo/Documents/aprojectCODE/ResuOpti/backend/tests/contract"

echo "开始更新契约测试文件..."

# 需要更新的契约测试文件列表（排除auth-register和auth-login因为它们不需要token）
files=(
  "target-positions-get.test.js"
  "target-positions-post.test.js"
  "target-positions-get-by-id.test.js"
  "target-positions-put.test.js"
  "target-positions-delete.test.js"
  "resumes-post.test.js"
  "resumes-upload.test.js"
  "resumes-put-metadata.test.js"
)

for file in "${files[@]}"; do
  filepath="$CONTRACT_DIR/$file"
  if [ -f "$filepath" ]; then
    echo "✓ 找到文件: $file"
  else
    echo "✗ 文件不存在: $file"
  fi
done

echo ""
echo "请注意：由于Windows路径和bash兼容性问题，建议手动更新以下文件："
echo "1. target-positions-post.test.js"
echo "2. target-positions-get-by-id.test.js"
echo "3. target-positions-put.test.js"
echo "4. target-positions-delete.test.js"
echo "5. resumes-post.test.js"
echo "6. resumes-upload.test.js"
echo "7. resumes-put-metadata.test.js"
echo ""
echo "更新模式："
echo "1. 添加imports: const { generateQuickTestAuth, generateInvalidToken } = require('../utils/auth-helper');"
echo "2. 在beforeAll中生成token: const auth = generateQuickTestAuth();"
echo "3. 替换硬编码的validToken和invalidToken"
