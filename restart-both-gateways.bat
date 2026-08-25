@echo off
set "H=%LOCALAPPDATA%\hermes\hermes-agent\venv\Scripts\hermes.exe"
echo ==== restart run %date% %time% ==== > "%LOCALAPPDATA%\hermes\restart-log.txt"
call "%H%" gateway restart >> "%LOCALAPPDATA%\hermes\restart-log.txt" 2>&1
call "%H%" -p ashley gateway restart >> "%LOCALAPPDATA%\hermes\restart-log.txt" 2>&1
call "%H%" gateway status >> "%LOCALAPPDATA%\hermes\restart-log.txt" 2>&1
exit
