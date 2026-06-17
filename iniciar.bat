@echo off
title VANDERALE — LEMBRA?
color 0A

echo.
echo  ██╗   ██╗ █████╗ ███╗   ██╗██████╗ ███████╗██████╗  █████╗ ██╗     ███████╗
echo  ██║   ██║██╔══██╗████╗  ██║██╔══██╗██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝
echo  ██║   ██║███████║██╔██╗ ██║██║  ██║█████╗  ██████╔╝███████║██║     █████╗
echo  ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗██╔══██║██║     ██╔══╝
echo   ╚████╔╝ ██║  ██║██║ ╚████║██████╔╝███████╗██║  ██║██║  ██║███████╗███████╗
echo    ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝
echo.
echo  LEMBRA? — Jogo da Memoria
echo  ================================================
echo.

:: Entra na pasta do projeto
cd /d "%~dp0"

:: Verifica se node_modules existe
if not exist "node_modules" (
    echo  [!] Dependencias nao encontradas. Instalando...
    echo.
    "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
    echo.
)

echo  [*] Iniciando servidor...
echo  [*] Acesse: http://localhost:8081
echo.
echo  Para fechar: pressione Ctrl+C nesta janela.
echo  ================================================
echo.

:: Aguarda 2 segundos e abre o navegador automaticamente
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8081"

:: Inicia o Expo Web
"C:\Program Files\nodejs\node.exe" node_modules\expo\bin\cli start --web --clear

pause
