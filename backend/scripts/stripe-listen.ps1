# Chạy tunnel webhook Stripe -> backend local.
# Yêu cầu: Stripe CLI đã cài (winget install Stripe.StripeCli), backend chạy trên cổng 5001.
#
# Cách dùng (PowerShell, từ thư mục backend hoặc repo):
#   .\scripts\stripe-listen.ps1
#
# Lần đầu: CLI mở trình duyệt để đăng nhập Stripe. Sau khi chạy, copy dòng
#   whsec_... vào backend/.env -> STRIPE_WEBHOOK_SECRET=...
# Rồi restart server Node.

$ErrorActionPreference = "Stop"
$port = if ($env:PORT) { $env:PORT } else { "5001" }
$url = "http://localhost:$port/api/billing/webhook"

Write-Host "Forwarding Stripe webhooks to: $url" -ForegroundColor Cyan
Write-Host "Copy the STRIPE_WEBHOOK_SECRET (whsec_...) into backend/.env and restart the API." -ForegroundColor Yellow
Write-Host ""

stripe listen --forward-to $url
