@echo off
title AA01 AI 照顧計畫系統

cd /d "C:\Users\13670\OneDrive - Eden Social Welfare Foundation\文件\aa01-ai-system"

start cmd /k npm run dev

timeout /t 5 >nul

start http://localhost:5173