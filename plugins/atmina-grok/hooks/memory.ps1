param([ValidateSet('post-tool', 'record-write', 'record-compaction', 'cleanup')][string]$Action)
$ErrorActionPreference = 'Stop'
if (-not $env:GROK_PLUGIN_DATA -or $env:GROK_SESSION_ID -cnotmatch '^[A-Za-z0-9_-]+$') { exit 0 }
$env:CLAUDE_PLUGIN_DATA = Join-Path $env:GROK_PLUGIN_DATA $env:GROK_SESSION_ID
try {
  if ($Action -eq 'cleanup') {
    foreach ($name in @('oriented', 'writes', 'compactions')) {
      [IO.File]::Delete((Join-Path $env:CLAUDE_PLUGIN_DATA $name))
    }
    if ([IO.Directory]::Exists($env:CLAUDE_PLUGIN_DATA)) { [IO.Directory]::Delete($env:CLAUDE_PLUGIN_DATA, $false) }
    exit 0
  }
  [void][IO.Directory]::CreateDirectory($env:CLAUDE_PLUGIN_DATA)
  $marker = Join-Path $env:CLAUDE_PLUGIN_DATA 'oriented'
  if ($Action -eq 'post-tool') {
    if (Test-Path -LiteralPath $marker -PathType Leaf) { exit 0 }
    $orientation = & "$PSScriptRoot/atmina.ps1" -Action orient -EventName PostToolUse | ConvertFrom-Json
    $nudge = & "$PSScriptRoot/atmina.ps1" -Action nudge -EventName PostToolUse | ConvertFrom-Json
    $context = $orientation.hookSpecificOutput.additionalContext
    if ($nudge) { $context += ' ' + $nudge.hookSpecificOutput.additionalContext }
    @{ hookSpecificOutput = @{ hookEventName = 'PostToolUse'; additionalContext = $context } } | ConvertTo-Json -Depth 3 -Compress
    [IO.File]::WriteAllText($marker, '1')
    exit 0
  }
  if ($Action -eq 'record-compaction') { [IO.File]::Delete($marker) }
} catch { exit 0 }
& "$PSScriptRoot/atmina.ps1" -Action $Action -EventName PostToolUse
