@echo off
REM Wrapper for Windows Task Scheduler — runs the follow-up sender daily and logs output.
REM The script itself enforces the 5-day cadence, so running daily is correct.
cd /d "c:\Users\Jaimes Edward\Documents\GitHub\Tester-Website"
echo. >> "scripts\followups.log"
echo ===== Run at %DATE% %TIME% ===== >> "scripts\followups.log"
"C:\Program Files\nodejs\node.exe" "scripts\send-followups.mjs" >> "scripts\followups.log" 2>&1
