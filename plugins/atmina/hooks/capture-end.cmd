:; sh "${CLAUDE_PLUGIN_ROOT}/hooks/capture.sh" SessionEnd; exit $?
@echo off
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0atmina.ps1" -Action capture -EventName SessionEnd
exit /b %ERRORLEVEL%
