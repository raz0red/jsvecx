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

    /* index registers */

    //static unsigned reg_x;
    this.reg_x = new fptr(0);
    //static unsigned reg_y;
    this.reg_y = new fptr(0);

    /* user stack pointer */

    //static unsigned reg_u;
    this.reg_u = new fptr(0);

    /* hardware stack pointer */

    //static unsigned reg_s;
    this.reg_s = new fptr(0);

    /* program counter */

    //static unsigned reg_pc;
    this.reg_pc = 0;

    /* accumulators */

    //static unsigned reg_a;
    this.reg_a = 0;
    //static unsigned reg_b;
    this.reg_b = 0;

    /* direct page register */

    //static unsigned reg_dp;
    this.reg_dp = 0;

    /* condition codes */

    //static unsigned reg_cc;
    this.reg_cc = 0;

    /* flag to see if interrupts should be handled (sync/cwai). */

    //static unsigned irq_status;
    this.irq_status = 0;

    /*
        static unsigned *rptr_xyus[4] = {
            &reg_x,
            &reg_y,
            &reg_u,
            &reg_s
        };
    */

    this.rptr_xyus = [ this.reg_x,  this.reg_y,  this.reg_u,  this.reg_s ];

    /* obtain a particular condition code. returns 0 or 1. */

//    //static einline unsigned get_cc (unsigned flag)
//    this.get_cc = function( flag )
//    {
//        return ( this.reg_cc / flag >> 0 ) & 1;
//    }
#define GETCC( flag ) ((this.reg_cc/flag>>0)&1)

    /*
    * set a particular condition code to either 0 or 1.
    * value parameter must be either 0 or 1.
    */

//    //static einline void set_cc (unsigned flag, unsigned value)
//    this.set_cc = function( flag, value )
//    {
//        this.reg_cc &= ~flag;
//        this.reg_cc |= value * flag;
//    }
#define SETCC( flag, value ) this.reg_cc=((this.reg_cc&~flag)|(value*flag))

    /* test carry */

    //static einline unsigned test_c (unsigned i0, unsigned i1,
    //unsigned r, unsigned sub)
    this.test_c = function( i0, i1, r, sub )
    {
        var flag = (i0 | i1) & ~r;
        /* one of the inputs is 1 and output is 0 */
        flag |= (i0 & i1);
        /* both inputs are 1 */
        flag = (flag >> 7) & 1;
        flag ^= sub;
        /* on a sub, carry is opposite the carry of an add */

        return flag;
    }

    /* test negative */

//    //static einline unsigned test_n (unsigned r)
//    this.test_n = function( r )
//    {
//        return (r >> 7) & 1;
//    }
#define TESTN(r) ((r>>7)&1)

    /* test for zero in lower 8 bits */

    //static einline unsigned test_z8 (unsigned r)
    this.test_z8 = function( r )
    {
        var flag = ~r;
        flag = (flag >> 4) & (flag & 0xf);
        flag = (flag >> 2) & (flag & 0x3);
        flag = (flag >> 1) & (flag & 0x1);

        return flag;
    }

    /* test for zero in lower 16 bits */

    //static einline unsigned test_z16 (unsigned r)
    this.test_z16 = function( r )
    {
        var flag = ~r;
        flag = (flag >> 8) & (flag & 0xff);
        flag = (flag >> 4) & (flag & 0xf);
        flag = (flag >> 2) & (flag & 0x3);
        flag = (flag >> 1) & (flag & 0x1);

        return flag;
    }

    /* overflow is set whenever the sign bits of the inputs are the same
     * but the sign bit of the result is not same as the sign bits of the
     * inputs.
     */

    //static einline unsigned test_v (unsigned i0, unsigned i1, unsigned r)
    this.test_v = function( i0, i1, r )
    {
        var flag = ~(i0 ^ i1);
        /* input sign bits are the same */
        flag &= (i0 ^ r);
        /* input sign and output sign not same */
        flag = (flag >> 7) & 1;

        return flag;
    }
#define TESTV( i0, i1, r ) ((((~(i0^i1))&(i0^r))>>7)&1)

//    //static einline unsigned get_reg_d (void)
//    this.get_reg_d = function()
//    {
//        return (this.reg_a << 8) | (this.reg_b & 0xff);
//    }
#define GETREGD() ((this.reg_a<<8)|(this.reg_b&0xff))

    //static einline void set_reg_d (unsigned value)
    this.set_reg_d = function( value )
    {
        this.reg_a = (value >> 8);
        this.reg_b = value;
    }

    /* read a byte ... the returned value has the lower 8-bits set to the byte
     * while the upper bits are all zero.
     */

//    //static einline unsigned read8 (unsigned address)
//    this.read8 = function( address )
//    {
//        //return this.e6809_read8( address & 0xffff );
//        return this.vecx.read8(address & 0xffff);
//    }

    /* write a byte ... only the lower 8-bits of the unsigned data
     * is written. the upper bits are ignored.
     */

//    //static einline void write8 (unsigned address, unsigned data)
//    this.write8 = function( address, data )
//    {
//        this.vecx.write8(address & 0xffff, data & 0xff);
//    }

    //static einline unsigned read16 (unsigned address)
    this.read16 = function( address )
    {
        var datahi = this.vecx.read8(address);
        var datalo = this.vecx.read8(address + 1);

        return (datahi << 8) | datalo;
    }

    //static einline void write16 (unsigned address, unsigned data)
    this.write16 = function( address, data )
    {
        this.vecx.write8(address, data >> 8);
        this.vecx.write8(address + 1, data);
    }

    //static einline void push8 (unsigned *sp, unsigned data)
    this.push8 = function( sp, data )
    {
        //(*sp)--;
        sp.value--;
        //write8 (*sp, data);
        this.vecx.write8(sp.value, data);
    }

//    //static einline unsigned pull8 (unsigned *sp)
//    this.pull8 = function( sp )
//    {
//        //unsigned data;
//        return this.vecx.read8(sp.value++);
//        //(*sp)++;
//    }
#define PULL8( sp ) (this.vecx.read8(sp.value++))

    //static einline void push16 (unsigned *sp, unsigned data)
    this.push16 = function( sp, data )
    {
        /*
        this.push8(sp, data);
        this.push8(sp, data >> 8);
        */
        sp.value--;
        this.vecx.write8(sp.value, data);
        sp.value--;
        this.vecx.write8(sp.value, data >> 8 );
    }

    //static einline unsigned pull16 (unsigned *sp)
    this.pull16 = function( sp )
    {
        //unsigned datahi, datalo;

        var datahi = this.vecx.read8(sp.value++);
        var datalo = this.vecx.read8(sp.value++);

        return (datahi << 8) | datalo;
    }

    /* read a byte from the address pointed to by the pc */

//    //static einline unsigned pc_read8 (void)
//    this.pc_read8 = function()
//    {
//        return this.vecx.read8(this.reg_pc++);
//    }

    /* read a word from the address pointed to by the pc */

    //static einline unsigned pc_read16 (void)
    this.pc_read16 = function()
    {
        //unsigned data;

        var data = this.read16(this.reg_pc);
        this.reg_pc += 2;

        return data;
    }

    /* sign extend an 8-bit quantity into a 16-bit quantity */

    //static einline unsigned sign_extend (unsigned data)
    this.sign_extend = function( data )
    {
        return (~(data & 0x80) + 1) | (data & 0xff);
    }

    /* direct addressing, upper byte of the address comes from
     * the direct page register, and the lower byte comes from the
     * instruction itself.
     */

//    //static einline unsigned ea_direct (void)
//    this.ea_direct = function()
//    {
//        return (this.reg_dp << 8) | this.vecx.read8(this.reg_pc++);
//    }
#define EADIRECT() ((this.reg_dp<<8)|this.vecx.read8(this.reg_pc++))

    /*
    * extended addressing, address is obtained from 2 bytes following
    * the instruction.
    */

    //static einline unsigned ea_extended (void)
