@echo off
set LOCALHOST=%COMPUTERNAME%
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (taskkill /f /pid 2000)
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (taskkill /f /pid 11740)
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (taskkill /f /pid 13984)
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (taskkill /f /pid 7408)

del /F cleanup-ansys-MARCDNICHITBF25-7408.bat
