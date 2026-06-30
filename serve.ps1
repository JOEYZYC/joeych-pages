# 本地预览：启动静态服务器后用浏览器打开核心页面
# 用法:  ./serve.ps1            (默认端口 8123)
#        ./serve.ps1 8080       (自定义端口)
#
# 说明：首页/自我介绍/获奖证书/项目介绍 为纯静态 HTML，可直接预览。
#       博客(blog) 依赖 Jekyll Liquid，本地静态服务器不渲染，仅 GitHub Pages 上生效。
param([int]$Port = 8123)

Set-Location -LiteralPath $PSScriptRoot

Write-Host "本地预览地址： http://localhost:$Port/index.html" -ForegroundColor Green
Write-Host "按 Ctrl+C 停止服务。" -ForegroundColor Yellow
python -m http.server $Port
