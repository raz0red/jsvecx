/*
JSVecX : JavaScript port of the VecX emulator by raz0red.
         Copyright (C) 2010-2019 raz0red (twitchasylum.com)

The original C version was written by Valavan Manohararajah
(http://valavan.net/vectrex.html).

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

/*
  Emulation of the AY-3-8910 / YM2149 sound chip.

  Based on various code snippets by Ville Hallik, Michael Cuddy,
  Tatsuyuki Satoh, Fabrice Frances, Nicola Salmoria.
*/


function fptr( value )
{
    this.value = value;
}
function Utils()
{
    this.errorCount = 1;
    this.logCount = 500;
    this.showError = function( error )
    {
        if( this.errorCount > 0 )
        {
            console.log(error);
            this.errorCount--;
        }
    }
    this.initArray = function( arr, value )
    {
        for( var i = 0; i < arr.length; i++ )
        {
            arr[i] = value;
        }
    }
}
var utils = new Utils();