//    this.ea_extended = function()
//    {
//        return this.pc_read16();
//    }

    /* indexed addressing */

    //static einline unsigned ea_indexed (unsigned *cycles)
    this.ea_indexed = function( cycles )
    {
        //unsigned r, op, ea;
        var ea = 0;
        var op = 0;
        var r = 0;

        /* post byte */

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
            /* R, +[0, 15] */

                //ea = *rptr_xyus[r] + (op & 0xf);
                ea = this.rptr_xyus[r].value + (op & 0xf);
                //(*cycles)++;
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
            /* R, +[-16, -1] */

                //ea = *rptr_xyus[r] + (op & 0xf) - 0x10;
                ea = this.rptr_xyus[r].value + (op & 0xf) - 0x10;
                //(*cycles)++;
                cycles.value++;
                break;
            case 0x80: case 0x81:
            case 0xa0: case 0xa1:
            case 0xc0: case 0xc1:
            case 0xe0: case 0xe1:
            /* ,R+ / ,R++ */

                //ea = *rptr_xyus[r];
                ea = this.rptr_xyus[r].value;
                //*rptr_xyus[r] += 1 + (op & 1);
                this.rptr_xyus[r].value+=(1 + (op & 1));
                //*cycles += 2 + (op & 1);
                cycles.value+=(2 + (op & 1));
                break;
            case 0x90: case 0x91:
            case 0xb0: case 0xb1:
            case 0xd0: case 0xd1:
            case 0xf0: case 0xf1:
            /* [,R+] ??? / [,R++] */

                //ea = read16 (*rptr_xyus[r]);
                ea = this.read16(this.rptr_xyus[r].value);
                //*rptr_xyus[r] += 1 + (op & 1);
                this.rptr_xyus[r].value+=(1 + (op & 1));
                //*cycles += 5 + (op & 1);
                cycles.value+=(5 + (op & 1));
                break;
            case 0x82: case 0x83:
            case 0xa2: case 0xa3:
            case 0xc2: case 0xc3:
            case 0xe2: case 0xe3:
            /* ,-R / ,--R */

                //*rptr_xyus[r] -= 1 + (op & 1);
                this.rptr_xyus[r].value-=(1 + (op & 1));
                //ea = *rptr_xyus[r];
                ea = this.rptr_xyus[r].value;
                //*cycles += 2 + (op & 1);
                cycles.value+=(2 + (op & 1));
                break;
            case 0x92: case 0x93:
            case 0xb2: case 0xb3:
            case 0xd2: case 0xd3:
            case 0xf2: case 0xf3:
            /* [,-R] ??? / [,--R] */

                //*rptr_xyus[r] -= 1 + (op & 1);
                this.rptr_xyus[r].value-=(1 + (op & 1));
                //ea = read16 (*rptr_xyus[r]);
                ea = this.read16(this.rptr_xyus[r].value);
                //*cycles += 5 + (op & 1);
                cycles.value+=(5 + (op & 1));
                break;
            case 0x84: case 0xa4:
            case 0xc4: case 0xe4:
            /* ,R */

                //ea = *rptr_xyus[r];
                ea = this.rptr_xyus[r].value;
                break;
            case 0x94: case 0xb4:
            case 0xd4: case 0xf4:
            /* [,R] */

                //ea = read16 (*rptr_xyus[r]);
                ea = this.read16(this.rptr_xyus[r].value);
                //*cycles += 3;
                cycles.value+=(3);
                break;
            case 0x85: case 0xa5:
            case 0xc5: case 0xe5:
            /* B,R */

                //ea = *rptr_xyus[r] + sign_extend (reg_b);
                ea = this.rptr_xyus[r].value + this.sign_extend(this.reg_b);
                //*cycles += 1;
                cycles.value+=(1);
                break;
            case 0x95: case 0xb5:
            case 0xd5: case 0xf5:
            /* [B,R] */

                //ea = read16 (*rptr_xyus[r] + sign_extend (reg_b));
                ea = this.read16(this.rptr_xyus[r].value + this.sign_extend(this.reg_b));
                //*cycles += 4;
                cycles.value+=(4);
                break;
            case 0x86: case 0xa6:
            case 0xc6: case 0xe6:
            /* A,R */

                //ea = *rptr_xyus[r] + sign_extend (reg_a);
                ea = this.rptr_xyus[r].value + this.sign_extend(this.reg_a);
                //*cycles += 1;
                cycles.value+=(1);
                break;
            case 0x96: case 0xb6:
            case 0xd6: case 0xf6:
            /* [A,R] */

                //ea = read16 (*rptr_xyus[r] + sign_extend (reg_a));
                ea = this.read16(this.rptr_xyus[r].value + this.sign_extend(this.reg_a));
                //*cycles += 4;
                cycles.value+=(4);
            break;
            case 0x88: case 0xa8:
            case 0xc8: case 0xe8:
            /* byte,R */

                //ea = *rptr_xyus[r] + sign_extend (pc_read8 ());
                ea = this.rptr_xyus[r].value + this.sign_extend(this.vecx.read8(this.reg_pc++));
                //*cycles += 1;
                cycles.value+=(1);
                break;
            case 0x98: case 0xb8:
            case 0xd8: case 0xf8:
            /* [byte,R] */

                //ea = read16 (*rptr_xyus[r] + sign_extend (pc_read8 ()));
                ea = this.read16(this.rptr_xyus[r].value + this.sign_extend(this.vecx.read8(this.reg_pc++)));
                //*cycles += 4;
                cycles.value+=(4);
                break;
            case 0x89: case 0xa9:
            case 0xc9: case 0xe9:
            /* word,R */

                //ea = *rptr_xyus[r] + pc_read16 ();
                ea = this.rptr_xyus[r].value + this.pc_read16();
                //*cycles += 4;
                cycles.value+=(4);
                break;
            case 0x99: case 0xb9:
            case 0xd9: case 0xf9:
            /* [word,R] */

                //ea = read16 (*rptr_xyus[r] + pc_read16 ());
                ea = this.read16(this.rptr_xyus[r].value + this.pc_read16());
                //*cycles += 7;
                cycles.value+=(7);
                break;
            case 0x8b: case 0xab:
            case 0xcb: case 0xeb:
            /* D,R */

                //ea = *rptr_xyus[r] + get_reg_d ();
                ea = this.rptr_xyus[r].value + GETREGD();
                //*cycles += 4;
                cycles.value+=(4);
                break;
            case 0x9b: case 0xbb:
            case 0xdb: case 0xfb:
                /* [D,R] */

                //ea = read16 (*rptr_xyus[r] + get_reg_d ());
                ea = this.read16(this.rptr_xyus[r].value + GETREGD());
                //*cycles += 7;
                cycles.value+=(7);
                break;
            case 0x8c: case 0xac:
            case 0xcc: case 0xec:
            /* byte, PC */

                //r = sign_extend (pc_read8 ());
                r = this.sign_extend(this.vecx.read8(this.reg_pc++));
                //ea = reg_pc + r;
                ea = this.reg_pc + r;
                //*cycles += 1;
                cycles.value+=(1);
                break;
            case 0x9c: case 0xbc:
            case 0xdc: case 0xfc:
            /* [byte, PC] */

                //r = sign_extend (pc_read8 ());
                r = this.sign_extend(this.vecx.read8(this.reg_pc++));
                //ea = read16 (reg_pc + r);
                ea = this.read16(this.reg_pc + r);
                //*cycles += 4;
                cycles.value+=(4);
                break;
            case 0x8d: case 0xad:
            case 0xcd: case 0xed:
            /* word, PC */

                //r = pc_read16 ();
                r = this.pc_read16();
                //ea = reg_pc + r;
                ea = this.reg_pc + r;
                //*cycles += 5;
                cycles.value+=(5);
                break;
            case 0x9d: case 0xbd:
            case 0xdd: case 0xfd:
            /* [word, PC] */

                //r = pc_read16 ();
                r = this.pc_read16();
                //ea = read16 (reg_pc + r);
                ea = this.read16(this.reg_pc + r);
                //*cycles += 8;
                cycles.value+=(8);
                break;
            case 0x9f:
            /* [address] */

                //ea = read16 (pc_read16 ());
                ea = this.read16(this.pc_read16());
                //*cycles += 5;
                cycles.value+=(5);
                break;
            default:
                //printf ("undefined post-byte\n");
                console.log("undefined post-byte");
                break;
        }

        return ea;
    }

    /* instruction: neg
     * essentially (0 - data).
     */

    //einline unsigned inst_neg (unsigned data)
    this.inst_neg = function( data )
    {
        //unsigned i0, i1, r;

        var i0 = 0;
        var i1 = (~data) & 0xffff; // raz
        var r = i0 + i1 + 1;

        SETCC(this.FLAG_H, this.test_c(i0 << 4, i1 << 4, r << 4, 0));
        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, TESTV(i0, i1, r));
        SETCC(this.FLAG_C, this.test_c(i0, i1, r, 1));

        return r;
    }

    /* instruction: com */

    //einline unsigned inst_com (unsigned data)
    this.inst_com = function( data )
    {
        var r = (~data) & 0xffff; // raz

        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, 0);
        SETCC(this.FLAG_C, 1);

        return r;
    }

    /* instruction: lsr
     * cannot be faked as an add or substract.
     */
    //einline unsigned inst_lsr (unsigned data)
    this.inst_lsr = function( data )
    {
        //unsigned r;

        var r = (data >> 1) & 0x7f;

        SETCC(this.FLAG_N, 0);
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_C, data & 1);

        return r;
    }

    /* instruction: ror
     * cannot be faked as an add or substract.
     */
    //einline unsigned inst_ror (unsigned data)
    this.inst_ror = function( data )
    {
        //unsigned r, c;

        var c = GETCC(this.FLAG_C);
        var r = ((data >> 1) & 0x7f) | (c << 7);

        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_C, data & 1);

        return r;
    }

    /* instruction: asr
     * cannot be faked as an add or substract.
     */
    //einline unsigned inst_asr (unsigned data)
    this.inst_asr = function( data )
    {
        //unsigned r;

        var r = ((data >> 1) & 0x7f) | (data & 0x80);

        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_C, data & 1);

        return r;
    }

    /* instruction: asl
     * essentially (data + data). simple addition.
     */
    //einline unsigned inst_asl (unsigned data)
    this.inst_asl = function( data )
    {
        //unsigned i0, i1, r;

        var i0 = data;
        var i1 = data;
        var r = i0 + i1;

        SETCC(this.FLAG_H, this.test_c(i0 << 4, i1 << 4, r << 4, 0));
        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, TESTV(i0, i1, r));
        SETCC(this.FLAG_C, this.test_c(i0, i1, r, 0));

        return r;
    }

    /* instruction: rol
     * essentially (data + data + carry). addition with carry.
     */
    //einline unsigned inst_rol (unsigned data)
    this.inst_rol = function( data )
    {
        //unsigned i0, i1, c, r;

        var i0 = data;
        var i1 = data;
        var c = GETCC(this.FLAG_C);
        var r = i0 + i1 + c;

        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, TESTV(i0, i1, r));
        SETCC(this.FLAG_C, this.test_c(i0, i1, r, 0));

        return r;
    }

    /* instruction: dec
     * essentially (data - 1).
     */
    //einline unsigned inst_dec (unsigned data)
    this.inst_dec = function( data )
    {
        //unsigned i0, i1, r;

        var i0 = data;
        var i1 = 0xff;
        var r = i0 + i1;

        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, TESTV(i0, i1, r));

        return r;
    }

    /* instruction: inc
     * essentially (data + 1).
     */
    //einline unsigned inst_inc (unsigned data)
    this.inst_inc = function( data )
    {
        //unsigned i0, i1, r;

        var i0 = data;
        var i1 = 1;
        var r = i0 + i1;

        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, TESTV(i0, i1, r));

        return r;
    }

    /* instruction: tst */
    //einline void inst_tst8 (unsigned data)
    this.inst_tst8 = function( data )
    {
        SETCC(this.FLAG_N, TESTN(data));
        SETCC(this.FLAG_Z, this.test_z8(data));
        SETCC(this.FLAG_V, 0);
    }

    //einline void inst_tst16 (unsigned data)
    this.inst_tst16 = function( data )
    {
        SETCC(this.FLAG_N, TESTN(data >> 8));
        SETCC(this.FLAG_Z, this.test_z16(data));
        SETCC(this.FLAG_V, 0);
    }

    /* instruction: clr */
    //einline void inst_clr (void)
    this.inst_clr = function()
    {
        SETCC(this.FLAG_N, 0);
        SETCC(this.FLAG_Z, 1);
        SETCC(this.FLAG_V, 0);
        SETCC(this.FLAG_C, 0);
    }

    /* instruction: suba/subb */

    //einline unsigned inst_sub8 (unsigned data0, unsigned data1)
    this.inst_sub8 = function( data0, data1 )
    {
        //unsigned i0, i1, r;

        var i0 = data0;
        var i1 = (~data1) & 0xffff; // raz
        var r = i0 + i1 + 1;

        SETCC(this.FLAG_H, this.test_c(i0 << 4, i1 << 4, r << 4, 0));
        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, TESTV(i0, i1, r));
        SETCC(this.FLAG_C, this.test_c(i0, i1, r, 1));

        return r;
    }

    /* instruction: sbca/sbcb/cmpa/cmpb.
     * only 8-bit version, 16-bit version not needed.
     */
    //einline unsigned inst_sbc (unsigned data0, unsigned data1)
    this.inst_sbc = function( data0, data1 )
    {
        //unsigned i0, i1, c, r;

        var i0 = data0;
        var i1 = (~data1) & 0xffff; //raz
        var c = 1 - GETCC(this.FLAG_C);
        var r = i0 + i1 + c;

        SETCC(this.FLAG_H, this.test_c(i0 << 4, i1 << 4, r << 4, 0));
        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, TESTV(i0, i1, r));
        SETCC(this.FLAG_C, this.test_c(i0, i1, r, 1));

        return r;
    }

    /* instruction: anda/andb/bita/bitb.
     * only 8-bit version, 16-bit version not needed.
     */
    //einline unsigned inst_and (unsigned data0, unsigned data1)
    this.inst_and = function( data0, data1 )
    {
        //unsigned r;
        var r = data0 & data1;
        this.inst_tst8(r);
        return r;
    }

    /* instruction: eora/eorb.
     * only 8-bit version, 16-bit version not needed.
     */
    //einline unsigned inst_eor (unsigned data0, unsigned data1)
    this.inst_eor = function ( data0, data1 )
    {
        //unsigned r;

        var r = data0 ^ data1;
        this.inst_tst8(r);
        return r;
    }

    /* instruction: adca/adcb
     * only 8-bit version, 16-bit version not needed.
     */
    //einline unsigned inst_adc (unsigned data0, unsigned data1)
    this.inst_adc = function ( data0, data1 )
    {
        //unsigned i0, i1, c, r;

        var i0 = data0;
        var i1 = data1;
        var c = GETCC(this.FLAG_C);
        var r = i0 + i1 + c;

        SETCC(this.FLAG_H, this.test_c(i0 << 4, i1 << 4, r << 4, 0));
        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, TESTV(i0, i1, r));
        SETCC(this.FLAG_C, this.test_c(i0, i1, r, 0));

        return r;
    }

    /* instruction: ora/orb.
     * only 8-bit version, 16-bit version not needed.
     */
    //einline unsigned inst_or (unsigned data0, unsigned data1)
    this.inst_or = function( data0, data1 )
    {
        //unsigned r;
        var r = data0 | data1;
        this.inst_tst8(r);
        return r;
    }

    /* instruction: adda/addb */
    //einline unsigned inst_add8 (unsigned data0, unsigned data1)
    this.inst_add8 = function( data0, data1 )
    {
        //unsigned i0, i1, r;

        var i0 = data0;
        var i1 = data1;
        var r = i0 + i1;

        SETCC(this.FLAG_H, this.test_c(i0 << 4, i1 << 4, r << 4, 0));
        SETCC(this.FLAG_N, TESTN(r));
        SETCC(this.FLAG_Z, this.test_z8(r));
        SETCC(this.FLAG_V, TESTV(i0, i1, r));
        SETCC(this.FLAG_C, this.test_c(i0, i1, r, 0));

        return r;
    }

    /* instruction: addd */
    //einline unsigned inst_add16 (unsigned data0, unsigned data1)
    this.inst_add16 = function( data0, data1 )
    {
        //unsigned i0, i1, r;

        var i0 = data0;
        var i1 = data1;
        var r = i0 + i1;

        SETCC(this.FLAG_N, TESTN(r >> 8));
        SETCC(this.FLAG_Z, this.test_z16(r));
        SETCC(this.FLAG_V, this.test_v(i0 >> 8, i1 >> 8, r >> 8));
        SETCC(this.FLAG_C, this.test_c(i0 >> 8, i1 >> 8, r >> 8, 0));

        return r;
    }

    /* instruction: subd */
    //einline unsigned inst_sub16 (unsigned data0, unsigned data1)
    this.inst_sub16 = function( data0, data1 )
    {
        //unsigned i0, i1, r;

        var i0 = data0;
        var i1 = (~data1) & 0xffff; // raz
        var r = i0 + i1 + 1;

        SETCC(this.FLAG_N, TESTN(r >> 8));
        SETCC(this.FLAG_Z, this.test_z16(r));
        SETCC(this.FLAG_V, this.test_v(i0 >> 8, i1 >> 8, r >> 8));
        SETCC(this.FLAG_C, this.test_c(i0 >> 8, i1 >> 8, r >> 8, 1));

        return r;
    }

    /* instruction: 8-bit offset branch */
    //einline void inst_bra8 (unsigned test, unsigned op, unsigned *cycles)
    this.inst_bra8 = function ( test, op, cycles )
    {
        //unsigned offset, mask;

        var offset = this.vecx.read8(this.reg_pc++);

        /* trying to avoid an if statement */

        var mask = (test ^ (op & 1)) - 1;
        /* 0xffff when taken, 0 when not taken */
        this.reg_pc += this.sign_extend(offset) & mask;

        //*cycles += 3;        
        cycles.value+=(3);
    }

    /* instruction: 16-bit offset branch */

    //einline void inst_bra16 (unsigned test, unsigned op, unsigned *cycles)
    this.inst_bra16 = function( test, op, cycles )
    {
        //unsigned offset, mask;

        var offset = this.pc_read16();

        /* trying to avoid an if statement */

        var mask = (test ^ (op & 1)) - 1;
        /* 0xffff when taken, 0 when not taken */
        this.reg_pc += offset & mask;

        //*cycles += 5 - mask;
        cycles.value+=(5 - mask);
    }

    /* instruction: pshs/pshu */

    //einline void inst_psh (unsigned op, unsigned *sp,
    //unsigned data, unsigned *cycles)
    this.inst_psh = function ( op, sp, data, cycles )
    {
        if( op & 0x80 )
        {
            this.push16(sp, this.reg_pc);
            //*cycles += 2;
            cycles.value+=(2);
        }

        if( op & 0x40 )
        {
            /* either s or u */
            this.push16(sp, data);
            //*cycles += 2;
            cycles.value+=(2);
        }

        if( op & 0x20 )
        {
            this.push16(sp, this.reg_y.value);
            //*cycles += 2;
            cycles.value+=(2);
        }

        if( op & 0x10 )
        {
            this.push16(sp, this.reg_x.value);
            //*cycles += 2;
            cycles.value+=(2);
        }

        if( op & 0x08 )
        {
            this.push8(sp, this.reg_dp);
            //*cycles += 1;
            cycles.value+=(1);
        }

        if( op & 0x04 )
        {
            this.push8(sp, this.reg_b);
            //*cycles += 1;
            cycles.value+=(1);
        }

        if( op & 0x02 )
        {
            this.push8(sp, this.reg_a);
            //*cycles += 1;
            cycles.value+=(1);
        }

        if( op & 0x01 )
        {
            this.push8(sp, this.reg_cc);
            //*cycles += 1;
            cycles.value+=(1);
        }
    }

    /* instruction: puls/pulu */
    //einline void inst_pul (unsigned op, unsigned *sp, unsigned *osp,
    //unsigned *cycles)
    this.inst_pul = function( op, sp, osp, cycles )
    {
        if( op & 0x01 )
        {
            //this.reg_cc;
            this.reg_cc = PULL8(sp);
            //*cycles += 1;
            cycles.value+=(1);
        }

        if( op & 0x02 )
        {
            //this.reg_a;
            this.reg_a = PULL8(sp);
            //*cycles += 1;
            cycles.value+=(1);
        }

        if( op & 0x04 )
        {
            //this.reg_b;
            this.reg_b = PULL8(sp);
            //*cycles += 1;
            cycles.value+=(1);
        }

        if( op & 0x08 )
        {
            //this.reg_dp;
            this.reg_dp = PULL8(sp);
            //*cycles += 1;
            cycles.value+=(1);
        }

        if( op & 0x10 )
        {
            //this.reg_x;
            this.reg_x.value=(this.pull16(sp));
            //*cycles += 2;
            cycles.value+=(2);
        }

        if( op & 0x20 )
        {
            //this.reg_y;
            this.reg_y.value=(this.pull16(sp));
            //*cycles += 2;
            cycles.value+=(2);
        }

        if( op & 0x40 )
        {
            /* either s or u */
            //*osp = pull16 (sp);
            osp.value=(this.pull16(sp));
            //*cycles += 2;
            cycles.value+=(2);
        }

        if( op & 0x80 )
        {
            //this.reg_pc;
            this.reg_pc = this.pull16(sp);
            //*cycles += 2;
            cycles.value+=(2);
        }
    }

    //einline unsigned exgtfr_read (unsigned reg)
    this.exgtfr_read = function( reg )
    {
        //unsigned data;
        var data = 0;

        switch( reg )
        {
            case 0x0:
                data = GETREGD();
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
                //printf ("illegal exgtfr reg %.1x\n", reg);
                utils.showError("illegal exgtfr reg" + reg);
                break;
        }

        return data;
    }

    //einline void exgtfr_write (unsigned reg, unsigned data)
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
                //printf ("illegal exgtfr reg %.1x\n", reg);
                utils.showError("illegal exgtfr reg " + reg)
                break;
        }
    }

    /* instruction: exg */
    //einline void inst_exg (void)
    this.inst_exg = function()
    {
        //unsigned op, tmp;

        var op = this.vecx.read8(this.reg_pc++);

        var tmp = this.exgtfr_read(op & 0xf);
        this.exgtfr_write(op & 0xf, this.exgtfr_read(op >> 4));
        this.exgtfr_write(op >> 4, tmp);
    }

    /* instruction: tfr */
    //einline void inst_tfr (void)
    this.inst_tfr = function()
    {
        //unsigned op;

        var op = this.vecx.read8(this.reg_pc++);

        this.exgtfr_write(op & 0xf, this.exgtfr_read(op >> 4));
    }

    /* reset the 6809 */

    //void e6809_reset (void)
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

    /* execute a single instruction or handle interrupts and return */
    //unsigned e6809_sstep (unsigned irq_i, unsigned irq_f)
    this.e6809_sstep = function( irq_i, irq_f )
    {
        //unsigned op;
        //unsigned cycles = 0;
        //unsigned ea, i0, i1, r;        

        var op = 0;
        var cycles = this.cycles;
        cycles.value=(0);
        var ea = 0;
        var i0 = 0;
        var i1 = 0;
        var r = 0;

        if( irq_f )
        {
            if( GETCC(this.FLAG_F) == 0 )
            {
                if( this.irq_status != this.IRQ_CWAI )
                {
                    SETCC(this.FLAG_E, 0);
                    //inst_psh (0x81, &reg_s, reg_u, &cycles);
                    this.inst_psh(0x81, this.reg_s, this.reg_u.value, cycles);
                }

                SETCC(this.FLAG_I, 1);
                SETCC(this.FLAG_F, 1);

                this.reg_pc = this.read16(0xfff6);
                this.irq_status = this.IRQ_NORMAL;
                //cycles += 7;
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
            if( GETCC(this.FLAG_I) == 0 )
            {
                if( this.irq_status != this.IRQ_CWAI )
                {
                    SETCC(this.FLAG_E, 1);
                    //inst_psh (0xff, &reg_s, reg_u, &cycles);
                    this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                }

                SETCC(this.FLAG_I, 1);

                this.reg_pc = this.read16(0xfff8);
                this.irq_status = this.IRQ_NORMAL;
                //cycles += 7;
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

        if( this.irq_status != this.IRQ_NORMAL )
        {
            return cycles.value + 1;
        }

        op = this.vecx.read8(this.reg_pc++);

        switch( op )
        {
        /* page 0 instructions */

        /* neg, nega, negb */
            case 0x00:
                ea = EADIRECT();
                r = this.inst_neg(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x40:
                this.reg_a = this.inst_neg(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x50:
                this.reg_b = this.inst_neg(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x60:
                ea = this.ea_indexed(cycles);
                r = this.inst_neg(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x70:
                ea = this.pc_read16();
                r = this.inst_neg(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* com, coma, comb */
            case 0x03:
                ea = EADIRECT();
                r = this.inst_com(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x43:
                this.reg_a = this.inst_com(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x53:
                this.reg_b = this.inst_com(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x63:
                ea = this.ea_indexed(cycles);
                r = this.inst_com(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x73:
                ea = this.pc_read16();
                r = this.inst_com(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* lsr, lsra, lsrb */
            case 0x04:
                ea = EADIRECT();
                r = this.inst_lsr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x44:
                this.reg_a = this.inst_lsr(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x54:
                this.reg_b = this.inst_lsr(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x64:
                ea = this.ea_indexed(cycles);
                r = this.inst_lsr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x74:
                ea = this.pc_read16();
                r = this.inst_lsr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* ror, rora, rorb */
            case 0x06:
                ea = EADIRECT();
                r = this.inst_ror(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x46:
                this.reg_a = this.inst_ror(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x56:
                this.reg_b = this.inst_ror(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x66:
                ea = this.ea_indexed(cycles);
                r = this.inst_ror(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x76:
                ea = this.pc_read16();
                r = this.inst_ror(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* asr, asra, asrb */
            case 0x07:
                ea = EADIRECT();
                r = this.inst_asr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x47:
                this.reg_a = this.inst_asr(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x57:
                this.reg_b = this.inst_asr(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x67:
                ea = this.ea_indexed(cycles);
                r = this.inst_asr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x77:
                ea = this.pc_read16();
                r = this.inst_asr(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* asl, asla, aslb */
            case 0x08:
                ea = EADIRECT();
                r = this.inst_asl(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x48:
                this.reg_a = this.inst_asl(this.reg_a);
            //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x58:
                this.reg_b = this.inst_asl(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x68:
                ea = this.ea_indexed(cycles);
                r = this.inst_asl(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x78:
                ea = this.pc_read16();
                r = this.inst_asl(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* rol, rola, rolb */
            case 0x09:
                ea = EADIRECT();
                r = this.inst_rol(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x49:
                this.reg_a = this.inst_rol(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x59:
                this.reg_b = this.inst_rol(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x69:
                ea = this.ea_indexed(cycles);
                r = this.inst_rol(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x79:
                ea = this.pc_read16();
                r = this.inst_rol(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* dec, deca, decb */
            case 0x0a:
                ea = EADIRECT();
                r = this.inst_dec(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x4a:
                this.reg_a = this.inst_dec(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x5a:
                this.reg_b = this.inst_dec(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x6a:
                ea = this.ea_indexed(cycles);
                r = this.inst_dec(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x7a:
                ea = this.pc_read16();
                r = this.inst_dec(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* inc, inca, incb */
            case 0x0c:
                ea = EADIRECT();
                r = this.inst_inc(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x4c:
                this.reg_a = this.inst_inc(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x5c:
                this.reg_b = this.inst_inc(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x6c:
                ea = this.ea_indexed(cycles);
                r = this.inst_inc(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x7c:
                ea = this.pc_read16();
                r = this.inst_inc(this.vecx.read8(ea));
                this.vecx.write8(ea, r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* tst, tsta, tstb */
            case 0x0d:
                ea = EADIRECT();
                this.inst_tst8(this.vecx.read8(ea));
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x4d:
                this.inst_tst8(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x5d:
                this.inst_tst8(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x6d:
                ea = this.ea_indexed(cycles);
                this.inst_tst8(this.vecx.read8(ea));
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x7d:
                ea = this.pc_read16();
                this.inst_tst8(this.vecx.read8(ea));
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* jmp */
            case 0x0e:
                this.reg_pc = EADIRECT();
                //cycles += 3;
                cycles.value+=(3);
                break;
            case 0x6e:
                this.reg_pc = this.ea_indexed(cycles);
                //cycles += 3;
                cycles.value+=(3);
                break;
            case 0x7e:
                this.reg_pc = this.pc_read16();
                //cycles += 4;
                cycles.value+=(4);
                break;
            /* clr */
            case 0x0f:
                ea = EADIRECT();
                this.inst_clr();
                this.vecx.write8(ea, 0);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x4f:
                this.inst_clr();
                this.reg_a = 0;
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x5f:
                this.inst_clr();
                this.reg_b = 0;
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x6f:
                ea = this.ea_indexed(cycles);
                this.inst_clr();
                this.vecx.write8(ea, 0);
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0x7f:
                ea = this.pc_read16();
                this.inst_clr();
                this.vecx.write8(ea, 0);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* suba */
            case 0x80:
                this.reg_a = this.inst_sub8(this.reg_a, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x90:
                ea = EADIRECT();
                this.reg_a = this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xa0:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xb0:
                ea = this.pc_read16();
                this.reg_a = this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* subb */
            case 0xc0:
                this.reg_b = this.inst_sub8(this.reg_b, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xd0:
                ea = EADIRECT();
                this.reg_b = this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xe0:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xf0:
                ea = this.pc_read16();
                this.reg_b = this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* cmpa */
            case 0x81:
                this.inst_sub8(this.reg_a, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x91:
                ea = EADIRECT();
                this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xa1:
                ea = this.ea_indexed(cycles);
                this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xb1:
                ea = this.pc_read16();
                this.inst_sub8(this.reg_a, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* cmpb */
            case 0xc1:
                this.inst_sub8(this.reg_b, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xd1:
                ea = EADIRECT();
                this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xe1:
                ea = this.ea_indexed(cycles);
                this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xf1:
                ea = this.pc_read16();
                this.inst_sub8(this.reg_b, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* sbca */
            case 0x82:
                this.reg_a = this.inst_sbc(this.reg_a, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x92:
                ea = EADIRECT();
                this.reg_a = this.inst_sbc(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xa2:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_sbc(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xb2:
                ea = this.pc_read16();
                this.reg_a = this.inst_sbc(this.reg_a, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* sbcb */
            case 0xc2:
                this.reg_b = this.inst_sbc(this.reg_b, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xd2:
                ea = EADIRECT();
                this.reg_b = this.inst_sbc(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xe2:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_sbc(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xf2:
                ea = this.pc_read16();
                this.reg_b = this.inst_sbc(this.reg_b, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* anda */
            case 0x84:
                this.reg_a = this.inst_and(this.reg_a, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x94:
                ea = EADIRECT();
                this.reg_a = this.inst_and(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xa4:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_and(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xb4:
                ea = this.pc_read16();
                this.reg_a = this.inst_and(this.reg_a, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* andb */
            case 0xc4:
                this.reg_b = this.inst_and(this.reg_b, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xd4:
                ea = EADIRECT();
                this.reg_b = this.inst_and(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xe4:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_and(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xf4:
                ea = this.pc_read16();
                this.reg_b = this.inst_and(this.reg_b, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* bita */
            case 0x85:
                this.inst_and(this.reg_a, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x95:
                ea = EADIRECT();
                this.inst_and(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xa5:
                ea = this.ea_indexed(cycles);
                this.inst_and(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xb5:
                ea = this.pc_read16();
                this.inst_and(this.reg_a, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* bitb */
            case 0xc5:
                this.inst_and(this.reg_b, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xd5:
                ea = EADIRECT();
                this.inst_and(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xe5:
                ea = this.ea_indexed(cycles);
                this.inst_and(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xf5:
                ea = this.pc_read16();
                this.inst_and(this.reg_b, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* lda */
            case 0x86:
                this.reg_a = this.vecx.read8(this.reg_pc++);
                this.inst_tst8(this.reg_a);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x96:
                ea = EADIRECT();
                this.reg_a = this.vecx.read8(ea);
                this.inst_tst8(this.reg_a);
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xa6:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.vecx.read8(ea);
                this.inst_tst8(this.reg_a);
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xb6:
                ea = this.pc_read16();
                this.reg_a = this.vecx.read8(ea);
                this.inst_tst8(this.reg_a);
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* ldb */
            case 0xc6:
                this.reg_b = this.vecx.read8(this.reg_pc++);
                this.inst_tst8(this.reg_b);
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xd6:
                ea = EADIRECT();
                this.reg_b = this.vecx.read8(ea);
                this.inst_tst8(this.reg_b);
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xe6:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.vecx.read8(ea);
                this.inst_tst8(this.reg_b);
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xf6:
                ea = this.pc_read16();
                this.reg_b = this.vecx.read8(ea);
                this.inst_tst8(this.reg_b);
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* sta */
            case 0x97:
                ea = EADIRECT();
                this.vecx.write8(ea, this.reg_a);
                this.inst_tst8(this.reg_a);
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xa7:
                ea = this.ea_indexed(cycles);
                this.vecx.write8(ea, this.reg_a);
                this.inst_tst8(this.reg_a);
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xb7:
                ea = this.pc_read16();
                this.vecx.write8(ea, this.reg_a);
                this.inst_tst8(this.reg_a);
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* stb */
            case 0xd7:
                ea = EADIRECT();
                this.vecx.write8(ea, this.reg_b);
                this.inst_tst8(this.reg_b);
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xe7:
                ea = this.ea_indexed(cycles);
                this.vecx.write8(ea, this.reg_b);
                this.inst_tst8(this.reg_b);
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xf7:
                ea = this.pc_read16();
                this.vecx.write8(ea, this.reg_b);
                this.inst_tst8(this.reg_b);
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* eora */
            case 0x88:
                this.reg_a = this.inst_eor(this.reg_a, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x98:
                ea = EADIRECT();
                this.reg_a = this.inst_eor(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xa8:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_eor(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xb8:
                ea = this.pc_read16();
                this.reg_a = this.inst_eor(this.reg_a, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* eorb */
            case 0xc8:
                this.reg_b = this.inst_eor(this.reg_b, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xd8:
                ea = EADIRECT();
                this.reg_b = this.inst_eor(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xe8:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_eor(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xf8:
                ea = this.pc_read16();
                this.reg_b = this.inst_eor(this.reg_b, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* adca */
            case 0x89:
                this.reg_a = this.inst_adc(this.reg_a, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x99:
                ea = EADIRECT();
                this.reg_a = this.inst_adc(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xa9:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_adc(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xb9:
                ea = this.pc_read16();
                this.reg_a = this.inst_adc(this.reg_a, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* adcb */
            case 0xc9:
                this.reg_b = this.inst_adc(this.reg_b, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xd9:
                ea = EADIRECT();
                this.reg_b = this.inst_adc(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xe9:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_adc(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xf9:
                ea = this.pc_read16();
                this.reg_b = this.inst_adc(this.reg_b, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* ora */
            case 0x8a:
                this.reg_a = this.inst_or(this.reg_a, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x9a:
                ea = EADIRECT();
                this.reg_a = this.inst_or(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xaa:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_or(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xba:
                ea = this.pc_read16();
                this.reg_a = this.inst_or(this.reg_a, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* orb */
            case 0xca:
                this.reg_b = this.inst_or(this.reg_b, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xda:
                ea = EADIRECT();
                this.reg_b = this.inst_or(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xea:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_or(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xfa:
                ea = this.pc_read16();
                this.reg_b = this.inst_or(this.reg_b, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* adda */
            case 0x8b:
                this.reg_a = this.inst_add8(this.reg_a, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0x9b:
                ea = EADIRECT();
                this.reg_a = this.inst_add8(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xab:
                ea = this.ea_indexed(cycles);
                this.reg_a = this.inst_add8(this.reg_a, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xbb:
                ea = this.pc_read16();
                this.reg_a = this.inst_add8(this.reg_a, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* addb */
            case 0xcb:
                this.reg_b = this.inst_add8(this.reg_b, this.vecx.read8(this.reg_pc++));
                //cycles += 2;
                cycles.value+=(2);
                break;
            case 0xdb:
                ea = EADIRECT();
                this.reg_b = this.inst_add8(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xeb:
                ea = this.ea_indexed(cycles);
                this.reg_b = this.inst_add8(this.reg_b, this.vecx.read8(ea));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xfb:
                ea = this.pc_read16();
                this.reg_b = this.inst_add8(this.reg_b, this.vecx.read8(ea));
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* subd */
            case 0x83:
                this.set_reg_d(this.inst_sub16(GETREGD(), this.pc_read16()));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0x93:
                ea = EADIRECT();
                this.set_reg_d(this.inst_sub16(GETREGD(), this.read16(ea)));
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0xa3:
                ea = this.ea_indexed(cycles);
                this.set_reg_d(this.inst_sub16(GETREGD(), this.read16(ea)));
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0xb3:
                ea = this.pc_read16();
                this.set_reg_d(this.inst_sub16(GETREGD(), this.read16(ea)));
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* cmpx */
            case 0x8c:
                this.inst_sub16(this.reg_x.value, this.pc_read16());
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0x9c:
                ea = EADIRECT();
                this.inst_sub16(this.reg_x.value, this.read16(ea));
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0xac:
                ea = this.ea_indexed(cycles);
                this.inst_sub16(this.reg_x.value, this.read16(ea));
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0xbc:
                ea = this.pc_read16();
                this.inst_sub16(this.reg_x.value, this.read16(ea));
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* ldx */
            case 0x8e:
                this.reg_x.value=(this.pc_read16());
                this.inst_tst16(this.reg_x.value);
                //cycles += 3;
                cycles.value+=(3);
                break;
            case 0x9e:
                ea = EADIRECT();
                this.reg_x.value=(this.read16(ea));
                this.inst_tst16(this.reg_x.value);
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xae:
                ea = this.ea_indexed(cycles);
                this.reg_x.value=(this.read16(ea));
                this.inst_tst16(this.reg_x.value);
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xbe:
                ea = this.pc_read16();
                this.reg_x.value=(this.read16(ea));
                this.inst_tst16(this.reg_x.value);
                //cycles += 6;
                cycles.value+=(6);
                break;
            /* ldu */
            case 0xce:
                this.reg_u.value=(this.pc_read16());
                this.inst_tst16(this.reg_u.value);
                //cycles += 3;
                cycles.value+=(3);
                break;
            case 0xde:
                ea = EADIRECT();
                this.reg_u.value=(this.read16(ea));
                this.inst_tst16(this.reg_u.value);
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xee:
                ea = this.ea_indexed(cycles);
                this.reg_u.value=(this.read16(ea));
                this.inst_tst16(this.reg_u.value);
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xfe:
                ea = this.pc_read16();
                this.reg_u.value=(this.read16(ea));
                this.inst_tst16(this.reg_u.value);
                //cycles += 6;
                cycles.value+=(6);
                break;
            /* stx */
            case 0x9f:
                ea = EADIRECT();
                this.write16(ea, this.reg_x.value);
                this.inst_tst16(this.reg_x.value);
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xaf:
                ea = this.ea_indexed(cycles);
                this.write16(ea, this.reg_x.value);
                this.inst_tst16(this.reg_x.value);
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xbf:
                ea = this.pc_read16();
                this.write16(ea, this.reg_x.value);
                this.inst_tst16(this.reg_x.value);
                //cycles += 6;
                cycles.value+=(6);
                break;
            /* stu */
            case 0xdf:
                ea = EADIRECT();
                this.write16(ea, this.reg_u.value);
                this.inst_tst16(this.reg_u.value);
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xef:
                ea = this.ea_indexed(cycles);
                this.write16(ea, this.reg_u.value);
                this.inst_tst16(this.reg_u.value);
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xff:
                ea = this.pc_read16();
                this.write16(ea, this.reg_u.value);
                this.inst_tst16(this.reg_u.value);
                //cycles += 6;
                cycles.value+=(6);
                break;
            /* addd */
            case 0xc3:
                this.set_reg_d(this.inst_add16(GETREGD(), this.pc_read16()));
                //cycles += 4;
                cycles.value+=(4);
                break;
            case 0xd3:
                ea = EADIRECT();
                this.set_reg_d(this.inst_add16(GETREGD(), this.read16(ea)));
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0xe3:
                ea = this.ea_indexed(cycles);
                this.set_reg_d(this.inst_add16(GETREGD(), this.read16(ea)));
                //cycles += 6;
                cycles.value+=(6);
                break;
            case 0xf3:
                ea = this.pc_read16();
                this.set_reg_d(this.inst_add16(GETREGD(), this.read16(ea)));
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* ldd */
            case 0xcc:
                this.set_reg_d(this.pc_read16());
                this.inst_tst16(GETREGD());
                //cycles += 3;
                cycles.value+=(3);
                break;
            case 0xdc:
                ea = EADIRECT();
                this.set_reg_d(this.read16(ea));
                this.inst_tst16(GETREGD());
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xec:
                ea = this.ea_indexed(cycles);
                this.set_reg_d(this.read16(ea));
                this.inst_tst16(GETREGD());
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xfc:
                ea = this.pc_read16();
                this.set_reg_d(this.read16(ea));
                this.inst_tst16(GETREGD());
                //cycles += 6;
                cycles.value+=(6);
                break;
            /* std */
            case 0xdd:
                ea = EADIRECT();
                this.write16(ea, GETREGD());
                this.inst_tst16(GETREGD());
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xed:
                ea = this.ea_indexed(cycles);
                this.write16(ea, GETREGD());
                this.inst_tst16(GETREGD());
                //cycles += 5;
                cycles.value+=(5);
                break;
            case 0xfd:
                ea = this.pc_read16();
                this.write16(ea, GETREGD());
                this.inst_tst16(GETREGD());
                //cycles += 6;
                cycles.value+=(6);
                break;
            /* nop */
            case 0x12:
                //cycles += 2;
                cycles.value+=(2);
                break;
            /* mul */
            case 0x3d:
                r = (this.reg_a & 0xff) * (this.reg_b & 0xff);
                this.set_reg_d(r);

                SETCC(this.FLAG_Z, this.test_z16(r));
                SETCC(this.FLAG_C, (r >> 7) & 1);

                //cycles += 11;
                cycles.value+=(11);
                break;
            /* bra */
            case 0x20:
            /* brn */
            case 0x21:
                this.inst_bra8(0, op, cycles);
                break;
            /* bhi */
            case 0x22:
            /* bls */
            case 0x23:
                this.inst_bra8(GETCC(this.FLAG_C) | GETCC(this.FLAG_Z), op, cycles);
                break;
            /* bhs/bcc */
            case 0x24:
            /* blo/bcs */
            case 0x25:
                this.inst_bra8(GETCC(this.FLAG_C), op, cycles);
                break;
            /* bne */
            case 0x26:
            /* beq */
            case 0x27:
                this.inst_bra8(GETCC(this.FLAG_Z), op, cycles);
                break;
            /* bvc */
            case 0x28:
            /* bvs */
            case 0x29:
                this.inst_bra8(GETCC(this.FLAG_V), op, cycles);
                break;
            /* bpl */
            case 0x2a:
            /* bmi */
            case 0x2b:
                this.inst_bra8(GETCC(this.FLAG_N), op, cycles);
                break;
            /* bge */
            case 0x2c:
            /* blt */
            case 0x2d:
                this.inst_bra8(GETCC(this.FLAG_N) ^ GETCC(this.FLAG_V), op, cycles);
                break;
            /* bgt */
            case 0x2e:
            /* ble */
            case 0x2f:
                this.inst_bra8(GETCC(this.FLAG_Z) |
                               (GETCC(this.FLAG_N) ^ GETCC(this.FLAG_V)), op, cycles);
                break;
            /* lbra */
            case 0x16:
                r = this.pc_read16();
                this.reg_pc += r;
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* lbsr */
            case 0x17:
                r = this.pc_read16();
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc += r;
                //cycles += 9;
                cycles.value+=(9);
                break;
            /* bsr */
            case 0x8d:
                r = this.vecx.read8(this.reg_pc++);
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc += this.sign_extend(r);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* jsr */
            case 0x9d:
                ea = EADIRECT();
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc = ea;
                //cycles += 7;
                cycles.value+=(7);
                break;
            case 0xad:
                ea = this.ea_indexed(cycles);
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc = ea;
                //cycles += 7;
                cycles.value+=(7);
                break;
            case 0xbd:
                ea = this.pc_read16();
                this.push16(this.reg_s, this.reg_pc);
                this.reg_pc = ea;
                //cycles += 8;
                cycles.value+=(8);
                break;
            /* leax */
            case 0x30:
                this.reg_x.value=(this.ea_indexed(cycles));
                SETCC(this.FLAG_Z, this.test_z16(this.reg_x.value));
                //cycles += 4;
                cycles.value+=(4);
                break;
            /* leay */
            case 0x31:
                this.reg_y.value=(this.ea_indexed(cycles));
                SETCC(this.FLAG_Z, this.test_z16(this.reg_y.value));
                //cycles += 4;
                cycles.value+=(4);
                break;
            /* leas */
            case 0x32:
                this.reg_s.value=(this.ea_indexed(cycles));
                //cycles += 4;
                cycles.value+=(4);
                break;
            /* leau */
            case 0x33:
                this.reg_u.value=(this.ea_indexed(cycles));
                //cycles += 4;
                cycles.value+=(4);
                break;
            /* pshs */
            case 0x34:
                this.inst_psh(this.vecx.read8(this.reg_pc++), this.reg_s, this.reg_u.value, cycles);
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* puls */
            case 0x35:
                this.inst_pul(this.vecx.read8(this.reg_pc++), this.reg_s, this.reg_u, cycles);
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* pshu */
            case 0x36:
                this.inst_psh(this.vecx.read8(this.reg_pc++), this.reg_u, this.reg_s.value, cycles);
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* pulu */
            case 0x37:
                this.inst_pul(this.vecx.read8(this.reg_pc++), this.reg_u, this.reg_s, cycles);
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* rts */
            case 0x39:
                this.reg_pc = this.pull16(this.reg_s);
                //cycles += 5;
                cycles.value+=(5);
                break;
            /* abx */
            case 0x3a:
                this.reg_x.value+=(this.reg_b & 0xff);
                //cycles += 3;
                cycles.value+=(3);
                break;
            /* orcc */
            case 0x1a:
                this.reg_cc |= this.vecx.read8(this.reg_pc++);
                //cycles += 3;
                cycles.value+=(3);
                break;
            /* andcc */
            case 0x1c:
                this.reg_cc &= this.vecx.read8(this.reg_pc++);
                //cycles += 3;
                cycles.value+=(3);
                break;
            /* sex */
            case 0x1d:
                this.set_reg_d(this.sign_extend(this.reg_b));
                SETCC(this.FLAG_N, TESTN(this.reg_a));
                SETCC(this.FLAG_Z, this.test_z16(GETREGD()));
                //cycles += 2;
                cycles.value+=(2);
                break;
            /* exg */
            case 0x1e:
                this.inst_exg();
                //cycles += 8;
                cycles.value+=(8);
                break;
            /* tfr */
            case 0x1f:
                this.inst_tfr();
                //cycles += 6;
                cycles.value+=(6);
                break;
            /* rti */
            case 0x3b:
                if( GETCC(this.FLAG_E) )
                {
                    this.inst_pul(0xff, this.reg_s, this.reg_u, cycles);
                }
                else
                {
                    this.inst_pul(0x81, this.reg_s, this.reg_u, cycles);
                }

                //cycles += 3;
                cycles.value+=(3);
                break;
            /* swi */
            case 0x3f:
                SETCC(this.FLAG_E, 1);
                this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                SETCC(this.FLAG_I, 1);
                SETCC(this.FLAG_F, 1);
                this.reg_pc = this.read16(0xfffa);
                //cycles += 7;
                cycles.value+=(7);
                break;
            /* sync */
            case 0x13:
                this.irq_status = this.IRQ_SYNC;
                //cycles += 2;
                cycles.value+=(2);
                break;
            /* daa */
            case 0x19:
                i0 = this.reg_a;
                i1 = 0;

                if( (this.reg_a & 0x0f) > 0x09 || GETCC(this.FLAG_H) == 1 )
                {
                    i1 |= 0x06;
                }

                if( (this.reg_a & 0xf0) > 0x80 && (this.reg_a & 0x0f) > 0x09 )
                {
                    i1 |= 0x60;
                }

                if( (this.reg_a & 0xf0) > 0x90 || GETCC(this.FLAG_C) == 1 )
                {
                    i1 |= 0x60;
                }

                this.reg_a = i0 + i1;

                SETCC(this.FLAG_N, TESTN(this.reg_a));
                SETCC(this.FLAG_Z, this.test_z8(this.reg_a));
                SETCC(this.FLAG_V, 0);
                SETCC(this.FLAG_C, this.test_c(i0, i1, this.reg_a, 0));
                //cycles += 2;
                cycles.value+=(2);
                break;
            /* cwai */
            case 0x3c:
                //this.reg_cc &= this.vecx.read8(this.reg_pc++);
                var val = this.vecx.read8(this.reg_pc++);  // Bedlam fix
                SETCC(this.FLAG_E, 1);
                this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                this.irq_status = this.IRQ_CWAI;
                this.reg_cc &= val; // Bedlam fix
                //cycles += 4;
                cycles.value+=(4);
                break;

            /* page 1 instructions */

            case 0x10:
                op = this.vecx.read8(this.reg_pc++);

                switch( op )
                    {
                /* lbra */
                    case 0x20:
                    /* lbrn */
                    case 0x21:
                        this.inst_bra16(0, op, cycles);
                        break;
                    /* lbhi */
                    case 0x22:
                    /* lbls */
                    case 0x23:
                        this.inst_bra16(GETCC(this.FLAG_C) | GETCC(this.FLAG_Z), op, cycles);
                        break;
                    /* lbhs/lbcc */
                    case 0x24:
                    /* lblo/lbcs */
                    case 0x25:
                        this.inst_bra16(GETCC(this.FLAG_C), op, cycles);
                        break;
                    /* lbne */
                    case 0x26:
                    /* lbeq */
                    case 0x27:
                        this.inst_bra16(GETCC(this.FLAG_Z), op, cycles);
                        break;
                    /* lbvc */
                    case 0x28:
                    /* lbvs */
                    case 0x29:
                        this.inst_bra16(GETCC(this.FLAG_V), op, cycles);
                        break;
                    /* lbpl */
                    case 0x2a:
                    /* lbmi */
                    case 0x2b:
                        this.inst_bra16(GETCC(this.FLAG_N), op, cycles);
                        break;
                    /* lbge */
                    case 0x2c:
                    /* lblt */
                    case 0x2d:
                        this.inst_bra16(GETCC(this.FLAG_N) ^ GETCC(this.FLAG_V), op, cycles);
                        break;
                    /* lbgt */
                    case 0x2e:
                    /* lble */
                    case 0x2f:
                        this.inst_bra16(GETCC(this.FLAG_Z) |
                                        (GETCC(this.FLAG_N) ^ GETCC(this.FLAG_V)), op, cycles);
                        break;
                    /* cmpd */
                    case 0x83:
                        this.inst_sub16(GETREGD(), this.pc_read16());
                        //cycles += 5;
                        cycles.value+=(5);
                        break;
                    case 0x93:
                        ea = EADIRECT();
                        this.inst_sub16(GETREGD(), this.read16(ea));
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    case 0xa3:
                        ea = this.ea_indexed(cycles);
                        this.inst_sub16(GETREGD(), this.read16(ea));
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    case 0xb3:
                        ea = this.pc_read16();
                        this.inst_sub16(GETREGD(), this.read16(ea));
                        //cycles += 8;
                        cycles.value+=(8);
                        break;
                    /* cmpy */
                    case 0x8c:
                        this.inst_sub16(this.reg_y.value, this.pc_read16());
                        //cycles += 5;
                        cycles.value+=(5);
                        break;
                    case 0x9c:
                        ea = EADIRECT();
                        this.inst_sub16(this.reg_y.value, this.read16(ea));
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    case 0xac:
                        ea = this.ea_indexed(cycles);
                        this.inst_sub16(this.reg_y.value, this.read16(ea));
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    case 0xbc:
                        ea = this.pc_read16();
                        this.inst_sub16(this.reg_y.value, this.read16(ea));
                        //cycles += 8;
                        cycles.value+=(8);
                        break;
                    /* ldy */
                    case 0x8e:
                        this.reg_y.value=(this.pc_read16());
                        this.inst_tst16(this.reg_y.value);
                        //cycles += 4;
                        cycles.value+=(4);
                        break;
                    case 0x9e:
                        ea = EADIRECT();
                        this.reg_y.value=(this.read16(ea));
                        this.inst_tst16(this.reg_y.value);
                        //cycles += 6;
                        cycles.value+=(6);
                        break;
                    case 0xae:
                        ea = this.ea_indexed(cycles);
                        this.reg_y.value=(this.read16(ea));
                        this.inst_tst16(this.reg_y.value);
                        //cycles += 6;
                        cycles.value+=(6);
                        break;
                    case 0xbe:
                        ea = this.pc_read16();
                        this.reg_y.value=(this.read16(ea));
                        this.inst_tst16(this.reg_y.value);
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    /* sty */
                    case 0x9f:
                        ea = EADIRECT();
                        this.write16(ea, this.reg_y.value);
                        this.inst_tst16(this.reg_y.value);
                        //cycles += 6;
                        cycles.value+=(6);
                        break;
                    case 0xaf:
                        ea = this.ea_indexed(cycles);
                        this.write16(ea, this.reg_y.value);
                        this.inst_tst16(this.reg_y.value);
                        //cycles += 6;
                        cycles.value+=(6);
                        break;
                    case 0xbf:
                        ea = this.pc_read16();
                        this.write16(ea, this.reg_y.value);
                        this.inst_tst16(this.reg_y.value);
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    /* lds */
                    case 0xce:
                        this.reg_s.value=(this.pc_read16());
                        this.inst_tst16(this.reg_s.value);
                        //cycles += 4;
                        cycles.value+=(4);
                        break;
                    case 0xde:
                        ea = EADIRECT();
                        this.reg_s.value=(this.read16(ea));
                        this.inst_tst16(this.reg_s.value);
                        //cycles += 6;
                        cycles.value+=(6);
                        break;
                    case 0xee:
                        ea = this.ea_indexed(cycles);
                        this.reg_s.value=(this.read16(ea));
                        this.inst_tst16(this.reg_s.value);
                        //cycles += 6;
                        cycles.value+=(6);
                        break;
                    case 0xfe:
                        ea = this.pc_read16();
                        this.reg_s.value=(this.read16(ea));
                        this.inst_tst16(this.reg_s.value);
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    /* sts */
                    case 0xdf:
                        ea = EADIRECT();
                        this.write16(ea, this.reg_s.value);
                        this.inst_tst16(this.reg_s.value);
                        //cycles += 6;
                        cycles.value+=(6);
                        break;
                    case 0xef:
                        ea = this.ea_indexed(cycles);
                        this.write16(ea, this.reg_s.value);
                        this.inst_tst16(this.reg_s.value);
                        //cycles += 6;
                        cycles.value+=(6);
                        break;
                    case 0xff:
                        ea = this.pc_read16();
                        this.write16(ea, this.reg_s.value);
                        this.inst_tst16(this.reg_s.value);
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    /* swi2 */
                    case 0x3f:
                        SETCC(this.FLAG_E, 1);
                        this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                        this.reg_pc = this.read16(0xfff4);
                        //cycles += 8;
                        cycles.value+=(8);
                        break;
                    default:
                        //printf ("unknown page-1 op code: %.2x\n", op);
                        utils.showError("unknown page-1 op code: " + op);
                        break;
                }

                break;

            /* page 2 instructions */

            case 0x11:
                op = this.vecx.read8(this.reg_pc++);

                switch( op )
                {
                    /* cmpu */
                    case 0x83:
                        this.inst_sub16(this.reg_u.value, this.pc_read16());
                        //cycles += 5;
                        cycles.value+=(5);
                        break;
                    case 0x93:
                        ea = EADIRECT();
                        this.inst_sub16(this.reg_u.value, this.read16(ea));
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    case 0xa3:
                        ea = this.ea_indexed(cycles);
                        this.inst_sub16(this.reg_u.value, this.read16(ea));
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    case 0xb3:
                        ea = this.pc_read16();
                        this.inst_sub16(this.reg_u.value, this.read16(ea));
                        //cycles += 8;
                        cycles.value+=(8);
                        break;
                    /* cmps */
                    case 0x8c:
                        this.inst_sub16(this.reg_s.value, this.pc_read16());
                        //cycles += 5;
                        cycles.value+=(5);
                        break;
                    case 0x9c:
                        ea = EADIRECT();
                        this.inst_sub16(this.reg_s.value, this.read16(ea));
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    case 0xac:
                        ea = this.ea_indexed(cycles);
                        this.inst_sub16(this.reg_s.value, this.read16(ea));
                        //cycles += 7;
                        cycles.value+=(7);
                        break;
                    case 0xbc:
                        ea = this.pc_read16();
                        this.inst_sub16(this.reg_s.value, this.read16(ea));
                        //cycles += 8;
                        cycles.value+=(8);
                        break;
                    /* swi3 */
                    case 0x3f:
                        SETCC(this.FLAG_E, 1);
                        this.inst_psh(0xff, this.reg_s, this.reg_u.value, cycles);
                        this.reg_pc = this.read16(0xfff2);
                        //cycles += 8;
                        cycles.value+=(8);
                        break;
                    default:
                        //printf ("unknown page-2 op code: %.2x\n", op);
                        utils.showError("unknown page-2 op code: " + op);
                        break;
                }

                break;

            default:
                //printf ("unknown page-0 op code: %.2x\n", op);
                utils.showError("unknown page-0 op code: " + op);
                break;
        }

        return cycles.value;
    }

#if 0
    this.validateState = function()
    {
        var negstr = null;

        //static unsigned reg_x;
        if( this.reg_x.value < 0 )
        {
            negstr = "reg_x;";
        }

        //static unsigned reg_y;
        if( this.reg_y.value < 0 )
        {
            negstr = "reg_y;";
        }

        /* user stack pointer */

        //static unsigned reg_u;
        if( this.reg_u.value < 0 )
        {
            negstr = "reg_u;";
        }

        /* hardware stack pointer */

        //static unsigned reg_s;
        if( this.reg_s.value < 0 )
        {
            negstr = "reg_s;";
        }

        /* program counter */

        //static unsigned reg_pc;
        if( this.reg_pc < 0 )
        {
            negstr = "reg_pc;";
        }

        /* accumulators */

        //static unsigned reg_a;
        if( this.reg_a < 0 )
        {
            negstr = "reg_a;";
        }

        //static unsigned reg_b;
        if( this.reg_b < 0 )
        {
            negstr = "reg_b;";
        }

        /* direct page register */

        //static unsigned reg_dp;
        if( this.reg_dp < 0 )
        {
            negstr = "reg_dp;";
        }

        /* condition codes */

        //static unsigned reg_cc;
        if( this.reg_cc < 0 )
        {
            negstr = "reg_cc;";
        }

        /* flag to see if interrupts should be handled (sync/cwai). */

        //static unsigned irq_status;
        if( this.irq_status < 0 )
        {
            negstr = "irq_status;";
        }

        if( negstr != null )
        {
            console.log( negstr );
        }
    }
#endif    

    this.init = function( vecx )
    {
        this.vecx = vecx;
    }
}

//Globals.e6809 = new e6809();
