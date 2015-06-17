/*
JSVecX : JavaScript port of the VecX emulator by raz0red.
         Copyright (C) 2010 raz0red (www.twitchasylum.com)

The original C version was written by Valavan Manohararajah
(http://www.valavan.net/vectrex.html).

This software is provided 'as-is', without any express or implied
warranty.  In no event will the authors be held liable for any
damages arising from the use of this software.

Permission is granted to anyone to use this software for any
purpose, including commercial applications, and to alter it and
redistribute it freely, subject to the following restrictions:

1.	The origin of this software must not be misrepresented; you
must not claim that you wrote the original software. If you use
this software in a product, an acknowledgment in the product
documentation would be appreciated but is not required.

2.	Altered source versions must be plainly marked as such, and
must not be misrepresented as being the original software.

3.	This notice may not be removed or altered from any source
distribution.
*/

var Globals =
{
    romdata: null,
    cartdata: null,
    VECTREX_MHZ: 1500000,
    VECTREX_COLORS: 128,
    ALG_MAX_X: 33000,
    ALG_MAX_Y: 41000,
    VECTREX_PDECAY: 30,
    VECTOR_HASH: 65521,
    SCREEN_X_DEFAULT: 330,
    SCREEN_Y_DEFAULT: 410
}
Globals.FCYCLES_INIT = Globals.VECTREX_MHZ / Globals.VECTREX_PDECAY >> 0;
Globals.VECTOR_CNT = Globals.VECTREX_MHZ / Globals.VECTREX_PDECAY >> 0;
