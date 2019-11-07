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
