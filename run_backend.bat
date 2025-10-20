@echo off
REM run_backend.bat — crea/activa un virtualenv, instala dependencias y arranca el backend
REM Uso: abrir cmd.exe en la raíz del repositorio y ejecutar run_backend.bat

SET BACKEND_DIR=%~dp0Backend
PUSHD "%BACKEND_DIR%"
echo Instalando dependencias desde requirements.txt (si falta algo) ...
echo Iniciando la aplicación (backend)...
REM --- Selección del ejecutable Python ---
REM Puedes forzar un ejecutable concreto estableciendo la variable de entorno PY_EXE
IF DEFINED PY_EXE (
    SET "PYTHON_EXEC=%PY_EXE%"
) ELSE (
    SET "PYTHON_EXEC=python"
)

REM Versión mínima requerida (mayor, menor)
SET MIN_MAJOR=3
SET MIN_MINOR=11

REM Obtener la versión de Python (ej: 3.13.9) y parsear mayor/minor
FOR /F "usebackq tokens=1-2 delims=." %%A IN (`%PYTHON_EXEC% -c "import sys;print(sys.version.split()[0])"`) DO (
    SET "PV_MAJOR=%%A"
    SET "PV_MINOR=%%B"
)

REM Comparar versión
IF "%PV_MAJOR%"=="" (
    echo No se pudo ejecutar %PYTHON_EXEC%. Asegurate de que Python está instalado y accesible.
    POPD
    EXIT /B 1
)

IF %PV_MAJOR% LSS %MIN_MAJOR% (
    echo Error: Python %MIN_MAJOR%.%MIN_MINOR% o superior es requerido. Encontrada: %PV_MAJOR%.%PV_MINOR%
    POPD
    EXIT /B 1
)
IF %PV_MAJOR% EQU %MIN_MAJOR% (
    IF %PV_MINOR% LSS %MIN_MINOR% (
        echo Error: Python %MIN_MAJOR%.%MIN_MINOR% o superior es requerido. Encontrada: %PV_MAJOR%.%PV_MINOR%
        POPD
        EXIT /B 1
    )
)

echo Usando Python en: %PYTHON_EXEC% (version %PV_MAJOR%.%PV_MINOR%)

REM Si no existe el venv, créalo usando el ejecutable seleccionado
IF NOT EXIST "%BACKEND_DIR%\.venv\Scripts\activate.bat" (
    echo Creando entorno virtual en %BACKEND_DIR%\.venv ...
    %PYTHON_EXEC% -m venv "%BACKEND_DIR%\.venv"
)

REM Activar el venv
call "%BACKEND_DIR%\.venv\Scripts\activate.bat"

REM Instalar requirements (no forzamos upgrade de pip por defecto)
echo Instalando dependencias desde requirements.txt ...
%PYTHON_EXEC% -m pip install -r "%BACKEND_DIR%\requirements.txt"

REM Si deseas forzar la actualización de pip antes de instalar, ejecuta el script con la variable UPGRADE_PIP=1
IF "%UPGRADE_PIP%"=="1" (
    echo Actualizando pip...
    %PYTHON_EXEC% -m pip install --upgrade pip
)

REM Arrancar la app
echo Iniciando la aplicación (backend)...
%PYTHON_EXEC% "%BACKEND_DIR%\app.py"

REM Volver al directorio original
POPD
