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
echo Preparando servidor de desarrollo (se detectará/instalarán dependencias si hace falta)...

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

REM Si el usuario forzó PKG_MGR, comprobar que realmente existe en PATH; si no, intentar autodetección o fallback a npm
IF DEFINED PM (
    where %PM% >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo Aviso: el gestor de paquetes especificado "%PM%" no se encontro en PATH. Se intentara usar npm.
        SET "PM="
    )
)

IF "%PM%"=="" (
    REM Reintentar deteccion simple y finalmente forzar npm si no se encuentra otro
    where pnpm >nul 2>&1
    IF %ERRORLEVEL%==0 (SET "PM=pnpm") ELSE (
        where yarn >nul 2>&1
        IF %ERRORLEVEL%==0 (SET "PM=yarn") ELSE (
            where npm >nul 2>&1
            IF %ERRORLEVEL%==0 (SET "PM=npm") ELSE (
                echo No se encontro pnpm/yarn/npm en PATH. Intentando usar 'npm' de todas formas.
                SET "PM=npm"
            )
        )
    )
)

echo Usando gestor de paquetes: %PM%

REM Decidir si abrir el navegador automaticamente (OPEN_BROWSER=0 desactiva)
IF "%OPEN_BROWSER%"=="0" (
    SET "OPEN_FLAG="
) ELSE (
    SET "OPEN_FLAG=--open"
)

REM Instalar dependencias SOLO si no existe node_modules (o si FORCE_INSTALL=1)
IF "%FORCE_INSTALL%"=="1" (
    SET "INSTALL_CMD=%PM% install"
) ELSE (
    IF NOT EXIST node_modules (
        SET "INSTALL_CMD=%PM% install"
    ) ELSE (
        SET "INSTALL_CMD=echo Dependencias ya instaladas - omitiendo instalacion"
    )
)

SET "FULL_CMD=%INSTALL_CMD% && %PM% run dev -- %OPEN_FLAG%"

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
POPD
