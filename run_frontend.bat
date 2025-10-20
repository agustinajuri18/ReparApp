@echo off
REM run_frontend.bat — instala dependencias y arranca el frontend (Vite + React)
REM Uso: abrir cmd.exe en la raíz del repositorio y ejecutar run_frontend.bat

SET FRONT_DIR=%~dp0Frontend\front-vite
PUSHD "%FRONT_DIR%"

REM Selección del ejecutable Node (opcional)
IF DEFINED NODE_EXE (
    SET "NODE_CMD=%NODE_EXE%"
) ELSE (
    SET "NODE_CMD=node"
)

REM Comprobar node/npm
%NODE_CMD% -v >nul 2>&1
IF ERRORLEVEL 1 (
    echo Node no encontrado. Instala Node.js y npm o establece NODE_EXE con la ruta al ejecutable.
    POPD
    EXIT /B 1
)
echo Iniciando servidor de desarrollo (npm run dev)...
npm run dev

REM Detectar gestor de paquetes: permite PKG_MGR para forzar (pnpm|yarn|npm)
IF DEFINED PKG_MGR (
    SET "PM=%PKG_MGR%"
) ELSE (
    where pnpm >nul 2>&1
    IF %ERRORLEVEL%==0 (SET "PM=pnpm") ELSE (
        where yarn >nul 2>&1
        IF %ERRORLEVEL%==0 (SET "PM=yarn") ELSE (
            where npm >nul 2>&1
            IF %ERRORLEVEL%==0 (SET "PM=npm") ELSE (SET "PM=")
        )
    )
)

IF "%PM%"=="" (
    echo No se encontro pnpm/yarn/npm en PATH y no se proporciono PKG_MGR. Instala uno y vuelve a intentar.
    POPD
    EXIT /B 1
)

echo Usando gestor de paquetes: %PM%

REM Decidir si abrir el navegador automaticamente (OPEN_BROWSER=0 desactiva)
IF "%OPEN_BROWSER%"=="0" (
    SET "OPEN_FLAG="
) ELSE (
    SET "OPEN_FLAG=--open"
)

REM Construir comando completo: instalar (si hace falta) y arrancar dev
SET "FULL_CMD=%PM% install && %PM% run dev -- %OPEN_FLAG%"

REM Decidir si ejecutar en nueva ventana: detección CI o variable START_NEW_WINDOW
IF DEFINED CI (
    REM Estamos en CI -> no abrir nuevas ventanas
    SET "START_NEW_WINDOW=0"
) ELSE (
    IF NOT DEFINED START_NEW_WINDOW SET "START_NEW_WINDOW=1"
)

IF "%START_NEW_WINDOW%"=="1" (
    echo Lanzando dev server en nueva ventana de terminal...
    REM start "Vite" abre una nueva ventana y ejecuta el comando con /k para que no se cierre
    start "Vite" cmd /k "cd /d %FRONT_DIR% && %FULL_CMD%"
) ELSE (
    echo Ejecutando dev server en la ventana actual...
    cd /d %FRONT_DIR% && %FULL_CMD%
)
 
REM Decidir si ejecutar en nueva ventana: detección CI o variable START_NEW_WINDOW
IF DEFINED CI (
    REM Estamos en CI -> no abrir nuevas ventanas
    SET "START_NEW_WINDOW=0"
) ELSE (
    IF NOT DEFINED START_NEW_WINDOW SET "START_NEW_WINDOW=1"
)

REM Construir el comando de arranque
IF "%PM%"=="yarn" (
    SET "RUN_CMD=%PM% run dev -- %OPEN_FLAG%"
) ELSE (
    SET "RUN_CMD=%PM% run dev -- %OPEN_FLAG%"
)

IF "%START_NEW_WINDOW%"=="1" (
    echo Lanzando dev server en nueva ventana de terminal...
    REM start "Vite" abre una nueva ventana y ejecuta el comando con /k para que no se cierre
    start "Vite" cmd /k "%RUN_CMD%"
) ELSE (
    echo Ejecutando dev server en la ventana actual...
    cmd /c "%RUN_CMD%"
)

POPD
