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

function osint()
{
    this.vecx = null;

    /* the emulators heart beats at 20 milliseconds */
    this.EMU_TIMER = 20;

    //static long screen_x;
    this.screen_x = 0;
    //static long screen_y;
    this.screen_y = 0;
    //static long scl_factor;
    this.scl_factor = 0;
    //static DWORD color_set[VECTREX_COLORS];
    this.color_set = new Array(Globals.VECTREX_COLORS);

    this.bytes_per_pixel = 4;

    this.osint_updatescale = function()
    {
        //long sclx, scly;
        var sclx = Globals.ALG_MAX_X / this.screen_x >> 0; // raz
        var scly = Globals.ALG_MAX_Y / this.screen_y >> 0; // raz

        if( sclx > scly )
        {
            this.scl_factor = sclx;
        }
        else
        {
            this.scl_factor = scly;
        }
    }

    //static int osint_defaults (void)
    this.osint_defaults = function()
    {
        this.osint_updatescale();

        return 0;
    }

    this.osint_gencolors = function()
    {
        for( var c = 0; c < Globals.VECTREX_COLORS; c++ )
        {
            var rcomp = c * 256 / Globals.VECTREX_COLORS >> 0; // raz
            var gcomp = c * 256 / Globals.VECTREX_COLORS >> 0; // raz
            var bcomp = c * 256 / Globals.VECTREX_COLORS >> 0; // raz

            this.color_set[c] = new Array(3);
            this.color_set[c][0] = rcomp;
            this.color_set[c][1] = gcomp;
            this.color_set[c][2] = bcomp;
        }
    }

    //static einline unsigned char *osint_pixelptr (long x, long y)
    this.osint_pixelindex = function( x, y )
    {
        return ( y * this.lPitch ) + ( x * this.bytes_per_pixel );
    }

    this.osint_clearscreen = function()
    {
        for( var x = 0; x < ( this.screen_y * this.lPitch ); x++ )
        {
            if( ( x + 1 ) % 4 )
            {
                this.imageData.data[x] = 0;
            }
        }

        this.ctx.putImageData(this.imageData, 0, 0);
    }

    /* draw a line with a slope between 0 and 1.
     * x is the "driving" axis. x0 < x1 and y0 < y1.
     */
    //static void osint_linep01 (long x0, long y0, long x1, long y1, unsigned char color)
    this.osint_linep01 = function( x0, y0, x1, y1, color )
    {
        var data = this.data;
        var color_set = this.color_set;
        var lPitch = this.lPitch;
        var bytes_per_pixel = this.bytes_per_pixel;

        var dx = ( x1 - x0 );
        var dy = ( y1 - y0 );
        var i0 = x0 / this.scl_factor >> 0; // raz
        var i1 = x1 / this.scl_factor >> 0; // raz
        var j = y0 / this.scl_factor >> 0; // raz
        var e = dy * (this.scl_factor - (x0 % this.scl_factor)) -
            dx * (this.scl_factor - (y0 % this.scl_factor));
        dx *= this.scl_factor;
        dy *= this.scl_factor;

        var idx = this.osint_pixelindex(i0, j);

        for( ; i0 <= i1; i0++ )
        {
            data[idx] = color_set[color][0];
            data[idx + 1] = color_set[color][1];
            data[idx + 2] = color_set[color][2];

            if( e >= 0 )
            {
                idx += lPitch;
                e -= dx;
            }

            e += dy;
            idx += bytes_per_pixel;
        }
    }

    /* draw a line with a slope between 1 and +infinity.
     * y is the "driving" axis. y0 < y1 and x0 < x1.
     */
    //static void osint_linep1n (long x0, long y0, long x1, long y1, unsigned char color)
    this.osint_linep1n = function( x0, y0, x1, y1, color )
    {
        var data = this.data;
        var color_set = this.color_set;
        var lPitch = this.lPitch;
        var bytes_per_pixel = this.bytes_per_pixel;

        var dx = ( x1 - x0 );
        var dy = ( y1 - y0 );
        var i0 = y0 / this.scl_factor >> 0; // raz
        var i1 = y1 / this.scl_factor >> 0; // raz
        var j = x0 / this.scl_factor >> 0; // raz
        var e = dx * (this.scl_factor - (y0 % this.scl_factor)) -
            dy * (this.scl_factor - (x0 % this.scl_factor));
        dx *= this.scl_factor;
        dy *= this.scl_factor;

        var idx = this.osint_pixelindex(j, i0);

        for( ; i0 <= i1; i0++ )
        {
            data[idx] = color_set[color][0];
            data[idx + 1] = color_set[color][1];
            data[idx + 2] = color_set[color][2];

            if( e >= 0 )
            {
                idx += bytes_per_pixel;
                e -= dy;
            }

            e += dx;
            idx += lPitch;
        }
    }

    /* draw a line with a slope between 0 and -1.
     * x is the "driving" axis. x0 < x1 and y1 < y0.
     */

    //static void osint_linen01 (long x0, long y0, long x1, long y1, unsigned char color)
    this.osint_linen01 = function( x0, y0, x1, y1, color )
    {
        var data = this.data;
        var color_set = this.color_set;
        var lPitch = this.lPitch;
        var bytes_per_pixel = this.bytes_per_pixel;

        var dx = ( x1 - x0 );
        var dy = ( y0 - y1 );
        var i0 = x0 / this.scl_factor >> 0; // raz
        var i1 = x1 / this.scl_factor >> 0; // raz
        var j = y0 / this.scl_factor >> 0; // raz
        var e = dy * (this.scl_factor - (x0 % this.scl_factor)) -
            dx * (y0 % this.scl_factor);
        dx *= this.scl_factor;
        dy *= this.scl_factor;

        var idx = this.osint_pixelindex(i0, j);

        for( ; i0 <= i1; i0++ )
        {
            data[idx] = color_set[color][0];
            data[idx + 1] = color_set[color][1];
            data[idx + 2] = color_set[color][2];

            if( e >= 0 )
            {
                idx -= lPitch;
                e -= dx;
            }

            e += dy;
            idx += bytes_per_pixel;
        }
    }

    /* draw a line with a slope between -1 and -infinity.
     * y is the "driving" axis. y0 < y1 and x1 < x0.
     */

    //static void osint_linen1n (long x0, long y0, long x1, long y1, unsigned char color)
    this.osint_linen1n = function( x0, y0, x1, y1, color )
    {
        var data = this.data;
        var color_set = this.color_set;
        var lPitch = this.lPitch;
        var bytes_per_pixel = this.bytes_per_pixel;

        var dx = ( x0 - x1 );
        var dy = ( y1 - y0 );
        var i0 = y0 / this.scl_factor >> 0; // raz
        var i1 = y1 / this.scl_factor >> 0; // raz
        var j = x0 / this.scl_factor >> 0; // raz
        var e = dx * (this.scl_factor - (y0 % this.scl_factor)) -
            dy * (x0 % this.scl_factor);
        dx *= this.scl_factor;
        dy *= this.scl_factor;

        var idx = this.osint_pixelindex(j, i0);

        for( ; i0 <= i1; i0++ )
        {
            data[idx] = color_set[color][0];
            data[idx + 1] = color_set[color][1];
            data[idx + 2] = color_set[color][2];

            if( e >= 0 )
            {
                idx -= bytes_per_pixel;
                e -= dy;
            }

            e += dx;
            idx += lPitch;
        }
    }

    //static void osint_line (long x0, long y0, long x1, long y1, unsigned char color)
    this.osint_line = function( x0, y0, x1, y1, color )
    {
        if( x1 > x0 )
        {
            if( y1 > y0 )
            {
                if( (x1 - x0) > (y1 - y0) )
                {
                    this.osint_linep01(x0, y0, x1, y1, color);
                }
                else
                {
                    this.osint_linep1n(x0, y0, x1, y1, color);
                }
            }
            else
            {
                if( (x1 - x0) > (y0 - y1) )
                {
                    this.osint_linen01(x0, y0, x1, y1, color);
                }
                else
                {
                    this.osint_linen1n(x1, y1, x0, y0, color);
                }
            }
        }
        else
        {
            if( y1 > y0 )
            {
                if( (x0 - x1) > (y1 - y0) )
                {
                    this.osint_linen01(x1, y1, x0, y0, color);
                }
                else
                {
                    this.osint_linen1n(x0, y0, x1, y1, color);
                }
            }
            else
            {
                if( (x0 - x1) > (y0 - y1) )
                {
                    this.osint_linep01(x1, y1, x0, y0, color);
                }
                else
                {
                    this.osint_linep1n(x1, y1, x0, y0, color);
                }
            }
        }
    }

    this.osint_render = function()
    {
        var vector_erse_cnt = this.vecx.vector_erse_cnt;
        var vectors_erse = this.vecx.vectors_erse;
        var vector_draw_cnt = this.vecx.vector_draw_cnt;
        var vectors_draw = this.vecx.vectors_draw;
        var v = 0;
        var erse = null;
        var draw = null;
        var vectrexColors = Globals.VECTREX_COLORS;

        for( v = 0; v < vector_erse_cnt; v++ )
        {
            erse = vectors_erse[v];
            if( erse.color != vectrexColors )
            {
                this.osint_line(erse.x0, erse.y0, erse.x1, erse.y1, 0);
            }
        }

        for( v = 0; v < vector_draw_cnt; v++ )
        {
            draw = vectors_draw[v];
            this.osint_line(draw.x0, draw.y0, draw.x1, draw.y1, draw.color);
        }

        this.ctx.putImageData(this.imageData, 0, 0);
    }

    this.init = function( vecx )
    {
        this.vecx = vecx;

        // Set up the dimensions
        this.screen_x = Globals.SCREEN_X_DEFAULT;
        this.screen_y = Globals.SCREEN_Y_DEFAULT;
        this.lPitch = this.bytes_per_pixel * this.screen_x;

        this.osint_defaults();

        // Graphics
        this.canvas = document.getElementById('screen');
        this.ctx = this.canvas.getContext('2d');
        this.imageData = this.ctx.getImageData(0, 0, this.screen_x, this.screen_y);
        this.data = this.imageData.data;

        /* set alpha to opaque */
        for( var i = 3; i < this.imageData.data.length - 3; i += 4 )
        {
            this.imageData.data[i] = 0xFF;
        }

        /* determine a set of colors to use based */
        this.osint_gencolors();
        this.osint_clearscreen();
    }
}

//Globals.osint = new osint();
