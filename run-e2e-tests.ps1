# PowerShell版本的E2E测试运行脚本
# 用于Windows环境

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  ResuOpti E2E测试执行脚本 (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 清理函数
function Cleanup {
    Write-Host "`n正在清理测试环境..." -ForegroundColor Yellow
    docker-compose -f docker-compose.test.yml down -v
    Write-Host "清理完成" -ForegroundColor Green
}

# 注册清理函数
try {
    # 步骤1: 启动测试环境
    Write-Host "`n步骤1: 启动测试环境" -ForegroundColor Yellow
    Write-Host "启动 PostgreSQL, Backend, Frontend..."
    docker-compose -f docker-compose.test.yml up -d

    # 步骤2: 等待服务就绪
    Write-Host "`n步骤2: 等待服务就绪" -ForegroundColor Yellow
    Write-Host "等待后端服务启动..."
    $maxAttempts = 30
    $attempt = 0
    $backendReady = $false

    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                Write-Host "✓ 后端服务已就绪" -ForegroundColor Green
                $backendReady = $true
                break
            }
        }
        catch {
            # 忽略连接错误，继续等待
        }
        $attempt++
        Write-Host "等待中... ($attempt/$maxAttempts)"
        Start-Sleep -Seconds 2
    }

    if (-not $backendReady) {
        Write-Host "✗ 后端服务启动超时" -ForegroundColor Red
        docker-compose -f docker-compose.test.yml logs backend-test
        throw "后端服务启动失败"
    }

    Write-Host "等待前端服务启动..."
    Start-Sleep -Seconds 5

    # 检查前端服务
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5174" -UseBasicParsing -TimeoutSec 5
        Write-Host "✓ 前端服务已就绪" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ 前端服务未就绪" -ForegroundColor Red
        docker-compose -f docker-compose.test.yml logs frontend-test
        throw "前端服务启动失败"
    }

    # 步骤3: 运行E2E测试
    Write-Host "`n步骤3: 运行E2E测试" -ForegroundColor Yellow

    # 设置环境变量
    $env:CYPRESS_baseUrl = "http://localhost:5174"
    $env:CYPRESS_apiUrl = "http://localhost:3001/api/v1"

    # 运行测试
    Set-Location frontend
    if ($args.Count -gt 0) {
        Write-Host "运行指定测试: $($args[0])"
        npx cypress run --spec "tests/e2e/$($args[0])"
    }
    else {
        Write-Host "运行所有E2E测试..."
        npx cypress run
    }
    Set-Location ..

    # 步骤4: 显示测试结果
    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host "  E2E测试执行完成" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green

}
catch {
    Write-Host "`n错误: $_" -ForegroundColor Red
    exit 1
}
finally {
    Cleanup
}
