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

function e6809()
{
    this.vecx = null;
    this.FLAG_E = 0x80;
    this.FLAG_F = 0x40;
    this.FLAG_H = 0x20;
    this.FLAG_I = 0x10;
    this.FLAG_N = 0x08;
    this.FLAG_Z = 0x04;
    this.FLAG_V = 0x02;
    this.FLAG_C = 0x01;
    this.IRQ_NORMAL = 0;
    this.IRQ_SYNC = 1;
    this.IRQ_CWAI = 2;
    this.reg_x = new fptr(0);
    this.reg_y = new fptr(0);
    this.reg_u = new fptr(0);
    this.reg_s = new fptr(0);
    this.reg_pc = 0;
    this.reg_a = 0;
    this.reg_b = 0;
    this.reg_dp = 0;
    this.reg_cc = 0;
    this.irq_status = 0;
    this.rptr_xyus = [ this.reg_x, this.reg_y, this.reg_u, this.reg_s ];
    this.test_c = function( i0, i1, r, sub )
    {
        var flag = (i0 | i1) & ~r;
        flag |= (i0 & i1);
        flag = (flag >> 7) & 1;
        flag ^= sub;
        return flag;
    }
    this.test_z8 = function( r )
    {
        var flag = ~r;
        flag = (flag >> 4) & (flag & 0xf);
        flag = (flag >> 2) & (flag & 0x3);
        flag = (flag >> 1) & (flag & 0x1);
        return flag;
    }
    this.test_z16 = function( r )
    {
        var flag = ~r;
        flag = (flag >> 8) & (flag & 0xff);
        flag = (flag >> 4) & (flag & 0xf);
        flag = (flag >> 2) & (flag & 0x3);
        flag = (flag >> 1) & (flag & 0x1);
        return flag;
    }
    this.test_v = function( i0, i1, r )
    {
        var flag = ~(i0 ^ i1);
        flag &= (i0 ^ r);
        flag = (flag >> 7) & 1;
        return flag;
    }
    this.set_reg_d = function( value )
    {
        this.reg_a = (value >> 8);
        this.reg_b = value;
    }
    this.read16 = function( address )
    {
        var datahi = this.vecx.read8(address);
        var datalo = this.vecx.read8(address + 1);
        return (datahi << 8) | datalo;
    }
    this.write16 = function( address, data )
    {
        this.vecx.write8(address, data >> 8);
        this.vecx.write8(address + 1, data);
    }
    this.push8 = function( sp, data )
    {
        sp.value--;
        this.vecx.write8(sp.value, data);
    }
    this.push16 = function( sp, data )
    {
        sp.value--;
        this.vecx.write8(sp.value, data);
        sp.value--;
        this.vecx.write8(sp.value, data >> 8 );
    }
    this.pull16 = function( sp )
    {
        var datahi = this.vecx.read8(sp.value++);
        var datalo = this.vecx.read8(sp.value++);
        return (datahi << 8) | datalo;
    }
    this.pc_read16 = function()
    {
        var data = this.read16(this.reg_pc);
        this.reg_pc += 2;
        return data;
    }
    this.sign_extend = function( data )
    {
        return (~(data & 0x80) + 1) | (data & 0xff);
    }
    this.ea_indexed = function( cycles )
    {
        var ea = 0;
        var op = 0;
        var r = 0;
        op = this.vecx.read8(this.reg_pc++);
        r = (op >> 5) & 3;
        switch( op )
        {
            case 0x00: case 0x01: case 0x02: case 0x03:
            case 0x04: case 0x05: case 0x06: case 0x07:
            case 0x08: case 0x09: case 0x0a: case 0x0b:
            case 0x0c: case 0x0d: case 0x0e: case 0x0f:
            case 0x20: case 0x21: case 0x22: case 0x23:
            case 0x24: case 0x25: case 0x26: case 0x27:
            case 0x28: case 0x29: case 0x2a: case 0x2b:
            case 0x2c: case 0x2d: case 0x2e: case 0x2f:
            case 0x40: case 0x41: case 0x42: case 0x43:
            case 0x44: case 0x45: case 0x46: case 0x47:
            case 0x48: case 0x49: case 0x4a: case 0x4b:
            case 0x4c: case 0x4d: case 0x4e: case 0x4f:
            case 0x60: case 0x61: case 0x62: case 0x63:
            case 0x64: case 0x65: case 0x66: case 0x67:
            case 0x68: case 0x69: case 0x6a: case 0x6b:
            case 0x6c: case 0x6d: case 0x6e: case 0x6f:
                ea = this.rptr_xyus[r].value + (op & 0xf);
                cycles.value++;
                break;
            case 0x10: case 0x11: case 0x12: case 0x13:
            case 0x14: case 0x15: case 0x16: case 0x17:
            case 0x18: case 0x19: case 0x1a: case 0x1b:
            case 0x1c: case 0x1d: case 0x1e: case 0x1f:
            case 0x30: case 0x31: case 0x32: case 0x33:
            case 0x34: case 0x35: case 0x36: case 0x37:
            case 0x38: case 0x39: case 0x3a: case 0x3b:
            case 0x3c: case 0x3d: case 0x3e: case 0x3f:
            case 0x50: case 0x51: case 0x52: case 0x53:
            case 0x54: case 0x55: case 0x56: case 0x57:
            case 0x58: case 0x59: case 0x5a: case 0x5b:
            case 0x5c: case 0x5d: case 0x5e: case 0x5f:
            case 0x70: case 0x71: case 0x72: case 0x73:
            case 0x74: case 0x75: case 0x76: case 0x77:
            case 0x78: case 0x79: case 0x7a: case 0x7b:
            case 0x7c: case 0x7d: case 0x7e: case 0x7f:
                ea = this.rptr_xyus[r].value + (op & 0xf) - 0x10;
                cycles.value++;
                break;
            case 0x80: case 0x81:
            case 0xa0: case 0xa1:
            case 0xc0: case 0xc1:
            case 0xe0: case 0xe1:
                ea = this.rptr_xyus[r].value;
                this.rptr_xyus[r].value+=(1 + (op & 1));
                cycles.value+=(2 + (op & 1));
                break;
            case 0x90: case 0x91:
            case 0xb0: case 0xb1:
            case 0xd0: case 0xd1:
            case 0xf0: case 0xf1:
                ea = this.read16(this.rptr_xyus[r].value);
                this.rptr_xyus[r].value+=(1 + (op & 1));
                cycles.value+=(5 + (op & 1));
                break;
            case 0x82: case 0x83:
            case 0xa2: case 0xa3:
            case 0xc2: case 0xc3:
            case 0xe2: case 0xe3:
                this.rptr_xyus[r].value-=(1 + (op & 1));
                ea = this.rptr_xyus[r].value;
                cycles.value+=(2 + (op & 1));
                break;
            case 0x92: case 0x93:
            case 0xb2: case 0xb3:
            case 0xd2: case 0xd3:
            case 0xf2: case 0xf3:
                this.rptr_xyus[r].value-=(1 + (op & 1));
                ea = this.read16(this.rptr_xyus[r].value);
                cycles.value+=(5 + (op & 1));
                break;
            case 0x84: case 0xa4:
            case 0xc4: case 0xe4:
                ea = this.rptr_xyus[r].value;
                break;
            case 0x94: case 0xb4:
            case 0xd4: case 0xf4:
                ea = this.read16(this.rptr_xyus[r].value);
                cycles.value+=(3);
                break;
            case 0x85: case 0xa5:
            case 0xc5: case 0xe5:
                ea = this.rptr_xyus[r].value + this.sign_extend(this.reg_b);
                cycles.value+=(1);
                break;
            case 0x95: case 0xb5:
            case 0xd5: case 0xf5:
                ea = this.read16(this.rptr_xyus[r].value + this.sign_extend(this.reg_b));
                cycles.value+=(4);
                break;
            case 0x86: case 0xa6:
            case 0xc6: case 0xe6:
                ea = this.rptr_xyus[r].value + this.sign_extend(this.reg_a);
                cycles.value+=(1);
                break;
            case 0x96: case 0xb6:
            case 0xd6: case 0xf6:
                ea = this.read16(this.rptr_xyus[r].value + this.sign_extend(this.reg_a));
                cycles.value+=(4);
            break;
            case 0x88: case 0xa8:
            case 0xc8: case 0xe8:
                ea = this.rptr_xyus[r].value + this.sign_extend(this.vecx.read8(this.reg_pc++));
                cycles.value+=(1);
                break;
            case 0x98: case 0xb8:
            case 0xd8: case 0xf8:
                ea = this.read16(this.rptr_xyus[r].value + this.sign_extend(this.vecx.read8(this.reg_pc++)));
                cycles.value+=(4);
                break;
            case 0x89: case 0xa9:
            case 0xc9: case 0xe9:
                ea = this.rptr_xyus[r].value + this.pc_read16();
                cycles.value+=(4);
                break;
            case 0x99: case 0xb9:
            case 0xd9: case 0xf9:
                ea = this.read16(this.rptr_xyus[r].value + this.pc_read16());
                cycles.value+=(7);
                break;
            case 0x8b: case 0xab:
            case 0xcb: case 0xeb:
                ea = this.rptr_xyus[r].value +  ((this.reg_a<<8)|(this.reg_b&0xff)) ;
                cycles.value+=(4);
                break;
            case 0x9b: case 0xbb:
            case 0xdb: case 0xfb:
                ea = this.read16(this.rptr_xyus[r].value +  ((this.reg_a<<8)|(this.reg_b&0xff)) );
                cycles.value+=(7);
                break;
            case 0x8c: case 0xac:
            case 0xcc: case 0xec:
                r = this.sign_extend(this.vecx.read8(this.reg_pc++));
                ea = this.reg_pc + r;
                cycles.value+=(1);
                break;
            case 0x9c: case 0xbc:
            case 0xdc: case 0xfc:
                r = this.sign_extend(this.vecx.read8(this.reg_pc++));
                ea = this.read16(this.reg_pc + r);
                cycles.value+=(4);
                break;
            case 0x8d: case 0xad:
            case 0xcd: case 0xed:
                r = this.pc_read16();
                ea = this.reg_pc + r;
                cycles.value+=(5);
                break;
            case 0x9d: case 0xbd:
            case 0xdd: case 0xfd:
                r = this.pc_read16();
                ea = this.read16(this.reg_pc + r);
                cycles.value+=(8);
                break;
            case 0x9f:
                ea = this.read16(this.pc_read16());
                cycles.value+=(5);
                break;
            default:
                alert("undefined post-byte");
                break;
        }
        return ea;
    }
    this.inst_neg = function( data )
    {
        var i0 = 0;
        var i1 = (~data) & 0xffff;
        var r = i0 + i1 + 1;
        this.reg_cc=((this.reg_cc&~this.FLAG_H)|(this.test_c(i0 << 4, i1 << 4, r << 4, 0)*this.FLAG_H)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|( ((((~(i0^i1))&(i0^r))>>7)&1) *this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0, i1, r, 1)*this.FLAG_C)) ;
        return r;
    }
    this.inst_com = function( data )
    {
        var r = (~data) & 0xffff;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.FLAG_C)) ;
        return r;
    }
    this.inst_lsr = function( data )
    {
        var r = (data >> 1) & 0x7f;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(data & this.FLAG_C)) ;
        return r;
    }
    this.inst_ror = function( data )
    {
        var c =  ((this.reg_cc/this.FLAG_C>>0)&1) ;
        var r = ((data >> 1) & 0x7f) | (c << 7);
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(data & this.FLAG_C)) ;
        return r;
    }
    this.inst_asr = function( data )
    {
        var r = ((data >> 1) & 0x7f) | (data & 0x80);
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(data & this.FLAG_C)) ;
        return r;
    }
    this.inst_asl = function( data )
    {
        var i0 = data;
        var i1 = data;
        var r = i0 + i1;
        this.reg_cc=((this.reg_cc&~this.FLAG_H)|(this.test_c(i0 << 4, i1 << 4, r << 4, 0)*this.FLAG_H)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|( ((((~(i0^i1))&(i0^r))>>7)&1) *this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0, i1, r, 0)*this.FLAG_C)) ;
        return r;
    }
    this.inst_rol = function( data )
    {
        var i0 = data;
        var i1 = data;
        var c =  ((this.reg_cc/this.FLAG_C>>0)&1) ;
        var r = i0 + i1 + c;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|( ((((~(i0^i1))&(i0^r))>>7)&1) *this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0, i1, r, 0)*this.FLAG_C)) ;
        return r;
    }
    this.inst_dec = function( data )
    {
        var i0 = data;
        var i1 = 0xff;
        var r = i0 + i1;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|( ((((~(i0^i1))&(i0^r))>>7)&1) *this.FLAG_V)) ;
        return r;
    }
    this.inst_inc = function( data )
    {
        var i0 = data;
        var i1 = 1;
        var r = i0 + i1;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|( ((((~(i0^i1))&(i0^r))>>7)&1) *this.FLAG_V)) ;
        return r;
    }
    this.inst_tst8 = function( data )
    {
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((data>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(data)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)) ;
    }
    this.inst_tst16 = function( data )
    {
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((data >> 8>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z16(data)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)) ;
    }
    this.inst_clr = function()
    {
        this.reg_cc=((this.reg_cc&~this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)) ;
    }
    this.inst_sub8 = function( data0, data1 )
    {
        var i0 = data0;
        var i1 = (~data1) & 0xffff;
        var r = i0 + i1 + 1;
        this.reg_cc=((this.reg_cc&~this.FLAG_H)|(this.test_c(i0 << 4, i1 << 4, r << 4, 0)*this.FLAG_H)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|( ((((~(i0^i1))&(i0^r))>>7)&1) *this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0, i1, r, 1)*this.FLAG_C)) ;
        return r;
    }
    this.inst_sbc = function( data0, data1 )
    {
        var i0 = data0;
        var i1 = (~data1) & 0xffff;
        var c = 1 -  ((this.reg_cc/this.FLAG_C>>0)&1) ;
        var r = i0 + i1 + c;
        this.reg_cc=((this.reg_cc&~this.FLAG_H)|(this.test_c(i0 << 4, i1 << 4, r << 4, 0)*this.FLAG_H)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|( ((((~(i0^i1))&(i0^r))>>7)&1) *this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0, i1, r, 1)*this.FLAG_C)) ;
        return r;
    }
    this.inst_and = function( data0, data1 )
    {
        var r = data0 & data1;
        this.inst_tst8(r);
        return r;
    }
    this.inst_eor = function ( data0, data1 )
    {
        var r = data0 ^ data1;
        this.inst_tst8(r);
        return r;
    }
    this.inst_adc = function ( data0, data1 )
    {
        var i0 = data0;
        var i1 = data1;
        var c =  ((this.reg_cc/this.FLAG_C>>0)&1) ;
        var r = i0 + i1 + c;
        this.reg_cc=((this.reg_cc&~this.FLAG_H)|(this.test_c(i0 << 4, i1 << 4, r << 4, 0)*this.FLAG_H)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|( ((((~(i0^i1))&(i0^r))>>7)&1) *this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0, i1, r, 0)*this.FLAG_C)) ;
        return r;
    }
    this.inst_or = function( data0, data1 )
    {
        var r = data0 | data1;
        this.inst_tst8(r);
        return r;
    }
    this.inst_add8 = function( data0, data1 )
    {
        var i0 = data0;
        var i1 = data1;
        var r = i0 + i1;
        this.reg_cc=((this.reg_cc&~this.FLAG_H)|(this.test_c(i0 << 4, i1 << 4, r << 4, 0)*this.FLAG_H)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|( ((((~(i0^i1))&(i0^r))>>7)&1) *this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0, i1, r, 0)*this.FLAG_C)) ;
        return r;
    }
    this.inst_add16 = function( data0, data1 )
    {
        var i0 = data0;
        var i1 = data1;
        var r = i0 + i1;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r >> 8>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z16(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|(this.test_v(i0 >> 8, i1 >> 8, r >> 8)*this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0 >> 8, i1 >> 8, r >> 8, 0)*this.FLAG_C)) ;
        return r;
    }
    this.inst_sub16 = function( data0, data1 )
    {
        var i0 = data0;
        var i1 = (~data1) & 0xffff;
        var r = i0 + i1 + 1;
        this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((r >> 8>>7)&1) *this.FLAG_N)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z16(r)*this.FLAG_Z)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_V)|(this.test_v(i0 >> 8, i1 >> 8, r >> 8)*this.FLAG_V)) ;
        this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0 >> 8, i1 >> 8, r >> 8, 1)*this.FLAG_C)) ;
        return r;
    }
    this.inst_bra8 = function ( test, op, cycles )
    {
        var offset = this.vecx.read8(this.reg_pc++);
        var mask = (test ^ (op & 1)) - 1;
        this.reg_pc += this.sign_extend(offset) & mask;
        cycles.value+=(3);
    }
    this.inst_bra16 = function( test, op, cycles )
    {
        var offset = this.pc_read16();
        var mask = (test ^ (op & 1)) - 1;
        this.reg_pc += offset & mask;
        cycles.value+=(5 - mask);
    }
    this.inst_psh = function ( op, sp, data, cycles )
    {
        if( op & 0x80 )
        {
            this.push16(sp, this.reg_pc);
            cycles.value+=(2);
        }
        if( op & 0x40 )
        {
            this.push16(sp, data);
            cycles.value+=(2);
        }
        if( op & 0x20 )
        {
            this.push16(sp, this.reg_y.value);
            cycles.value+=(2);
        }
        if( op & 0x10 )
        {
            this.push16(sp, this.reg_x.value);
            cycles.value+=(2);
        }
        if( op & 0x08 )
        {
            this.push8(sp, this.reg_dp);
            cycles.value+=(1);
        }
        if( op & 0x04 )
        {
            this.push8(sp, this.reg_b);
            cycles.value+=(1);
        }
        if( op & 0x02 )
        {
            this.push8(sp, this.reg_a);
            cycles.value+=(1);
        }
        if( op & 0x01 )
        {
            this.push8(sp, this.reg_cc);
            cycles.value+=(1);
        }
    }
    this.inst_pul = function( op, sp, osp, cycles )
    {
        if( op & 0x01 )
        {
            this.reg_cc =  (this.vecx.read8(sp.value++)) ;
            cycles.value+=(1);
        }
        if( op & 0x02 )
        {
            this.reg_a =  (this.vecx.read8(sp.value++)) ;
            cycles.value+=(1);
        }
        if( op & 0x04 )
        {
            this.reg_b =  (this.vecx.read8(sp.value++)) ;
            cycles.value+=(1);
        }
        if( op & 0x08 )
        {
            this.reg_dp =  (this.vecx.read8(sp.value++)) ;
            cycles.value+=(1);
        }
        if( op & 0x10 )
        {
            this.reg_x.value=(this.pull16(sp));
            cycles.value+=(2);
        }
        if( op & 0x20 )
        {
            this.reg_y.value=(this.pull16(sp));
            cycles.value+=(2);
        }
        if( op & 0x40 )
        {
            osp.value=(this.pull16(sp));
            cycles.value+=(2);
        }
        if( op & 0x80 )
        {
            this.reg_pc = this.pull16(sp);
            cycles.value+=(2);
        }
    }
    this.exgtfr_read = function( reg )
    {
        var data = 0;
        switch( reg )
        {
            case 0x0:
                data =  ((this.reg_a<<8)|(this.reg_b&0xff)) ;
                break;
            case 0x1:
                data = this.reg_x.value;
                break;
            case 0x2:
                data = this.reg_y.value;
                break;
            case 0x3:
                data = this.reg_u.value;
                break;
            case 0x4:
                data = this.reg_s.value;
                break;
            case 0x5:
                data = this.reg_pc;
                break;
            case 0x8:
                data = 0xff00 | this.reg_a;
                break;
            case 0x9:
                data = 0xff00 | this.reg_b;
                break;
            case 0xa:
                data = 0xff00 | this.reg_cc;
                break;
            case 0xb:
                data = 0xff00 | this.reg_dp;
                break;
            default:
                data = 0xffff;
                utils.showError("illegal exgtfr reg" + reg);
                break;
        }
        return data;
    }
    this.exgtfr_write = function( reg, data )
    {
        switch( reg )
        {
            case 0x0:
                this.set_reg_d(data);
                break;
            case 0x1:
                this.reg_x.value=(data);
                break;
            case 0x2:
                this.reg_y.value=(data);
                break;
            case 0x3:
                this.reg_u.value=(data);
                break;
            case 0x4:
                this.reg_s.value=(data);
                break;
            case 0x5:
                this.reg_pc = data;
                break;
            case 0x8:
                this.reg_a = data;
                break;
            case 0x9:
                this.reg_b = data;
                break;
            case 0xa:
                this.reg_cc = data;
                break;
            case 0xb:
                this.reg_dp = data;
                break;
            default:
                utils.showError("illegal exgtfr reg " + reg)
                break;
        }
    }
    this.inst_exg = function()
    {
        var op = this.vecx.read8(this.reg_pc++);
        var tmp = this.exgtfr_read(op & 0xf);
        this.exgtfr_write(op & 0xf, this.exgtfr_read(op >> 4));
        this.exgtfr_write(op >> 4, tmp);
    }
    this.inst_tfr = function()
    {
        var op = this.vecx.read8(this.reg_pc++);
        this.exgtfr_write(op & 0xf, this.exgtfr_read(op >> 4));
    }
    this.e6809_reset = function()
    {
        this.reg_x.value=(0);
        this.reg_y.value=(0);
        this.reg_u.value=(0);
        this.reg_s.value=(0);
        this.reg_a = 0;
        this.reg_b = 0;
        this.reg_dp = 0;
        this.reg_cc = this.FLAG_I | this.FLAG_F;
        this.irq_status = this.IRQ_NORMAL;
        this.reg_pc = this.read16(0xfffe);
    }
    this.cycles = new fptr(0);
    this.e6809_sstep = function( irq_i, irq_f )
    {
        var op = 0;
        var cycles = this.cycles;
        cycles.value=(0);
        var ea = 0;
        var i0 = 0;
        var i1 = 0;
        var r = 0;
        if( irq_f )
        {
            if(  ((this.reg_cc/this.FLAG_F>>0)&1)  == 0 )
            {
                if( this.irq_status != this.IRQ_CWAI )
                {
                    this.reg_cc=((this.reg_cc&~this.FLAG_E)) ;
                    this.inst_psh(0x81, this.reg_s, this.reg_u.value, cycles);
                }
                this.reg_cc=((this.reg_cc&~this.FLAG_I)|(this.FLAG_I)) ;
                this.reg_cc=((this.reg_cc&~this.FLAG_F)|(this.FLAG_F)) ;
                this.reg_pc = this.read16(0xfff6);
                this.irq_status = this.IRQ_NORMAL;
                cycles.value+=(7);
            }
            else
            {
                if( this.irq_status == this.IRQ_SYNC )
                {
                    this.irq_status = this.IRQ_NORMAL;
                }
            }
        }
        if( irq_i )
        {
            if( ((this.reg_cc / this.FLAG_I >> 0) & 1) != 0 )
            {
                if( this.irq_status == this.IRQ_SYNC )
                {
                    this.irq_status = this.IRQ_NORMAL;
                }
            }
            else
            {
                if( this.irq_status != this.IRQ_CWAI )
                {
                    this.reg_cc = ((this.reg_cc & ~this.FLAG_E) | (this.FLAG_E));
                    this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                }
                this.reg_cc = ((this.reg_cc & ~this.FLAG_I) | (this.FLAG_I));
                this.reg_pc = this.read16(0xfff8);
                this.irq_status = this.IRQ_NORMAL;
                cycles.value += (7);
            }
        }
        if( this.irq_status != this.IRQ_NORMAL )
        {
            return cycles.value + 1;
        }
        op = this.vecx.read8(this.reg_pc++);
        switch( op )
        {
            case 0x00:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                r = this.inst_neg(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x40:
                this.reg_a = this.inst_neg(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x50:
                this.reg_b = this.inst_neg(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x60:
                ea = this.ea_indexed(cycles);
                r = this.inst_neg(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x70:
                ea = this.pc_read16();
                r = this.inst_neg(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(7);
                break;
            case 0x03:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                r = this.inst_com(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x43:
                this.reg_a = this.inst_com(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x53:
                this.reg_b = this.inst_com(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x63:
                ea = this.ea_indexed(cycles);
                r = this.inst_com(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x73:
                ea = this.pc_read16();
                r = this.inst_com(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(7);
                break;
            case 0x04:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                r = this.inst_lsr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x44:
                this.reg_a = this.inst_lsr(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x54:
                this.reg_b = this.inst_lsr(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x64:
                ea = this.ea_indexed(cycles);
                r = this.inst_lsr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x74:
                ea = this.pc_read16();
                r = this.inst_lsr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(7);
                break;
            case 0x06:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                r = this.inst_ror(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x46:
                this.reg_a = this.inst_ror(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x56:
                this.reg_b = this.inst_ror(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x66:
                ea = this.ea_indexed(cycles);
                r = this.inst_ror(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x76:
                ea = this.pc_read16();
                r = this.inst_ror(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(7);
                break;
            case 0x07:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                r = this.inst_asr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x47:
                this.reg_a = this.inst_asr(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x57:
                this.reg_b = this.inst_asr(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x67:
                ea = this.ea_indexed(cycles);
                r = this.inst_asr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x77:
                ea = this.pc_read16();
                r = this.inst_asr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(7);
                break;
            case 0x08:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                r = this.inst_asl(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x48:
                this.reg_a = this.inst_asl(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x58:
                this.reg_b = this.inst_asl(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x68:
                ea = this.ea_indexed(cycles);
                r = this.inst_asl(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x78:
                ea = this.pc_read16();
                r = this.inst_asl(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(7);
                break;
            case 0x09:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                r = this.inst_rol(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x49:
                this.reg_a = this.inst_rol(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x59:
                this.reg_b = this.inst_rol(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x69:
                ea = this.ea_indexed(cycles);
                r = this.inst_rol(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x79:
                ea = this.pc_read16();
                r = this.inst_rol(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(7);
                break;
            case 0x0a:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                r = this.inst_dec(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x4a:
                this.reg_a = this.inst_dec(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x5a:
                this.reg_b = this.inst_dec(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x6a:
                ea = this.ea_indexed(cycles);
                r = this.inst_dec(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x7a:
                ea = this.pc_read16();
                r = this.inst_dec(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(7);
                break;
            case 0x0c:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                r = this.inst_inc(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x4c:
                this.reg_a = this.inst_inc(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x5c:
                this.reg_b = this.inst_inc(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x6c:
                ea = this.ea_indexed(cycles);
                r = this.inst_inc(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(6);
                break;
            case 0x7c:
                ea = this.pc_read16();
                r = this.inst_inc(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                cycles.value+=(7);
                break;
            case 0x0d:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.inst_tst8(this.vecx.read8(ea));
                cycles.value+=(6);
                break;
            case 0x4d:
                this.inst_tst8(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x5d:
                this.inst_tst8(this.reg_b);
                cycles.value+=(2);
                break;
            case 0x6d:
                ea = this.ea_indexed(cycles);
                this.inst_tst8(this.vecx.read8(ea));
                cycles.value+=(6);
                break;
            case 0x7d:
                ea = this.pc_read16();
                this.inst_tst8(this.vecx.read8(ea));
                cycles.value+=(7);
                break;
            case 0x0e:
                this.reg_pc =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                cycles.value+=(3);
                break;
            case 0x6e:
                this.reg_pc = this.ea_indexed(cycles);
                cycles.value+=(3);
                break;
            case 0x7e:
                this.reg_pc = this.pc_read16();
                cycles.value+=(4);
                break;
            case 0x0f:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.inst_clr();
                this.vecx.write8(ea, 0);
                cycles.value+=(6);
                break;
            case 0x4f:
                this.inst_clr();
                this.reg_a = 0;
                cycles.value+=(2);
                break;
            case 0x5f:
                this.inst_clr();
                this.reg_b = 0;
                cycles.value+=(2);
                break;
            case 0x6f:
                ea = this.ea_indexed(cycles);
                this.inst_clr();
                this.vecx.write8(ea, 0);
                cycles.value+=(6);
                break;
            case 0x7f:
                ea = this.pc_read16();
                this.inst_clr();
                this.vecx.write8(ea, 0);
                cycles.value+=(7);
                break;
            case 0x80:
                this.reg_a = this.inst_sub8(this.reg_a, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0x90:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_a = this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xa0:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xb0:
                ea = this.pc_read16();
                this.reg_a = this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0xc0:
                this.reg_b = this.inst_sub8(this.reg_b, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0xd0:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_b = this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xe0:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xf0:
                ea = this.pc_read16();
                this.reg_b = this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0x81:
                this.inst_sub8(this.reg_a, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0x91:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xa1:
                ea = this.ea_indexed(cycles);
                this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xb1:
                ea = this.pc_read16();
                this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0xc1:
                this.inst_sub8(this.reg_b, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0xd1:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xe1:
                ea = this.ea_indexed(cycles);
                this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xf1:
                ea = this.pc_read16();
                this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0x82:
                this.reg_a = this.inst_sbc(this.reg_a, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0x92:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_a = this.inst_sbc(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xa2:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_sbc(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xb2:
                ea = this.pc_read16();
                this.reg_a = this.inst_sbc(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0xc2:
                this.reg_b = this.inst_sbc(this.reg_b, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0xd2:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_b = this.inst_sbc(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xe2:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_sbc(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xf2:
                ea = this.pc_read16();
                this.reg_b = this.inst_sbc(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0x84:
                this.reg_a = this.inst_and(this.reg_a, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0x94:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_a = this.inst_and(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xa4:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_and(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xb4:
                ea = this.pc_read16();
                this.reg_a = this.inst_and(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0xc4:
                this.reg_b = this.inst_and(this.reg_b, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0xd4:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_b = this.inst_and(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xe4:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_and(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xf4:
                ea = this.pc_read16();
                this.reg_b = this.inst_and(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0x85:
                this.inst_and(this.reg_a, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0x95:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.inst_and(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xa5:
                ea = this.ea_indexed(cycles);
                this.inst_and(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xb5:
                ea = this.pc_read16();
                this.inst_and(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0xc5:
                this.inst_and(this.reg_b, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0xd5:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.inst_and(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xe5:
                ea = this.ea_indexed(cycles);
                this.inst_and(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xf5:
                ea = this.pc_read16();
                this.inst_and(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0x86:
                this.reg_a = this.vecx.read8(this.reg_pc++);
                this.inst_tst8(this.reg_a);
                cycles.value+=(2);
                break;
            case 0x96:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_a = this.vecx.read8(ea);
                this.inst_tst8(this.reg_a);
                cycles.value+=(4);
                break;
            case 0xa6:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.vecx.read8(ea);
                this.inst_tst8(this.reg_a);
                cycles.value+=(4);
                break;
            case 0xb6:
                ea = this.pc_read16();
                this.reg_a = this.vecx.read8(ea);
                this.inst_tst8(this.reg_a);
                cycles.value+=(5);
                break;
            case 0xc6:
                this.reg_b = this.vecx.read8(this.reg_pc++);
                this.inst_tst8(this.reg_b);
                cycles.value+=(2);
                break;
            case 0xd6:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_b = this.vecx.read8(ea);
                this.inst_tst8(this.reg_b);
                cycles.value+=(4);
                break;
            case 0xe6:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.vecx.read8(ea);
                this.inst_tst8(this.reg_b);
                cycles.value+=(4);
                break;
            case 0xf6:
                ea = this.pc_read16();
                this.reg_b = this.vecx.read8(ea);
                this.inst_tst8(this.reg_b);
                cycles.value+=(5);
                break;
            case 0x97:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.vecx.write8(ea, this.reg_a);
                this.inst_tst8(this.reg_a);
                cycles.value+=(4);
                break;
            case 0xa7:
                ea = this.ea_indexed(cycles);
                this.vecx.write8(ea, this.reg_a);
                this.inst_tst8(this.reg_a);
                cycles.value+=(4);
                break;
            case 0xb7:
                ea = this.pc_read16();
                this.vecx.write8(ea, this.reg_a);
                this.inst_tst8(this.reg_a);
                cycles.value+=(5);
                break;
            case 0xd7:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.vecx.write8(ea, this.reg_b);
                this.inst_tst8(this.reg_b);
                cycles.value+=(4);
                break;
            case 0xe7:
                ea = this.ea_indexed(cycles);
                this.vecx.write8(ea, this.reg_b);
                this.inst_tst8(this.reg_b);
                cycles.value+=(4);
                break;
            case 0xf7:
                ea = this.pc_read16();
                this.vecx.write8(ea, this.reg_b);
                this.inst_tst8(this.reg_b);
                cycles.value+=(5);
                break;
            case 0x88:
                this.reg_a = this.inst_eor(this.reg_a, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0x98:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_a = this.inst_eor(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xa8:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_eor(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xb8:
                ea = this.pc_read16();
                this.reg_a = this.inst_eor(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0xc8:
                this.reg_b = this.inst_eor(this.reg_b, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0xd8:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_b = this.inst_eor(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xe8:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_eor(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xf8:
                ea = this.pc_read16();
                this.reg_b = this.inst_eor(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0x89:
                this.reg_a = this.inst_adc(this.reg_a, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0x99:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_a = this.inst_adc(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xa9:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_adc(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xb9:
                ea = this.pc_read16();
                this.reg_a = this.inst_adc(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0xc9:
                this.reg_b = this.inst_adc(this.reg_b, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0xd9:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_b = this.inst_adc(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xe9:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_adc(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xf9:
                ea = this.pc_read16();
                this.reg_b = this.inst_adc(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0x8a:
                this.reg_a = this.inst_or(this.reg_a, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0x9a:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_a = this.inst_or(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xaa:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_or(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xba:
                ea = this.pc_read16();
                this.reg_a = this.inst_or(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0xca:
                this.reg_b = this.inst_or(this.reg_b, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0xda:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_b = this.inst_or(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xea:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_or(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xfa:
                ea = this.pc_read16();
                this.reg_b = this.inst_or(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0x8b:
                this.reg_a = this.inst_add8(this.reg_a, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0x9b:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_a = this.inst_add8(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xab:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_add8(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xbb:
                ea = this.pc_read16();
                this.reg_a = this.inst_add8(this.reg_a, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0xcb:
                this.reg_b = this.inst_add8(this.reg_b, this.vecx.read8(this.reg_pc++));
                cycles.value+=(2);
                break;
            case 0xdb:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_b = this.inst_add8(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xeb:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_add8(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(4);
                break;
            case 0xfb:
                ea = this.pc_read16();
                this.reg_b = this.inst_add8(this.reg_b, this.vecx.read8(ea));
                cycles.value+=(5);
                break;
            case 0x83:
                this.set_reg_d(this.inst_sub16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.pc_read16()));
                cycles.value+=(4);
                break;
            case 0x93:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.set_reg_d(this.inst_sub16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.read16(ea)));
                cycles.value+=(6);
                break;
            case 0xa3:
                ea = this.ea_indexed(cycles);
                this.set_reg_d(this.inst_sub16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.read16(ea)));
                cycles.value+=(6);
                break;
            case 0xb3:
                ea = this.pc_read16();
                this.set_reg_d(this.inst_sub16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.read16(ea)));
                cycles.value+=(7);
                break;
            case 0x8c:
                this.inst_sub16(this.reg_x.value, this.pc_read16());
                cycles.value+=(4);
                break;
            case 0x9c:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.inst_sub16(this.reg_x.value, this.read16(ea));
                cycles.value+=(6);
                break;
            case 0xac:
                ea = this.ea_indexed(cycles);
                this.inst_sub16(this.reg_x.value, this.read16(ea));
                cycles.value+=(6);
                break;
            case 0xbc:
                ea = this.pc_read16();
                this.inst_sub16(this.reg_x.value, this.read16(ea));
                cycles.value+=(7);
                break;
            case 0x8e:
                this.reg_x.value=(this.pc_read16());
                this.inst_tst16(this.reg_x.value);
                cycles.value+=(3);
                break;
            case 0x9e:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_x.value=(this.read16(ea));
                this.inst_tst16(this.reg_x.value);
                cycles.value+=(5);
                break;
            case 0xae:
                ea = this.ea_indexed(cycles);
                this.reg_x.value=(this.read16(ea));
                this.inst_tst16(this.reg_x.value);
                cycles.value+=(5);
                break;
            case 0xbe:
                ea = this.pc_read16();
                this.reg_x.value=(this.read16(ea));
                this.inst_tst16(this.reg_x.value);
                cycles.value+=(6);
                break;
            case 0xce:
                this.reg_u.value=(this.pc_read16());
                this.inst_tst16(this.reg_u.value);
                cycles.value+=(3);
                break;
            case 0xde:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.reg_u.value=(this.read16(ea));
                this.inst_tst16(this.reg_u.value);
                cycles.value+=(5);
                break;
            case 0xee:
                ea = this.ea_indexed(cycles);
                this.reg_u.value=(this.read16(ea));
                this.inst_tst16(this.reg_u.value);
                cycles.value+=(5);
                break;
            case 0xfe:
                ea = this.pc_read16();
                this.reg_u.value=(this.read16(ea));
                this.inst_tst16(this.reg_u.value);
                cycles.value+=(6);
                break;
            case 0x9f:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.write16(ea, this.reg_x.value);
                this.inst_tst16(this.reg_x.value);
                cycles.value+=(5);
                break;
            case 0xaf:
                ea = this.ea_indexed(cycles);
                this.write16(ea, this.reg_x.value);
                this.inst_tst16(this.reg_x.value);
                cycles.value+=(5);
                break;
            case 0xbf:
                ea = this.pc_read16();
                this.write16(ea, this.reg_x.value);
                this.inst_tst16(this.reg_x.value);
                cycles.value+=(6);
                break;
            case 0xdf:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.write16(ea, this.reg_u.value);
                this.inst_tst16(this.reg_u.value);
                cycles.value+=(5);
                break;
            case 0xef:
                ea = this.ea_indexed(cycles);
                this.write16(ea, this.reg_u.value);
                this.inst_tst16(this.reg_u.value);
                cycles.value+=(5);
                break;
            case 0xff:
                ea = this.pc_read16();
                this.write16(ea, this.reg_u.value);
                this.inst_tst16(this.reg_u.value);
                cycles.value+=(6);
                break;
            case 0xc3:
                this.set_reg_d(this.inst_add16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.pc_read16()));
                cycles.value+=(4);
                break;
            case 0xd3:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.set_reg_d(this.inst_add16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.read16(ea)));
                cycles.value+=(6);
                break;
            case 0xe3:
                ea = this.ea_indexed(cycles);
                this.set_reg_d(this.inst_add16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.read16(ea)));
                cycles.value+=(6);
                break;
            case 0xf3:
                ea = this.pc_read16();
                this.set_reg_d(this.inst_add16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.read16(ea)));
                cycles.value+=(7);
                break;
            case 0xcc:
                this.set_reg_d(this.pc_read16());
                this.inst_tst16( ((this.reg_a<<8)|(this.reg_b&0xff)) );
                cycles.value+=(3);
                break;
            case 0xdc:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.set_reg_d(this.read16(ea));
                this.inst_tst16( ((this.reg_a<<8)|(this.reg_b&0xff)) );
                cycles.value+=(5);
                break;
            case 0xec:
                ea = this.ea_indexed(cycles);
                this.set_reg_d(this.read16(ea));
                this.inst_tst16( ((this.reg_a<<8)|(this.reg_b&0xff)) );
                cycles.value+=(5);
                break;
            case 0xfc:
                ea = this.pc_read16();
                this.set_reg_d(this.read16(ea));
                this.inst_tst16( ((this.reg_a<<8)|(this.reg_b&0xff)) );
                cycles.value+=(6);
                break;
            case 0xdd:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.write16(ea,  ((this.reg_a<<8)|(this.reg_b&0xff)) );
                this.inst_tst16( ((this.reg_a<<8)|(this.reg_b&0xff)) );
                cycles.value+=(5);
                break;
            case 0xed:
                ea = this.ea_indexed(cycles);
                this.write16(ea,  ((this.reg_a<<8)|(this.reg_b&0xff)) );
                this.inst_tst16( ((this.reg_a<<8)|(this.reg_b&0xff)) );
                cycles.value+=(5);
                break;
            case 0xfd:
                ea = this.pc_read16();
                this.write16(ea,  ((this.reg_a<<8)|(this.reg_b&0xff)) );
                this.inst_tst16( ((this.reg_a<<8)|(this.reg_b&0xff)) );
                cycles.value+=(6);
                break;
            case 0x12:
                cycles.value+=(2);
                break;
            case 0x3d:
                r = (this.reg_a & 0xff) * (this.reg_b & 0xff);
                this.set_reg_d(r);
                this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z16(r)*this.FLAG_Z)) ;
                this.reg_cc=((this.reg_cc&~this.FLAG_C)|((r >> 7) & this.FLAG_C)) ;
                cycles.value+=(11);
                break;
            case 0x20:
            case 0x21:
                this.inst_bra8(0, op, cycles);
                break;
            case 0x22:
            case 0x23:
                this.inst_bra8( ((this.reg_cc/this.FLAG_C>>0)&1)  |  ((this.reg_cc/this.FLAG_Z>>0)&1) , op, cycles);
                break;
            case 0x24:
            case 0x25:
                this.inst_bra8( ((this.reg_cc/this.FLAG_C>>0)&1) , op, cycles);
                break;
            case 0x26:
            case 0x27:
                this.inst_bra8( ((this.reg_cc/this.FLAG_Z>>0)&1) , op, cycles);
                break;
            case 0x28:
            case 0x29:
                this.inst_bra8( ((this.reg_cc/this.FLAG_V>>0)&1) , op, cycles);
                break;
            case 0x2a:
            case 0x2b:
                this.inst_bra8( ((this.reg_cc/this.FLAG_N>>0)&1) , op, cycles);
                break;
            case 0x2c:
            case 0x2d:
                this.inst_bra8( ((this.reg_cc/this.FLAG_N>>0)&1)  ^  ((this.reg_cc/this.FLAG_V>>0)&1) , op, cycles);
                break;
            case 0x2e:
            case 0x2f:
                this.inst_bra8( ((this.reg_cc/this.FLAG_Z>>0)&1)  |
                               ( ((this.reg_cc/this.FLAG_N>>0)&1)  ^  ((this.reg_cc/this.FLAG_V>>0)&1) ), op, cycles);
                break;
            case 0x16:
                r = this.pc_read16();
                this.reg_pc += r;
                cycles.value+=(5);
                break;
            case 0x17:
                r = this.pc_read16();
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc += r;
                cycles.value+=(9);
                break;
            case 0x8d:
                r = this.vecx.read8(this.reg_pc++);
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc += this.sign_extend(r);
                cycles.value+=(7);
                break;
            case 0x9d:
                ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc = ea;
                cycles.value+=(7);
                break;
            case 0xad:
                ea = this.ea_indexed(cycles);
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc = ea;
                cycles.value+=(7);
                break;
            case 0xbd:
                ea = this.pc_read16();
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc = ea;
                cycles.value+=(8);
                break;
            case 0x30:
                this.reg_x.value=(this.ea_indexed(cycles));
                this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z16(this.reg_x.value)*this.FLAG_Z)) ;
                cycles.value+=(4);
                break;
            case 0x31:
                this.reg_y.value=(this.ea_indexed(cycles));
                this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z16(this.reg_y.value)*this.FLAG_Z)) ;
                cycles.value+=(4);
                break;
            case 0x32:
                this.reg_s.value=(this.ea_indexed(cycles));
                cycles.value+=(4);
                break;
            case 0x33:
                this.reg_u.value=(this.ea_indexed(cycles));
                cycles.value+=(4);
                break;
            case 0x34:
                this.inst_psh(this.vecx.read8(this.reg_pc++), this.reg_s, this.reg_u.value, cycles);
                cycles.value+=(5);
                break;
            case 0x35:
                this.inst_pul(this.vecx.read8(this.reg_pc++), this.reg_s, this.reg_u, cycles);
                cycles.value+=(5);
                break;
            case 0x36:
                this.inst_psh(this.vecx.read8(this.reg_pc++), this.reg_u, this.reg_s.value, cycles);
                cycles.value+=(5);
                break;
            case 0x37:
                this.inst_pul(this.vecx.read8(this.reg_pc++), this.reg_u, this.reg_s, cycles);
                cycles.value+=(5);
                break;
            case 0x39:
                this.reg_pc = this.pull16(this.reg_s);
                cycles.value+=(5);
                break;
            case 0x3a:
                this.reg_x.value+=(this.reg_b & 0xff);
                cycles.value+=(3);
                break;
            case 0x1a:
                this.reg_cc |= this.vecx.read8(this.reg_pc++);
                cycles.value+=(3);
                break;
            case 0x1c:
                this.reg_cc &= this.vecx.read8(this.reg_pc++);
                cycles.value+=(3);
                break;
            case 0x1d:
                this.set_reg_d(this.sign_extend(this.reg_b));
                this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((this.reg_a>>7)&1) *this.FLAG_N)) ;
                this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z16( ((this.reg_a<<8)|(this.reg_b&0xff)) )*this.FLAG_Z)) ;
                cycles.value+=(2);
                break;
            case 0x1e:
                this.inst_exg();
                cycles.value+=(8);
                break;
            case 0x1f:
                this.inst_tfr();
                cycles.value+=(6);
                break;
            case 0x3b:
                if(  ((this.reg_cc/this.FLAG_E>>0)&1)  )
                {
                    this.inst_pul(0xff, this.reg_s, this.reg_u, cycles);
                }
                else
                {
                    this.inst_pul(0x81, this.reg_s, this.reg_u, cycles);
                }
                cycles.value+=(3);
                break;
            case 0x3f:
                this.reg_cc=((this.reg_cc&~this.FLAG_E)|(this.FLAG_E)) ;
                this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                this.reg_cc=((this.reg_cc&~this.FLAG_I)|(this.FLAG_I)) ;
                this.reg_cc=((this.reg_cc&~this.FLAG_F)|(this.FLAG_F)) ;
                this.reg_pc = this.read16(0xfffa);
                cycles.value+=(7);
                break;
            case 0x13:
                this.irq_status = this.IRQ_SYNC;
                cycles.value+=(2);
                break;
            case 0x19:
                i0 = this.reg_a;
                i1 = 0;
                if( (this.reg_a & 0x0f) > 0x09 ||  ((this.reg_cc/this.FLAG_H>>0)&1)  == 1 )
                {
                    i1 |= 0x06;
                }
                if( (this.reg_a & 0xf0) > 0x80 && (this.reg_a & 0x0f) > 0x09 )
                {
                    i1 |= 0x60;
                }
                if( (this.reg_a & 0xf0) > 0x90 ||  ((this.reg_cc/this.FLAG_C>>0)&1)  == 1 )
                {
                    i1 |= 0x60;
                }
                this.reg_a = i0 + i1;
                this.reg_cc=((this.reg_cc&~this.FLAG_N)|( ((this.reg_a>>7)&1) *this.FLAG_N)) ;
                this.reg_cc=((this.reg_cc&~this.FLAG_Z)|(this.test_z8(this.reg_a)*this.FLAG_Z)) ;
                this.reg_cc=((this.reg_cc&~this.FLAG_V)) ;
                this.reg_cc=((this.reg_cc&~this.FLAG_C)|(this.test_c(i0, i1, this.reg_a, 0)*this.FLAG_C)) ;
                cycles.value+=(2);
                break;
            case 0x3c:
                var val = this.vecx.read8(this.reg_pc++);
                this.reg_cc=((this.reg_cc&~this.FLAG_E)|(this.FLAG_E)) ;
                this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                this.irq_status = this.IRQ_CWAI;
                this.reg_cc &= val;
                cycles.value+=(4);
                break;
            case 0x10:
                op = this.vecx.read8(this.reg_pc++);
                switch( op )
                    {
                    case 0x20:
                    case 0x21:
                        this.inst_bra16(0, op, cycles);
                        break;
                    case 0x22:
                    case 0x23:
                        this.inst_bra16( ((this.reg_cc/this.FLAG_C>>0)&1)  |  ((this.reg_cc/this.FLAG_Z>>0)&1) , op, cycles);
                        break;
                    case 0x24:
                    case 0x25:
                        this.inst_bra16( ((this.reg_cc/this.FLAG_C>>0)&1) , op, cycles);
                        break;
                    case 0x26:
                    case 0x27:
                        this.inst_bra16( ((this.reg_cc/this.FLAG_Z>>0)&1) , op, cycles);
                        break;
                    case 0x28:
                    case 0x29:
                        this.inst_bra16( ((this.reg_cc/this.FLAG_V>>0)&1) , op, cycles);
                        break;
                    case 0x2a:
                    case 0x2b:
                        this.inst_bra16( ((this.reg_cc/this.FLAG_N>>0)&1) , op, cycles);
                        break;
                    case 0x2c:
                    case 0x2d:
                        this.inst_bra16( ((this.reg_cc/this.FLAG_N>>0)&1)  ^  ((this.reg_cc/this.FLAG_V>>0)&1) , op, cycles);
                        break;
                    case 0x2e:
                    case 0x2f:
                        this.inst_bra16( ((this.reg_cc/this.FLAG_Z>>0)&1)  |
                                        ( ((this.reg_cc/this.FLAG_N>>0)&1)  ^  ((this.reg_cc/this.FLAG_V>>0)&1) ), op, cycles);
                        break;
                    case 0x83:
                        this.inst_sub16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.pc_read16());
                        cycles.value+=(5);
                        break;
                    case 0x93:
                        ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                        this.inst_sub16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.read16(ea));
                        cycles.value+=(7);
                        break;
                    case 0xa3:
                        ea = this.ea_indexed(cycles);
                        this.inst_sub16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.read16(ea));
                        cycles.value+=(7);
                        break;
                    case 0xb3:
                        ea = this.pc_read16();
                        this.inst_sub16( ((this.reg_a<<8)|(this.reg_b&0xff)) , this.read16(ea));
                        cycles.value+=(8);
                        break;
                    case 0x8c:
                        this.inst_sub16(this.reg_y.value, this.pc_read16());
                        cycles.value+=(5);
                        break;
                    case 0x9c:
                        ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                        this.inst_sub16(this.reg_y.value, this.read16(ea));
                        cycles.value+=(7);
                        break;
                    case 0xac:
                        ea = this.ea_indexed(cycles);
                        this.inst_sub16(this.reg_y.value, this.read16(ea));
                        cycles.value+=(7);
                        break;
                    case 0xbc:
                        ea = this.pc_read16();
                        this.inst_sub16(this.reg_y.value, this.read16(ea));
                        cycles.value+=(8);
                        break;
                    case 0x8e:
                        this.reg_y.value=(this.pc_read16());
                        this.inst_tst16(this.reg_y.value);
                        cycles.value+=(4);
                        break;
                    case 0x9e:
                        ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                        this.reg_y.value=(this.read16(ea));
                        this.inst_tst16(this.reg_y.value);
                        cycles.value+=(6);
                        break;
                    case 0xae:
                        ea = this.ea_indexed(cycles);
                        this.reg_y.value=(this.read16(ea));
                        this.inst_tst16(this.reg_y.value);
                        cycles.value+=(6);
                        break;
                    case 0xbe:
                        ea = this.pc_read16();
                        this.reg_y.value=(this.read16(ea));
                        this.inst_tst16(this.reg_y.value);
                        cycles.value+=(7);
                        break;
                    case 0x9f:
                        ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                        this.write16(ea, this.reg_y.value);
                        this.inst_tst16(this.reg_y.value);
                        cycles.value+=(6);
                        break;
                    case 0xaf:
                        ea = this.ea_indexed(cycles);
                        this.write16(ea, this.reg_y.value);
                        this.inst_tst16(this.reg_y.value);
                        cycles.value+=(6);
                        break;
                    case 0xbf:
                        ea = this.pc_read16();
                        this.write16(ea, this.reg_y.value);
                        this.inst_tst16(this.reg_y.value);
                        cycles.value+=(7);
                        break;
                    case 0xce:
                        this.reg_s.value=(this.pc_read16());
                        this.inst_tst16(this.reg_s.value);
                        cycles.value+=(4);
                        break;
                    case 0xde:
                        ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                        this.reg_s.value=(this.read16(ea));
                        this.inst_tst16(this.reg_s.value);
                        cycles.value+=(6);
                        break;
                    case 0xee:
                        ea = this.ea_indexed(cycles);
                        this.reg_s.value=(this.read16(ea));
                        this.inst_tst16(this.reg_s.value);
                        cycles.value+=(6);
                        break;
                    case 0xfe:
                        ea = this.pc_read16();
                        this.reg_s.value=(this.read16(ea));
                        this.inst_tst16(this.reg_s.value);
                        cycles.value+=(7);
                        break;
                    case 0xdf:
                        ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                        this.write16(ea, this.reg_s.value);
                        this.inst_tst16(this.reg_s.value);
                        cycles.value+=(6);
                        break;
                    case 0xef:
                        ea = this.ea_indexed(cycles);
                        this.write16(ea, this.reg_s.value);
                        this.inst_tst16(this.reg_s.value);
                        cycles.value+=(6);
                        break;
                    case 0xff:
                        ea = this.pc_read16();
                        this.write16(ea, this.reg_s.value);
                        this.inst_tst16(this.reg_s.value);
                        cycles.value+=(7);
                        break;
                    case 0x3f:
                        this.reg_cc=((this.reg_cc&~this.FLAG_E)|(this.FLAG_E)) ;
                        this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                        this.reg_pc = this.read16(0xfff4);
                        cycles.value+=(8);
                        break;
                    default:
                        utils.showError("unknown page-1 op code: " + op);
                        break;
                }
                break;
            case 0x11:
                op = this.vecx.read8(this.reg_pc++);
                switch( op )
                {
                    case 0x83:
                        this.inst_sub16(this.reg_u.value, this.pc_read16());
                        cycles.value+=(5);
                        break;
                    case 0x93:
                        ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                        this.inst_sub16(this.reg_u.value, this.read16(ea));
                        cycles.value+=(7);
                        break;
                    case 0xa3:
                        ea = this.ea_indexed(cycles);
                        this.inst_sub16(this.reg_u.value, this.read16(ea));
                        cycles.value+=(7);
                        break;
                    case 0xb3:
                        ea = this.pc_read16();
                        this.inst_sub16(this.reg_u.value, this.read16(ea));
                        cycles.value+=(8);
                        break;
                    case 0x8c:
                        this.inst_sub16(this.reg_s.value, this.pc_read16());
                        cycles.value+=(5);
                        break;
                    case 0x9c:
                        ea =  ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++)) ;
                        this.inst_sub16(this.reg_s.value, this.read16(ea));
                        cycles.value+=(7);
                        break;
                    case 0xac:
                        ea = this.ea_indexed(cycles);
                        this.inst_sub16(this.reg_s.value, this.read16(ea));
                        cycles.value+=(7);
                        break;
                    case 0xbc:
                        ea = this.pc_read16();
                        this.inst_sub16(this.reg_s.value, this.read16(ea));
                        cycles.value+=(8);
                        break;
                    case 0x3f:
                        this.reg_cc=((this.reg_cc&~this.FLAG_E)|(this.FLAG_E)) ;
                        this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                        this.reg_pc = this.read16(0xfff2);
                        cycles.value+=(8);
                        break;
                    default:
                        utils.showError("unknown page-2 op code: " + op);
                        break;
                }
                break;
            default:
                utils.showError("unknown page-0 op code: " + op);
                break;
        }
        return cycles.value;
    }
    this.init = function( vecx )
    {
        this.vecx = vecx;
    }
}
