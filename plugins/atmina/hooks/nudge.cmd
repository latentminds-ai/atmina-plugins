:; sh "${CLAUDE_PLUGIN_ROOT}/hooks/nudge.sh"; exit $?
@echo off
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0atmina.ps1" -Action nudge -EventName Stop
exit /b %ERRORLEVEL%
