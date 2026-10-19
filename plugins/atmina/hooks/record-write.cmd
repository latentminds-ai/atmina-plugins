:; sh "${CLAUDE_PLUGIN_ROOT}/hooks/record-write.sh"; exit $?
@echo off
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0atmina.ps1" -Action record-write -EventName SessionStart
exit /b %ERRORLEVEL%
