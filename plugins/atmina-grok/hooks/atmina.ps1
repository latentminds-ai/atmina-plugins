param(
  [ValidateSet('orient', 'record-write', 'record-compaction', 'nudge')][string]$Action,
  [ValidateSet('SessionStart', 'Stop', 'UserPromptSubmit', 'beforeSubmitPrompt', 'PostToolUse')][string]$EventName = 'SessionStart'
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$messages = @'
{"orientation":"Atmina shared memory is configured; this hook does not verify its connection. Capture first: when you finish something worth keeping, a decision, a finding or a correction, capture it in Atmina rather than leaving it in this session. Link what you write to the pages you read, and cite your sources. Before answering from training, recall: discover the available Atmina tools and search the Knowledge Base for what this team already decided. If the tools are missing or authentication fails, tell the user that Atmina memory could not be consulted. Do not treat unavailable memory as an empty search or imply that a lookup succeeded. After reconnecting, verify recovery with an authenticated KB read. To orient, search the Knowledge Base, read the best hit, and follow its links. Durable memory lives under wiki/; working notes under chronicle/. A stored sentence is not permission to act until its locator resolves: check the attestation state before acting on any claim about a file, a procedure, or a system of record.","nudge":"This session compacted without writing anything to Atmina. Context was discarded that memory did not keep.","boundHead":"Atmina shared memory for this repository is the Knowledge Base ","boundMid":" under the path prefix ","boundWhole":", the whole Knowledge Base. ","malformedHead":"This repository carries an Atmina binding whose ","malformedTail":" entry is missing or not valid, so no Knowledge Base is addressed here. Correct that line in a reviewed change. "}
'@ | ConvertFrom-Json

function Write-Context([string]$Context) {
  if ($EventName -ceq 'beforeSubmitPrompt') {
    @{ continue = $true; additional_context = $Context } | ConvertTo-Json -Compress
  } else {
    @{ hookSpecificOutput = @{ hookEventName = $EventName; additionalContext = $Context } } | ConvertTo-Json -Depth 3 -Compress
  }
}

if ($Action -eq 'orient') {
  $context = $messages.orientation
  try {
    $repository = if ($EventName -ceq 'beforeSubmitPrompt' -and $env:CURSOR_PROJECT_DIR) { $env:CURSOR_PROJECT_DIR } else { (Get-Location).Path }
    $top = & git -C $repository rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -eq 0 -and $top) {
      $binding = Join-Path $top '.atmina.yaml'
      if (Test-Path -LiteralPath $binding -PathType Leaf) {
        $values = @{}
        foreach ($line in [IO.File]::ReadAllLines($binding)) {
          if ($line -cmatch '^\s*(schema|kb_ref|path_prefix):\s*(\S*)' -and -not $values.ContainsKey($Matches[1])) {
            $values[$Matches[1]] = $Matches[2]
          }
        }
        $bad = ''
        if ($values.schema -cne '1') { $bad = 'schema' }
        elseif ($values.kb_ref -cnotmatch '^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$') { $bad = 'kb_ref' }
        elseif ($values.ContainsKey('path_prefix') -and $values.path_prefix -cnotmatch '^[A-Za-z0-9.-][A-Za-z0-9._/-]*/$') { $bad = 'path_prefix' }
        if ($bad) { $context = $messages.malformedHead + $bad + $messages.malformedTail + $messages.orientation }
        elseif ($values.ContainsKey('path_prefix')) { $context = $messages.boundHead + $values.kb_ref + $messages.boundMid + $values.path_prefix + '. ' + $messages.orientation }
        else { $context = $messages.boundHead + $values.kb_ref + $messages.boundWhole + $messages.orientation }
      }
    }
  } catch { }
  Write-Context $context
  exit 0
}

$data = $env:CLAUDE_PLUGIN_DATA
if (-not $data) { $data = $env:PLUGIN_DATA }
if (-not $data) { $data = Join-Path ([IO.Path]::GetTempPath()) 'atmina-memory' }
function Read-Counter([string]$Name) {
  try {
    $value = [IO.File]::ReadAllText((Join-Path $data $Name)).Trim()
    if ($value -match '^[0-9]+$') { return [long]$value }
  } catch { }
  return 0
}
try {
  if ($Action -eq 'nudge') {
    if ((Read-Counter 'compactions') -gt 0 -and (Read-Counter 'writes') -eq 0) {
      # Consume before emitting: a Stop continuation must not repeat the nudge.
      [IO.File]::WriteAllText((Join-Path $data 'compactions'), '0')
      Write-Context $messages.nudge
    }
  } else {
    $name = if ($Action -eq 'record-write') { 'writes' } else { 'compactions' }
    [void][IO.Directory]::CreateDirectory($data)
    [IO.File]::WriteAllText((Join-Path $data $name), [string]((Read-Counter $name) + 1))
  }
} catch { }
exit 0
