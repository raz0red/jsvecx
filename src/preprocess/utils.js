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
