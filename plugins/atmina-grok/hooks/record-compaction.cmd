:; sh "${GROK_PLUGIN_ROOT}/hooks/memory.sh" record-compaction; exit $?
@echo off
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0memory.ps1" -Action record-compaction
exit /b %ERRORLEVEL%
