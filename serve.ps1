# 本地预览：使用 Jekyll 渲染 Liquid 页面
# 用法:  ./serve.ps1            (默认端口 8123)
#        ./serve.ps1 8080       (自定义端口)
#
# 说明：首页、项目、获奖页面均使用 Jekyll `_data` 和 Liquid 渲染。
param([int]$Port = 8123)

Set-Location -LiteralPath $PSScriptRoot

Write-Host "本地预览地址： http://localhost:$Port/joeych-pages/index.html" -ForegroundColor Green
Write-Host "按 Ctrl+C 停止服务。" -ForegroundColor Yellow
bundle exec jekyll serve --port $Port --baseurl "/joeych-pages"
