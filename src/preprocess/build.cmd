mcpp -j -P e6809.js | grep -v "^$" > tmp.js
cat header.js tmp.js > ..\deploy\js\e6809.js
del tmp.js

mcpp -j -P -@old e8910.js | grep -v "^$" > tmp.js
cat header.js tmp.js > ..\deploy\js\e8910.js
del tmp.js

mcpp -j -P vecx.js | grep -v "^$" > tmp.js
cat header.js tmp.js > ..\deploy\js\vecx.js
del tmp.js

mcpp -j -P osint.js | grep -v "^$" > tmp.js
cat header.js tmp.js > ..\deploy\js\osint.js
del tmp.js

mcpp -j -P vector_t.js | grep -v "^$" > tmp.js
cat header.js tmp.js > ..\deploy\js\vector_t.js
del tmp.js

mcpp -j -P utils.js | grep -v "^$" > tmp.js
cat header.js tmp.js > ..\deploy\js\utils.js
del tmp.js

mcpp -j -P globals.js | grep -v "^$" > tmp.js
cat header.js tmp.js > ..\deploy\js\globals.js
del tmp.js