SET SCRIPT_DIR=%~dp0
SET BIN_DIR=%SCRIPT_DIR%\bin
SET PREPROCESS_DIR=%SCRIPT_DIR%\preprocess
SET DEPLOY_DIR=%SCRIPT_DIR%\deploy
SET DEPLOY_JS_DIR=%DEPLOY_DIR%\js
SET DEPLOY_ROMS_DIR=%DEPLOY_JS_DIR%\roms
SET ROMS_DIR=%SCRIPT_DIR%\roms

SET HEADER=%PREPROCESS_DIR%\header.js

SET MCPP=%BIN_DIR%\mcpp.exe
SET TOJSSTR=%BIN_DIR%\tojsstr.exe
SET CAT=%BIN_DIR%\cat.exe
SET GREP=%BIN_DIR%\grep.exe

for %%x in (
    e6809.js
    globals.js
    osint.js
    utils.js
    vector_t.js
    vecx.js    
) do (
    %MCPP% -j -P %PREPROCESS_DIR%\%%x | %GREP% -v "^$" > tmp.js || goto :error
    %CAT% %HEADER% tmp.js > %DEPLOY_JS_DIR%\%%x || goto :error
    del tmp.js || goto :error
)

%MCPP% -j -P -@old %PREPROCESS_DIR%\e8910.js | %GREP% -v "^$" > tmp.js || goto :error
%CAT% %HEADER% tmp.js > %DEPLOY_JS_DIR%\e8910.js || goto :error
del tmp.js || goto :error

CALL :romToJsStr  rom.dat,                  romdata.js
CALL :romToJsStr  fastrom.dat,              fastromdata.js

CALL :cartToJsStr 3dczycst.bin,             3dczycst.js
CALL :cartToJsStr agt.bin,                  agt.js
CALL :cartToJsStr armor.bin,                armor.js
CALL :cartToJsStr asteroid_cowboy.bin,      asteroid_cowboy.js
CALL :cartToJsStr berzerk.bin,              berzerk.js
CALL :cartToJsStr BerzerkDebugged.vec,      berzerk-debugged.js
CALL :cartToJsStr bedlam.bin,               bedlam.js
CALL :cartToJsStr blitz.bin,                blitz.js
CALL :cartToJsStr castle.bin,               castle.js 
CALL :cartToJsStr chasm.bin,                chasm.js
CALL :cartToJsStr dktower.bin,              dktower.js
CALL :cartToJsStr frogger.bin,              frogger.js
CALL :cartToJsStr gravplus.bin,             gravplus.js
CALL :cartToJsStr headsup.bin,              headsup.js
CALL :cartToJsStr hyper.bin,                hyper.js
CALL :cartToJsStr MailPlane.BIN,            MailPlane.js
CALL :cartToJsStr mine3.bin,                mine3.js
CALL :cartToJsStr minestorm.bin,            minestorm.js
CALL :cartToJsStr moon.bin,                 moon.js
CALL :cartToJsStr mstorm2.bin,              mstorm2.js
CALL :cartToJsStr narzod.bin,               narzod.js
CALL :cartToJsStr nebula.bin,               nebula.js
CALL :cartToJsStr Omega16k.bin,             Omega16k.js
CALL :cartToJsStr Pitchers.bin,             Pitchers.js
CALL :cartToJsStr patriot.bin,              patriot.js
CALL :cartToJsStr polar.bin,                polar.js
CALL :cartToJsStr pole.bin,                 pole.js
CALL :cartToJsStr revector.bin,             revector.js
CALL :cartToJsStr ripoff.bin,               ripoff.js
CALL :cartToJsStr rocks.bin,                rocks.js
CALL :cartToJsStr scramble.bin,             scramble.js
CALL :cartToJsStr sfpd.bin,                 sfpd.js
CALL :cartToJsStr solar.bin,                solar.js
CALL :cartToJsStr spike.bin,                spike.js
CALL :cartToJsStr spikehop.bin,             spikehop.js
CALL :cartToJsStr spikewater.bin,           spikewater.js
CALL :cartToJsStr space.bin,                space.js
CALL :cartToJsStr spinball.bin,             spinball.js
CALL :cartToJsStr starhawk.bin,             starhawk.js
CALL :cartToJsStr starship.vec,             starship.js
CALL :cartToJsStr startrek.bin,             startrek.js
CALL :cartToJsStr sweep.bin,                sweep.js
CALL :cartToJsStr tdf.bin,                  tdf.js
CALL :cartToJsStr thrust.bin,               thrust.js
CALL :cartToJsStr tsu-dl.bin,               tsu.js
CALL :cartToJsStr vecmania1.bin,            vecmania1.js
CALL :cartToJsStr vecmania2.bin,            vecmania2.js
CALL :cartToJsStr Vectrexians-1999-PD.vec,  vectrexians.js
CALL :cartToJsStr vix-dl.bin,               vix.js
CALL :cartToJsStr webwars.bin,              webwars.js
CALL :cartToJsStr wotr.bin,                 wotr.js

goto :EOF

:romToJsStr
%TOJSSTR% Globals.romdata %ROMS_DIR%\%~1 > %DEPLOY_JS_DIR%\%~2 || goto :error
EXIT /B 0

:cartToJsStr
%TOJSSTR% Globals.cartdata %ROMS_DIR%\%~1 > %DEPLOY_ROMS_DIR%\%~2 || goto :error
EXIT /B 0

:error
echo Failed with error #%errorlevel%.
cmd /c exit -1073741510
