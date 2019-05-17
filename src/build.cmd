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

%TOJSSTR% Globals.romdata  %ROMS_DIR%\rom.dat       >  %DEPLOY_JS_DIR%\romdata.js || goto :error
%TOJSSTR% Globals.romdata  %ROMS_DIR%\fastrom.dat   >  %DEPLOY_JS_DIR%\fastromdata.js || goto :error

%TOJSSTR% Globals.cartdata %ROMS_DIR%\3dczycst.bin  >  %DEPLOY_ROMS_DIR%\3dczycst.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\agt.bin       >  %DEPLOY_ROMS_DIR%\agt.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\armor.bin     >  %DEPLOY_ROMS_DIR%\armor.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\asteroid_cowboy.bin >  %DEPLOY_ROMS_DIR%\asteroid_cowboy.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\berzerk.bin   >  %DEPLOY_ROMS_DIR%\berzerk.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\BerzerkDebugged.vec >  %DEPLOY_ROMS_DIR%\berzerk-debugged.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\bedlam.bin    >  %DEPLOY_ROMS_DIR%\bedlam.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\blitz.bin     >  %DEPLOY_ROMS_DIR%\blitz.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\castle.bin    >  %DEPLOY_ROMS_DIR%\castle.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\chasm.bin     >  %DEPLOY_ROMS_DIR%\chasm.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\dktower.bin   >  %DEPLOY_ROMS_DIR%\dktower.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\frogger.bin   >  %DEPLOY_ROMS_DIR%\frogger.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\gravplus.bin  >  %DEPLOY_ROMS_DIR%\gravplus.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\headsup.bin   >  %DEPLOY_ROMS_DIR%\headsup.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\hyper.bin     >  %DEPLOY_ROMS_DIR%\hyper.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\MailPlane.BIN >  %DEPLOY_ROMS_DIR%\MailPlane.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\mine3.bin     >  %DEPLOY_ROMS_DIR%\mine3.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\minestorm.bin >  %DEPLOY_ROMS_DIR%\minestorm.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\moon.bin      >  %DEPLOY_ROMS_DIR%\moon.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\mstorm2.bin   >  %DEPLOY_ROMS_DIR%\mstorm2.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\narzod.bin    >  %DEPLOY_ROMS_DIR%\narzod.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\nebula.bin    >  %DEPLOY_ROMS_DIR%\nebula.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\Omega16k.bin  >  %DEPLOY_ROMS_DIR%\Omega16k.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\Pitchers.bin  >  %DEPLOY_ROMS_DIR%\Pitchers.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\patriot.bin   >  %DEPLOY_ROMS_DIR%\patriot.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\polar.bin     >  %DEPLOY_ROMS_DIR%\polar.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\pole.bin      >  %DEPLOY_ROMS_DIR%\pole.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\revector.bin  >  %DEPLOY_ROMS_DIR%\revector.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\ripoff.bin    >  %DEPLOY_ROMS_DIR%\ripoff.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\rocks.bin     >  %DEPLOY_ROMS_DIR%\rocks.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\scramble.bin  >  %DEPLOY_ROMS_DIR%\scramble.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\sfpd.bin      >  %DEPLOY_ROMS_DIR%\sfpd.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\solar.bin     >  %DEPLOY_ROMS_DIR%\solar.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\spike.bin     >  %DEPLOY_ROMS_DIR%\spike.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\spikehop.bin  >  %DEPLOY_ROMS_DIR%\spikehop.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\spikewater.bin>  %DEPLOY_ROMS_DIR%\spikewater.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\space.bin     >  %DEPLOY_ROMS_DIR%\space.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\spinball.bin  >  %DEPLOY_ROMS_DIR%\spinball.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\starhawk.bin  >  %DEPLOY_ROMS_DIR%\starhawk.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\starship.vec >  %DEPLOY_ROMS_DIR%\starship.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\startrek.bin  >  %DEPLOY_ROMS_DIR%\startrek.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\sweep.bin     >  %DEPLOY_ROMS_DIR%\sweep.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\tdf.bin       >  %DEPLOY_ROMS_DIR%\tdf.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\thrust.bin    >  %DEPLOY_ROMS_DIR%\thrust.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\tsu-dl.bin    >  %DEPLOY_ROMS_DIR%\tsu.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\vecmania1.bin >  %DEPLOY_ROMS_DIR%\vecmania1.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\vecmania2.bin >  %DEPLOY_ROMS_DIR%\vecmania2.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\Vectrexians-1999-PD.vec >  %DEPLOY_ROMS_DIR%\vectrexians.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\vix-dl.bin    >  %DEPLOY_ROMS_DIR%\vix.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\webwars.bin   >  %DEPLOY_ROMS_DIR%\webwars.js || goto :error
%TOJSSTR% Globals.cartdata %ROMS_DIR%\wotr.bin      >  %DEPLOY_ROMS_DIR%\wotr.js || goto :error

goto :EOF

:error
echo Failed with error #%errorlevel%.
exit /b %errorlevel%
