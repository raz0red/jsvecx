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

function VecX()
{
    this.osint = new osint();
    this.e6809 = new e6809();
    this.e8910 = new e8910();
    this.rom = new Array(0x2000);
    utils.initArray(this.rom, 0);
    this.cart = new Array(0x8000);
    utils.initArray(this.cart, 0);
    this.ram = new Array(0x400);
    utils.initArray(this.ram, 0);
    this.snd_regs = new Array(16);
    this.e8910.init(this.snd_regs);
    this.snd_select = 0;
    this.via_ora = 0;
    this.via_orb = 0;
    this.via_ddra = 0;
    this.via_ddrb = 0;
    this.via_t1on = 0;
    this.via_t1int = 0;
    this.via_t1c = 0;
    this.via_t1ll = 0;
    this.via_t1lh = 0;
    this.via_t1pb7 = 0;
    this.via_t2on = 0;
    this.via_t2int = 0;
    this.via_t2c = 0;
    this.via_t2ll = 0;
    this.via_sr = 0;
    this.via_srb = 0;
    this.via_src = 0;
    this.via_srclk = 0;
    this.via_acr = 0;
    this.via_pcr = 0;
    this.via_ifr = 0;
    this.via_ier = 0;
    this.via_ca2 = 0;
    this.via_cb2h = 0;
    this.via_cb2s = 0;
    this.alg_rsh = 0;
    this.alg_xsh = 0;
    this.alg_ysh = 0;
    this.alg_zsh = 0;
    this.alg_jch0 = 0;
    this.alg_jch1 = 0;
    this.alg_jch2 = 0;
    this.alg_jch3 = 0;
    this.alg_jsh = 0;
    this.alg_compare = 0;
    this.alg_dx = 0;
    this.alg_dy = 0;
    this.alg_curr_x = 0;
    this.alg_curr_y = 0;
    this.alg_max_x = Globals.ALG_MAX_X >> 1;
    this.alg_max_y = Globals.ALG_MAX_Y >> 1;
    this.alg_vectoring = 0;
    this.alg_vector_x0 = 0;
    this.alg_vector_y0 = 0;
    this.alg_vector_x1 = 0;
    this.alg_vector_y1 = 0;
    this.alg_vector_dx = 0;
    this.alg_vector_dy = 0;
    this.alg_vector_color = 0;
    this.vector_draw_cnt = 0;
    this.vector_erse_cnt = 0;
    this.vectors_draw = new Array(Globals.VECTOR_CNT);
    this.vectors_erse = new Array(Globals.VECTOR_CNT);
    this.vector_hash = new Array(Globals.VECTOR_HASH);
    utils.initArray(this.vector_hash, 0);
    this.fcycles = 0;
    this.snd_update = function()
    {
        switch( this.via_orb & 0x18 )
        {
            case 0x00:
                break;
            case 0x08:
                break;
            case 0x10:
                if( this.snd_select != 14 )
                {
                    this.snd_regs[this.snd_select] = this.via_ora;
                    this.e8910.e8910_write(this.snd_select, this.via_ora);
                }
                break;
            case 0x18:
                if( (this.via_ora & 0xf0) == 0x00 )
                {
                    this.snd_select = this.via_ora & 0x0f;
                }
                break;
        }
    }
    this.alg_update = function()
    {
        switch( this.via_orb & 0x06 )
        {
            case 0x00:
                this.alg_jsh = this.alg_jch0;
                if( (this.via_orb & 0x01) == 0x00 )
                {
                    this.alg_ysh = this.alg_xsh;
                }
                break;
            case 0x02:
                this.alg_jsh = this.alg_jch1;
                if( (this.via_orb & 0x01) == 0x00 )
                {
                    this.alg_rsh = this.alg_xsh;
                }
                break;
            case 0x04:
                this.alg_jsh = this.alg_jch2;
                if( (this.via_orb & 0x01) == 0x00 )
                {
                    if( this.alg_xsh > 0x80 )
                    {
                        this.alg_zsh = this.alg_xsh - 0x80;
                    }
                    else
                    {
                        this.alg_zsh = 0;
                    }
                }
                break;
            case 0x06:
                this.alg_jsh = this.alg_jch3;
                break;
        }
        if( this.alg_jsh > this.alg_xsh )
        {
            this.alg_compare = 0x20;
        }
        else
        {
            this.alg_compare = 0;
        }
        this.alg_dx = this.alg_xsh - this.alg_rsh;
        this.alg_dy = this.alg_rsh - this.alg_ysh;
    }
    this.read8 = function( address )
    {
        address &= 0xffff;
        if( (address & 0xe000) == 0xe000 )
        {
            return this.rom[address & 0x1fff] & 0xff;
        }
        if( (address & 0xe000) == 0xc000 )
        {
            if( address & 0x800 )
            {
                return this.ram[address & 0x3ff] & 0xff;
            }
            var data = 0;
            switch( address & 0xf )
            {
                case 0x0:
                    if( this.via_acr & 0x80 )
                    {
                        data = ((this.via_orb & 0x5f) | this.via_t1pb7 | this.alg_compare);
                    }
                    else
                    {
                        data = ((this.via_orb & 0xdf) | this.alg_compare);
                    }
                    return data & 0xff;
                case 0x1:
                    if( (this.via_pcr & 0x0e) == 0x08 )
                    {
                        this.via_ca2 = 0;
                    }
                case 0xf:
                    if( (this.via_orb & 0x18) == 0x08 )
                    {
                        data = this.snd_regs[this.snd_select];
                    }
                    else
                    {
                        data = this.via_ora;
                    }
                    return data & 0xff;
                case 0x2:
                    return this.via_ddrb & 0xff;
                case 0x3:
                    return this.via_ddra & 0xff;
                case 0x4:
                    data = this.via_t1c;
                    this.via_ifr &= 0xbf;
                    this.via_t1on = 0;
                    this.via_t1int = 0;
                    this.via_t1pb7 = 0x80;
                    if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                    {
                        this.via_ifr |= 0x80;
                    }
                    else
                    {
                        this.via_ifr &= 0x7f;
                    }
                    return data & 0xff;
                case 0x5:
                    return (this.via_t1c >> 8) & 0xff;
                case 0x6:
                    return this.via_t1ll & 0xff;
                case 0x7:
                    return this.via_t1lh & 0xff;
                case 0x8:
                    data = this.via_t2c;
                    this.via_ifr &= 0xdf;
                    this.via_t2on = 0;
                    this.via_t2int = 0;
                    if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                    {
                        this.via_ifr |= 0x80;
                    }
                    else
                    {
                        this.via_ifr &= 0x7f;
                    }
                    return data & 0xff;
                case 0x9:
                    return (this.via_t2c >> 8);
                case 0xa:
                    data = this.via_sr;
                    this.via_ifr &= 0xfb;
                    this.via_srb = 0;
                    this.via_srclk = 1;
                    if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                    {
                        this.via_ifr |= 0x80;
                    }
                    else
                    {
                        this.via_ifr &= 0x7f;
                    }
                    return data & 0xff;
                case 0xb:
                    return this.via_acr & 0xff;
                case 0xc:
                    return this.via_pcr & 0xff;
                case 0xd:
                    return this.via_ifr & 0xff;
                case 0xe:
                    return (this.via_ier | 0x80) & 0xff;
            }
        }
        if( address < 0x8000 )
        {
            return this.cart[address] & 0xff;
        }
        return 0xff;
    }
    this.write8 = function( address, data )
    {
        address &= 0xffff;
        data &= 0xff;
        if( (address & 0xe000) == 0xe000 )
        {
        }
        else if( (address & 0xe000) == 0xc000 )
        {
            if( address & 0x800 )
            {
                this.ram[address & 0x3ff] = data;
            }
            if( address & 0x1000 )
            {
                switch( address & 0xf )
                {
                    case 0x0:
                        this.via_orb = data;
                        this.snd_update();
                        this.alg_update();
                        if( (this.via_pcr & 0xe0) == 0x80 )
                        {
                            this.via_cb2h = 0;
                        }
                        break;
                    case 0x1:
                        if( (this.via_pcr & 0x0e) == 0x08 )
                        {
                            this.via_ca2 = 0;
                        }
                    case 0xf:
                        this.via_ora = data;
                        this.snd_update();
                        this.alg_xsh = data ^ 0x80;
                        this.alg_update();
                        break;
                    case 0x2:
                        this.via_ddrb = data;
                        break;
                    case 0x3:
                        this.via_ddra = data;
                        break;
                    case 0x4:
                        this.via_t1ll = data;
                        break;
                    case 0x5:
                        this.via_t1lh = data;
                        this.via_t1c = (this.via_t1lh << 8) | this.via_t1ll;
                        this.via_ifr &= 0xbf;
                        this.via_t1on = 1;
                        this.via_t1int = 1;
                        this.via_t1pb7 = 0;
                        if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                        {
                            this.via_ifr |= 0x80;
                        }
                        else
                        {
                            this.via_ifr &= 0x7f;
                        }
                        break;
                    case 0x6:
                        this.via_t1ll = data;
                        break;
                    case 0x7:
                        this.via_t1lh = data;
                        break;
                    case 0x8:
                        this.via_t2ll = data;
                        break;
                    case 0x9:
                        this.via_t2c = (data << 8) | this.via_t2ll;
                        this.via_ifr &= 0xdf;
                        this.via_t2on = 1;
                        this.via_t2int = 1;
                        if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                        {
                            this.via_ifr |= 0x80;
                        }
                        else
                        {
                            this.via_ifr &= 0x7f;
                        }
                        break;
                    case 0xa:
                        this.via_sr = data;
                        this.via_ifr &= 0xfb;
                        this.via_srb = 0;
                        this.via_srclk = 1;
                        if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                        {
                            this.via_ifr |= 0x80;
                        }
                        else
                        {
                            this.via_ifr &= 0x7f;
                        }
                        break;
                    case 0xb:
                        this.via_acr = data;
                        break;
                    case 0xc:
                        this.via_pcr = data;
                        if( (this.via_pcr & 0x0e) == 0x0c )
                        {
                            this.via_ca2 = 0;
                        }
                        else
                        {
                            this.via_ca2 = 1;
                        }
                        if( (this.via_pcr & 0xe0) == 0xc0 )
                        {
                            this.via_cb2h = 0;
                        }
                        else
                        {
                            this.via_cb2h = 1;
                        }
                        break;
                    case 0xd:
                        this.via_ifr &= (~(data & 0x7f));
                        if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                        {
                            this.via_ifr |= 0x80;
                        }
                        else
                        {
                            this.via_ifr &= 0x7f;
                        }
                        break;
                    case 0xe:
                        if( data & 0x80 )
                        {
                            this.via_ier |= data & 0x7f;
                        }
                        else
                        {
                            this.via_ier &= (~(data & 0x7f));
                        }
                        if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                        {
                            this.via_ifr |= 0x80;
                        }
                        else
                        {
                            this.via_ifr &= 0x7f;
                        }
                        break;
                }
            }
        }
        else if( address < 0x8000 )
        {
        }
    }
    this.vecx_reset = function()
    {
        for( var r = 0; r < this.ram.length; r++ )
        {
            this.ram[r] = r & 0xff;
        }
        for( var r = 0; r < 16; r++ )
        {
            this.snd_regs[r] = 0;
            this.e8910.e8910_write(r, 0);
        }
        this.snd_regs[14] = 0xff;
        this.e8910.e8910_write(14, 0xff);
        this.snd_select = 0;
        this.via_ora = 0;
        this.via_orb = 0;
        this.via_ddra = 0;
        this.via_ddrb = 0;
        this.via_t1on = 0;
        this.via_t1int = 0;
        this.via_t1c = 0;
        this.via_t1ll = 0;
        this.via_t1lh = 0;
        this.via_t1pb7 = 0x80;
        this.via_t2on = 0;
        this.via_t2int = 0;
        this.via_t2c = 0;
        this.via_t2ll = 0;
        this.via_sr = 0;
        this.via_srb = 8;
        this.via_src = 0;
        this.via_srclk = 0;
        this.via_acr = 0;
        this.via_pcr = 0;
        this.via_ifr = 0;
        this.via_ier = 0;
        this.via_ca2 = 1;
        this.via_cb2h = 1;
        this.via_cb2s = 0;
        this.alg_rsh = 128;
        this.alg_xsh = 128;
        this.alg_ysh = 128;
        this.alg_zsh = 0;
        this.alg_jch0 = 128;
        this.alg_jch1 = 128;
        this.alg_jch2 = 128;
        this.alg_jch3 = 128;
        this.alg_jsh = 128;
        this.alg_compare = 0;
        this.alg_dx = 0;
        this.alg_dy = 0;
        this.alg_curr_x = Globals.ALG_MAX_X >> 1;
        this.alg_curr_y = Globals.ALG_MAX_Y >> 1;
        this.alg_vectoring = 0;
        this.vector_draw_cnt = 0;
        this.vector_erse_cnt = 0;
        for( var i = 0; i < this.vectors_draw.length; i++ )
        {
            if( !this.vectors_draw[i] )
            {
                this.vectors_draw[i] = new vector_t();
            }
            else
            {
                this.vectors_draw[i].reset();
            }
        }
        for( var i = 0; i < this.vectors_erse.length; i++ )
        {
            if( !this.vectors_erse[i] )
            {
                this.vectors_erse[i] = new vector_t();
            }
            else
            {
                this.vectors_erse[i].reset();
            }
        }
        var len = Globals.romdata.length;
        for( var i = 0; i < len; i++ )
        {
            this.rom[i] = Globals.romdata.charCodeAt(i);
        }
        len = this.cart.length;
        for( var b = 0; b < len; b++ )
        {
            this.cart[b] = 0x01;
        }
        if( Globals.cartdata != null )
        {
            len = Globals.cartdata.length;
            for( var i = 0; i < len; i++ )
            {
                this.cart[i] = Globals.cartdata.charCodeAt(i);
            }
        }
        this.fcycles = Globals.FCYCLES_INIT;
        this.e6809.e6809_reset();
    }
    this.t2shift = 0;
    this.alg_addline = function( x0, y0, x1, y1, color )
    {
        var key = 0;
        var index = 0;
        var curVec = null;
        key = x0;
        key = key * 31 + y0;
        key = key * 31 + x1;
        key = key * 31 + y1;
        key %= Globals.VECTOR_HASH;
        curVec = null;
        index = this.vector_hash[key];
        if( index >= 0 && index < this.vector_draw_cnt )
        {
            curVec = this.vectors_draw[index];
        }
        if( curVec != null &&
            x0 == curVec.x0 && y0 == curVec.y0 &&
            x1 == curVec.x1 && y1 == curVec.y1 )
        {
            curVec.color = color;
        }
        else
        {
            curVec = null;
            if( index >= 0 && index < this.vector_erse_cnt )
            {
                curVec = this.vectors_erse[index];
            }
            if( curVec != null &&
                x0 == curVec.x0 && y0 == curVec.y0 &&
                x1 == curVec.x1 && y1 == curVec.y1 )
            {
                this.vectors_erse[index].color = Globals.VECTREX_COLORS;
            }
            curVec = this.vectors_draw[this.vector_draw_cnt];
            curVec.x0 = x0; curVec.y0 = y0;
            curVec.x1 = x1; curVec.y1 = y1;
            curVec.color = color;
            this.vector_hash[key] = this.vector_draw_cnt;
            this.vector_draw_cnt++;
        }
    }
    this.vecx_emu = function( cycles, ahead )
    {
        var icycles = 0;
        var c = 0;
        var tmp = null;
        var e6809 = this.e6809;
        var osint = this.osint;
        var fcycles_add = Globals.FCYCLES_INIT;
        var sig_dx = 0;
        var sig_dy = 0;
        var sig_ramp = 0;
        var sig_blank = 0;
        while( cycles > 0 )
        {
            icycles = e6809.e6809_sstep(this.via_ifr & 0x80, 0);
            for( c = 0; c < icycles; c++ )
            {
                this.t2shift = 0;
                if( this.via_t1on )
                {
                    this.via_t1c = ( this.via_t1c > 0 ? this.via_t1c - 1 : 0xffff );
                    if( (this.via_t1c & 0xffff) == 0xffff )
                    {
                        if( this.via_acr & 0x40 )
                        {
                            this.via_ifr |= 0x40;
                            if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                            {
                                this.via_ifr |= 0x80;
                            }
                            else
                            {
                                this.via_ifr &= 0x7f;
                            }
                            this.via_t1pb7 = 0x80 - this.via_t1pb7;
                            this.via_t1c = (this.via_t1lh << 8) | this.via_t1ll;
                        }
                        else
                        {
                            if( this.via_t1int )
                            {
                                this.via_ifr |= 0x40;
                                if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                                {
                                    this.via_ifr |= 0x80;
                                }
                                else
                                {
                                    this.via_ifr &= 0x7f;
                                }
                                this.via_t1pb7 = 0x80;
                                this.via_t1int = 0;
                            }
                        }
                    }
                }
                if( this.via_t2on && (this.via_acr & 0x20) == 0x00 )
                {
                    this.via_t2c = ( this.via_t2c > 0 ? this.via_t2c - 1 : 0xffff );
                    if( (this.via_t2c & 0xffff) == 0xffff )
                    {
                        if( this.via_t2int )
                        {
                            this.via_ifr |= 0x20;
                            if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                            {
                                this.via_ifr |= 0x80;
                            }
                            else
                            {
                                this.via_ifr &= 0x7f;
                            }
                            this.via_t2int = 0;
                        }
                    }
                }
                this.via_src = ( this.via_src > 0 ? this.via_src - 1 : 0xff );
                if( (this.via_src & 0xff) == 0xff )
                {
                    this.via_src = this.via_t2ll;
                    if( this.via_srclk )
                    {
                        this.t2shift = 1;
                        this.via_srclk = 0;
                    }
                    else
                    {
                        this.t2shift = 0;
                        this.via_srclk = 1;
                    }
                }
                else
                {
                    this.t2shift = 0;
                }
                if( this.via_srb < 8 )
                {
                    switch( this.via_acr & 0x1c )
                    {
                        case 0x00:
                            break;
                        case 0x04:
                            if( this.t2shift )
                            {
                                this.via_sr <<= 1;
                                this.via_srb++;
                            }
                            break;
                        case 0x08:
                            this.via_sr <<= 1;
                            this.via_srb++;
                            break;
                        case 0x0c:
                            break;
                        case 0x10:
                            if( this.t2shift )
                            {
                                this.via_cb2s = (this.via_sr >> 7) & 1;
                                this.via_sr <<= 1;
                                this.via_sr |= this.via_cb2s;
                            }
                            break;
                        case 0x14:
                            if( this.t2shift )
                            {
                                this.via_cb2s = (this.via_sr >> 7) & 1;
                                this.via_sr <<= 1;
                                this.via_sr |= this.via_cb2s;
                                this.via_srb++;
                            }
                            break;
                        case 0x18:
                            this.via_cb2s = (this.via_sr >> 7) & 1;
                            this.via_sr <<= 1;
                            this.via_sr |= this.via_cb2s;
                            this.via_srb++;
                            break;
                        case 0x1c:
                            break;
                    }
                    if( this.via_srb == 8 )
                    {
                        this.via_ifr |= 0x04;
                        if( (this.via_ifr & 0x7f) & (this.via_ier & 0x7f) )
                        {
                            this.via_ifr |= 0x80;
                        }
                        else
                        {
                            this.via_ifr &= 0x7f;
                        }
                    }
                }
                sig_dx = 0;
                sig_dy = 0;
                sig_ramp = 0;
                sig_blank = 0;
                if( (this.via_acr & 0x10) == 0x10 )
                {
                    sig_blank = this.via_cb2s;
                }
                else
                {
                    sig_blank = this.via_cb2h;
                }
                if( this.via_ca2 == 0 )
                {
                    sig_dx = this.alg_max_x - this.alg_curr_x;
                    sig_dy = this.alg_max_y - this.alg_curr_y;
                }
                else
                {
                    if( this.via_acr & 0x80 )
                    {
                        sig_ramp = this.via_t1pb7;
                    }
                    else
                    {
                        sig_ramp = this.via_orb & 0x80;
                    }
                    if( sig_ramp == 0 )
                    {
                        sig_dx = this.alg_dx;
                        sig_dy = this.alg_dy;
                    }
                    else
                    {
                        sig_dx = 0;
                        sig_dy = 0;
                    }
                }
                if( this.alg_vectoring == 0 )
                {
                    if( sig_blank == 1 &&
                        this.alg_curr_x >= 0 && this.alg_curr_x < Globals.ALG_MAX_X &&
                        this.alg_curr_y >= 0 && this.alg_curr_y < Globals.ALG_MAX_Y )
                    {
                        this.alg_vectoring = 1;
                        this.alg_vector_x0 = this.alg_curr_x;
                        this.alg_vector_y0 = this.alg_curr_y;
                        this.alg_vector_x1 = this.alg_curr_x;
                        this.alg_vector_y1 = this.alg_curr_y;
                        this.alg_vector_dx = sig_dx;
                        this.alg_vector_dy = sig_dy;
                        this.alg_vector_color = this.alg_zsh & 0xff;
                    }
                }
                else
                {
                    if( sig_blank == 0 )
                    {
                        this.alg_vectoring = 0;
                        this.alg_addline(this.alg_vector_x0, this.alg_vector_y0,
                            this.alg_vector_x1, this.alg_vector_y1,
                            this.alg_vector_color);
                    }
                    else if( sig_dx != this.alg_vector_dx ||
                             sig_dy != this.alg_vector_dy ||
                             ( this.alg_zsh & 0xff ) != this.alg_vector_color )
                    {
                        this.alg_addline(this.alg_vector_x0, this.alg_vector_y0,
                            this.alg_vector_x1, this.alg_vector_y1,
                            this.alg_vector_color);
                        if( this.alg_curr_x >= 0 && this.alg_curr_x < Globals.ALG_MAX_X &&
                            this.alg_curr_y >= 0 && this.alg_curr_y < Globals.ALG_MAX_Y )
                        {
                            this.alg_vector_x0 = this.alg_curr_x;
                            this.alg_vector_y0 = this.alg_curr_y;
                            this.alg_vector_x1 = this.alg_curr_x;
                            this.alg_vector_y1 = this.alg_curr_y;
                            this.alg_vector_dx = sig_dx;
                            this.alg_vector_dy = sig_dy;
                            this.alg_vector_color = this.alg_zsh & 0xff;
                        }
                        else
                        {
                            this.alg_vectoring = 0;
                        }
                    }
                }
                this.alg_curr_x += sig_dx;
                this.alg_curr_y += sig_dy;
                if( this.alg_vectoring == 1 &&
                    this.alg_curr_x >= 0 && this.alg_curr_x < Globals.ALG_MAX_X &&
                    this.alg_curr_y >= 0 && this.alg_curr_y < Globals.ALG_MAX_Y )
                {
                    this.alg_vector_x1 = this.alg_curr_x;
                    this.alg_vector_y1 = this.alg_curr_y;
                }
                if( (this.via_pcr & 0x0e) == 0x0a )
                {
                    this.via_ca2 = 1;
                }
                if( (this.via_pcr & 0xe0) == 0xa0 )
                {
                    this.via_cb2h = 1;
                }
            }
            cycles -= icycles;
            this.fcycles -= icycles;
            if( this.fcycles < 0 )
            {
                this.fcycles += fcycles_add;
                osint.osint_render();
                this.vector_erse_cnt = this.vector_draw_cnt;
                this.vector_draw_cnt = 0;
                tmp = this.vectors_erse;
                this.vectors_erse = this.vectors_draw;
                this.vectors_draw = tmp;
            }
        }
    }
    this.count = 0;
    this.startTime = null;
    this.nextFrameTime = null;
    this.extraTime = 0;
    this.fpsTimer = null;
    this.running = false;
    this.vecx_emuloop = function()
    {
        if( this.running ) return;
        this.running = true;
        var EMU_TIMER = this.osint.EMU_TIMER;
        var cycles = ( Globals.VECTREX_MHZ / 1000 >> 0 ) * EMU_TIMER;
        var vecx = this;
        this.startTime = this.nextFrameTime = new Date().getTime() + EMU_TIMER;
        this.count = 0;
        this.extraTime = 0;
        this.fpsTimer = setInterval(
            function()
            {
                vecx.status = "FPS: " +
                    ( vecx.count / ( new Date().getTime() - vecx.startTime )
                        * 1000.0 ).toFixed(2) + " (50)" +
                    ( vecx.extraTime > 0 ?
                       ( ", extra: " +
                            ( vecx.extraTime / ( vecx.count / 50 ) ).toFixed(2)
                                + " (ms)" ) : "" );
                if( vecx.count > 500 )
                {
                    vecx.startTime = new Date().getTime();
                    vecx.count = 0;
                    vecx.extraTime = 0;
                }
            }, 2000
        );
        var f = function()
        {
            if( !vecx.running ) return;
            vecx.snd_regs[14] = vecx.shadow_snd_regs14;
            vecx.vecx_emu.call( vecx, cycles, 0 );
            vecx.count++;
            var now = new Date().getTime();
            var waitTime = vecx.nextFrameTime - now;
            vecx.extraTime += waitTime;
            if( waitTime < -EMU_TIMER ) waitTime = -EMU_TIMER;
            vecx.nextFrameTime = now + EMU_TIMER + waitTime;
            setTimeout( function() { f(); }, waitTime );
        };
        setTimeout( f, 15 );
    }
    this.stop = function()
    {
        if( this.running )
        {
            if( this.fpsTimer != null )
            {
                clearInterval( this.fpsTimer );
                this.fpsTimer = null;
            }
            this.running = false;
            this.e8910.stop();
        }
    }
    this.start = function()
    {
        if( !this.running )
        {
            this.e8910.start();
            this.vecx_emuloop();
        }
    }
    this.main = function( canv )
    {
        this.osint.init( this, canv );
        this.e6809.init( this );
        this.status = "Loaded.";
        this.vecx_reset();
        this.start();
    }
    this.reset = function()
    {
        this.stop();
        this.vecx_reset();
        this.osint.osint_clearscreen();
        var vecx = this;
        setTimeout( function() { vecx.start(); }, 200 );
    }
    this.toggleSoundEnabled = function()
    {
        return this.e8910.toggleEnabled();
    }

    this.shadow_snd_regs14 = 0xff;

    this.button = function(controller, button, state) {
      var buttonVal = Math.pow(2, button);
      buttonVal = buttonVal * Math.pow(2, controller*4);
      state ? vecx.shadow_snd_regs14 &= ~buttonVal : vecx.shadow_snd_regs14 |= buttonVal;
    };

    this.axis = function(controller, axis, val) {
      vecx["alg_jch"+(controller*2+axis)] = val;
    };

}
