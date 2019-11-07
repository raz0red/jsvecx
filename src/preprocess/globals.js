/*
JSVecX : JavaScript port of the VecX emulator by raz0red.
         Copyright (C) 2010-2019 raz0red

The original C version was written by Valavan Manohararajah
(http://valavan.net/vectrex.html).
*/

/*
  Emulation of the AY-3-8910 / YM2149 sound chip.

  Based on various code snippets by Ville Hallik, Michael Cuddy,
  Tatsuyuki Satoh, Fabrice Frances, Nicola Salmoria.
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
