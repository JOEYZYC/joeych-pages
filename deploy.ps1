# 部署：提交并推送到 GitHub Pages
# 用法:
#   ./deploy.ps1                 # 使用默认提交信息
#   ./deploy.ps1 "更新项目图片"   # 自定义提交信息
#
# 直推 main 分支 → GitHub Pages 自动构建并部署（约 1-2 分钟生效）。
param([string]$Message = "Update site content")

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

git add -A

# 没有任何变更则退出
if (-not (git diff --cached --name-only)) {
    Write-Host "没有需要提交的变更。" -ForegroundColor Yellow
    exit 0
}

Write-Host "=== 即将提交的变更 ===" -ForegroundColor Cyan
git status --short

git commit -m $Message
git push origin main

Write-Host ""
Write-Host "已推送到 origin/main。GitHub Pages 正在自动构建。" -ForegroundColor Green
Write-Host "约 1-2 分钟后访问： https://joeyzyc.github.io/joeych-pages/" -ForegroundColor Green
