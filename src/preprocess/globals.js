/*
JSVecX : JavaScript port of the VecX emulator by Valavan Manohararajah,
         (http://www.valavan.net/vectrex.html).

Copyright (C) 2010
raz0red (www.twitchasylum.com)

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
    romdata: null, /* The vectrex rom */
    cartdata: null, /* The cartridge rom */

    VECTREX_MHZ: 1500000, /* speed of the vectrex being emulated */
    VECTREX_COLORS: 128,     /* number of possible colors ... grayscale */
    ALG_MAX_X: 33000,
    ALG_MAX_Y: 41000,
    VECTREX_PDECAY: 30, /* phosphor decay rate */
    VECTOR_HASH: 65521,
    SCREEN_X_DEFAULT: 330,
    SCREEN_Y_DEFAULT: 410
}

/* number of 6809 cycles before a frame redraw */
Globals.FCYCLES_INIT = Globals.VECTREX_MHZ / Globals.VECTREX_PDECAY >> 0; // raz

/* max number of possible vectors that maybe on the screen at one time.
 * one only needs VECTREX_MHZ / VECTREX_PDECAY but we need to also store
 * deleted vectors in a single table
 */
Globals.VECTOR_CNT = Globals.VECTREX_MHZ / Globals.VECTREX_PDECAY >> 0; // raz
