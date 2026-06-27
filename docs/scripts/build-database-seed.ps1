# สร้าง docs/database-seed.sql จากชิ้นส่วนใน docs/scripts/
$scripts = $PSScriptRoot
$docs = Split-Path $scripts -Parent
$out = Join-Path $docs "database-seed.sql"
$partsDir = Join-Path $scripts "parts"
$genDir = Join-Path $scripts "generated"

$files = @(
  @{ Label = "parts/01-core-schema-seed.sql"; Path = Join-Path $partsDir "01-core-schema-seed.sql" },
  @{ Label = "parts/02-ef-masters-categories.sql"; Path = Join-Path $partsDir "02-ef-masters-categories.sql" },
  @{ Label = "generated/02b-ef-categories-full.sql"; Path = Join-Path $genDir "02b-ef-categories-full.sql" },
  @{ Label = "generated/03c-ef-emission-factors-full.sql"; Path = Join-Path $genDir "03c-ef-emission-factors-full.sql" },
  @{ Label = "parts/04-ef-frontend-bridge.sql"; Path = Join-Path $partsDir "04-ef-frontend-bridge.sql" },
  @{ Label = "parts/04c-ef-bridge-full.sql"; Path = Join-Path $partsDir "04c-ef-bridge-full.sql" }
)

$header = @"
-- =============================================================================
-- CONTROL-Z - Database seed (latest combined)
-- Database: control_z_v2 | charset utf8mb4
-- Docs: docs/database-overview.md
-- Build: docs/scripts/build-database-seed.ps1
-- =============================================================================

"@

$sb = New-Object System.Text.StringBuilder
[void]$sb.Append($header)
foreach ($f in $files) {
  if (-not (Test-Path $f.Path)) {
    Write-Error "Missing: $($f.Path)"
    exit 1
  }
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("-- >>> BEGIN $($f.Label)")
  [void]$sb.AppendLine([IO.File]::ReadAllText($f.Path))
  [void]$sb.AppendLine("-- <<< END $($f.Label)")
}
[IO.File]::WriteAllText($out, $sb.ToString(), [Text.UTF8Encoding]::new($false))
Write-Host "Wrote $out"
