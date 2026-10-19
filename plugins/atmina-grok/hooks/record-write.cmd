:; sh "${GROK_PLUGIN_ROOT}/hooks/memory.sh" record-write; exit $?
@echo off
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0memory.ps1" -Action record-write
exit /b %ERRORLEVEL%
