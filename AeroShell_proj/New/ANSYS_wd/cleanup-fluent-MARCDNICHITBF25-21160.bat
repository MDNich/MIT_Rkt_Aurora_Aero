echo off
set LOCALHOST=%COMPUTERNAME%
set KILL_CMD="C:\PROGRA~1\ANSYSI~1\v242\fluent/ntbin/win64/winkill.exe"

start "tell.exe" /B "C:\PROGRA~1\ANSYSI~1\v242\fluent\ntbin\win64\tell.exe" MARCDNICHITBF25 57871 CLEANUP_EXITING
timeout /t 1
"C:\PROGRA~1\ANSYSI~1\v242\fluent\ntbin\win64\kill.exe" tell.exe
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 21520) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 14164) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 10916) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 24080) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 3848) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 18492) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 16740) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 2780) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 8032) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 20876) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 21160) 
if /i "%LOCALHOST%"=="MARCDNICHITBF25" (%KILL_CMD% 25144)
del "Z:\Developer\MIT_Rkt_Team\MIT_Rkt_Aurora_Aero\MIT_Rkt_Aurora_Aero\AeroShell_proj\New\ANSYS_wd\cleanup-fluent-MARCDNICHITBF25-21160.bat"