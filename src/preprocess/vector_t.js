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

function vector_t()
{
    //long x0, y0; /* start coordinate */
    this.x0 = 0;
    this.y0 = 0;
    //long x1, y1; /* end coordinate */
    this.x1 = 0;
    this.y1 = 0;

    /* color [0, VECTREX_COLORS - 1], if color = VECTREX_COLORS, then this is
     * an invalid entry and must be ignored.
     */
    //unsigned char color;
    this.color = 0;

    this.reset = function()
    {
        this.x0 = this.y0 = this.x1 = this.y1 = this.color = 0;        
    }
}
