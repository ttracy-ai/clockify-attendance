@echo off
title Clockify Attendance App
cd /d "C:\Users\travi\OneDrive\Documents\Projects\Clockify Attendance\clockify-attendance"
echo Starting Clockify Attendance App...
echo.
echo The app will open automatically in your browser.
echo This window will stay open - minimize it to keep the app running.
echo To stop the app, close this window.
echo.
start http://localhost:3000
npm run dev
