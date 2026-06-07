# Otvori Supabase SQL Editor i kopiraj schema u clipboard
$schemaPath = Join-Path $PSScriptRoot "..\supabase\schema.sql"
$sql = Get-Content $schemaPath -Raw -Encoding UTF8
Set-Clipboard -Value $sql
Write-Host "schema.sql kopiran u clipboard!" -ForegroundColor Green
Write-Host "Otvaram SQL Editor..."
Start-Process "https://supabase.com/dashboard/project/jhspxxkershzrvjnbxnn/sql/new"
Write-Host "U browseru: Ctrl+V pa Run" -ForegroundColor Yellow
