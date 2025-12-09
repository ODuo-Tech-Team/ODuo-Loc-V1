#########################################
# Script de Restore do PostgreSQL (Windows)
#
# Uso: .\scripts\restore-database.ps1 <caminho-do-backup>
# Exemplo: .\scripts\restore-database.ps1 backups\backup_saas_locacao_20250110_143000.sql.gz
#
# Requer: psql no PATH
#########################################

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

# Verificar se o arquivo existe
if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Arquivo de backup não encontrado: $BackupFile" -ForegroundColor Red
    exit 1
}

# Carregar variáveis de ambiente do .env
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Obter DATABASE_URL
$DB_URL = $env:DATABASE_URL

if (-not $DB_URL) {
    Write-Host "❌ DATABASE_URL não encontrada. Configure no .env" -ForegroundColor Red
    exit 1
}

# Parse DATABASE_URL
$DB_URL -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)' | Out-Null
$DB_USER = $matches[1]
$DB_PASS = $matches[2]
$DB_HOST = $matches[3]
$DB_PORT = $matches[4]
$DB_NAME = $matches[5]

Write-Host "⚠️  ATENÇÃO: Este processo irá substituir TODOS os dados do banco!" -ForegroundColor Yellow
Write-Host "📊 Banco: $DB_NAME" -ForegroundColor Yellow
Write-Host "🖥️  Host: ${DB_HOST}:${DB_PORT}" -ForegroundColor Yellow
Write-Host "📁 Backup: $BackupFile" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Digite 'CONFIRMAR' para continuar"

if ($confirmation -ne "CONFIRMAR") {
    Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Iniciando restore do banco de dados..." -ForegroundColor Cyan

# Configurar senha do PostgreSQL
$env:PGPASSWORD = $DB_PASS

try {
    # Descomprimir arquivo temporariamente
    $TEMP_SQL = [System.IO.Path]::GetTempFileName() + ".sql"

    Write-Host "📦 Descomprimindo backup..." -ForegroundColor Cyan
    $sourceStream = [System.IO.File]::OpenRead($BackupFile)
    $destStream = [System.IO.File]::Create($TEMP_SQL)
    $gzipStream = New-Object System.IO.Compression.GzipStream($sourceStream, [System.IO.Compression.CompressionMode]::Decompress)

    $gzipStream.CopyTo($destStream)

    $gzipStream.Close()
    $destStream.Close()
    $sourceStream.Close()

    Write-Host "🔄 Restaurando banco de dados..." -ForegroundColor Cyan

    # Executar restore
    & psql `
        -h $DB_HOST `
        -p $DB_PORT `
        -U $DB_USER `
        -d $DB_NAME `
        -f $TEMP_SQL

    if ($LASTEXITCODE -ne 0) {
        throw "psql falhou com código $LASTEXITCODE"
    }

    Write-Host "✅ Restore concluído com sucesso!" -ForegroundColor Green

} catch {
    Write-Host "❌ Erro durante o restore: $_" -ForegroundColor Red
    exit 1
} finally {
    # Limpar arquivos temporários
    if (Test-Path $TEMP_SQL) {
        Remove-Item $TEMP_SQL -ErrorAction SilentlyContinue
    }

    # Limpar senha da memória
    Remove-Item -Path "env:PGPASSWORD" -ErrorAction SilentlyContinue
}

Write-Host "✨ Processo finalizado!" -ForegroundColor Green
