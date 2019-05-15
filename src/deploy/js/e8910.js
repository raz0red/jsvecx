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


function e8910()
{
    this.psg = {
        index: 0,
        ready: 0,
        lastEnable: 0,
        PeriodA: 0,
        PeriodB: 0,
        PeriodC: 0,
        PeriodN: 0,
        PeriodE: 0,
        CountA: 0,
        CountB: 0,
        CountC: 0,
        CountN: 0,
        CountE: 0,
        VolA: 0,
        VolB: 0,
        VolC: 0,
        VolE: 0,
        EnvelopeA: 0,
        EnvelopeB: 0,
        EnvelopeC: 0,
        OutputA: 0,
        OutputB: 0,
        OutputC: 0,
        OutputN: 0,
        CountEnv: 0,
        Hold: 0,
        Alternate: 0,
        Attack: 0,
        Holding: 0,
        RNG: 0,
        VolTable: new Array(32),
        Regs: null
    };
    this.ctx = null;
    this.node = null;
    this.enabled = true;
    this.e8910_build_mixer_table = function() {
        var i;
        var out;
        out = 0x0fff;
        for (i = 31;i > 0;i--)
        {
            this.psg.VolTable[i] = (out + 0.5)>>>0;
            out /= 1.188502227;
        }
        this.psg.VolTable[0] = 0;
    }
    this.e8910_write = function(r, v) {
        var old;
        this.psg.Regs[r] = v;
        switch( r )
        {
            case (0):
            case (1):
                this.psg.Regs[(1)] &= 0x0f;
                old = this.psg.PeriodA;
                this.psg.PeriodA = (this.psg.Regs[(0)] + 256 * this.psg.Regs[(1)]) * 1;
                if (this.psg.PeriodA == 0) this.psg.PeriodA = 1;
                this.psg.CountA += this.psg.PeriodA - old;
                if (this.psg.CountA <= 0) this.psg.CountA = 1;
                break;
            case (2):
            case (3):
                this.psg.Regs[(3)] &= 0x0f;
                old = this.psg.PeriodB;
                this.psg.PeriodB = (this.psg.Regs[(2)] + 256 * this.psg.Regs[(3)]) * 1;
                if (this.psg.PeriodB == 0) this.psg.PeriodB = 1;
                this.psg.CountB += this.psg.PeriodB - old;
                if (this.psg.CountB <= 0) this.psg.CountB = 1;
                break;
            case (4):
            case (5):
                this.psg.Regs[(5)] &= 0x0f;
                old = this.psg.PeriodC;
                this.psg.PeriodC = (this.psg.Regs[(4)] + 256 * this.psg.Regs[(5)]) * 1;
                if (this.psg.PeriodC == 0) this.psg.PeriodC = 1;
                this.psg.CountC += this.psg.PeriodC - old;
                if (this.psg.CountC <= 0) this.psg.CountC = 1;
                break;
            case (6):
                this.psg.Regs[(6)] &= 0x1f;
                old = this.psg.PeriodN;
                this.psg.PeriodN = this.psg.Regs[(6)] * 1;
                if (this.psg.PeriodN == 0) this.psg.PeriodN = 1;
                this.psg.CountN += this.psg.PeriodN - old;
                if (this.psg.CountN <= 0) this.psg.CountN = 1;
                break;
            case (7):
                this.psg.lastEnable = this.psg.Regs[(7)];
                break;
            case (8):
                this.psg.Regs[(8)] &= 0x1f;
                this.psg.EnvelopeA = this.psg.Regs[(8)] & 0x10;
                this.psg.VolA = this.psg.EnvelopeA ? this.psg.VolE : this.psg.VolTable[this.psg.Regs[(8)] ? this.psg.Regs[(8)]*2+1 : 0];
                break;
            case (9):
                this.psg.Regs[(9)] &= 0x1f;
                this.psg.EnvelopeB = this.psg.Regs[(9)] & 0x10;
                this.psg.VolB = this.psg.EnvelopeB ? this.psg.VolE : this.psg.VolTable[this.psg.Regs[(9)] ? this.psg.Regs[(9)]*2+1 : 0];
                break;
            case (10):
                this.psg.Regs[(10)] &= 0x1f;
                this.psg.EnvelopeC = this.psg.Regs[(10)] & 0x10;
                this.psg.VolC = this.psg.EnvelopeC ? this.psg.VolE : this.psg.VolTable[this.psg.Regs[(10)] ? this.psg.Regs[(10)]*2+1 : 0];
                break;
            case (11):
            case (12):
                old = this.psg.PeriodE;
                this.psg.PeriodE = ((this.psg.Regs[(11)] + 256 * this.psg.Regs[(12)])) * 1;
                //if (this.psg.PeriodE == 0) this.psg.PeriodE = 1 / 2;
                if (this.psg.PeriodE == 0) this.psg.PeriodE = 1;
                this.psg.CountE += this.psg.PeriodE - old;
                if (this.psg.CountE <= 0) this.psg.CountE = 1;
                break;
            case (13):
                this.psg.Regs[(13)] &= 0x0f;
                this.psg.Attack = (this.psg.Regs[(13)] & 0x04) ? 0x1f : 0x00;
                if ((this.psg.Regs[(13)] & 0x08) == 0)
                {
                    this.psg.Hold = 1;
                    this.psg.Alternate = this.psg.Attack;
                }
                else
                {
                    this.psg.Hold = this.psg.Regs[(13)] & 0x01;
                    this.psg.Alternate = this.psg.Regs[(13)] & 0x02;
                }
                this.psg.CountE = this.psg.PeriodE;
                this.psg.CountEnv = 0x1f;
                this.psg.Holding = 0;
                this.psg.VolE = this.psg.VolTable[this.psg.CountEnv ^ this.psg.Attack];
                if (this.psg.EnvelopeA) this.psg.VolA = this.psg.VolE;
                if (this.psg.EnvelopeB) this.psg.VolB = this.psg.VolE;
                if (this.psg.EnvelopeC) this.psg.VolC = this.psg.VolE;
                break;
            case (14):
                break;
            case (15):
                break;
        }
    }
    this.toggleEnabled = function() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    this.e8910_callback = function(stream, length)
    {
        var idx = 0;
        var outn = 0;
        if (!this.psg.ready || !this.enabled)
        {
            //memset(stream, 0, length * sizeof(*stream));
            for(var i = 0; i < length; i++) {
                stream[i] = 0;
            }
            return;
        }
        length = length << 1;
        if (this.psg.Regs[(7)] & 0x01)
        {
            if (this.psg.CountA <= length) this.psg.CountA += length;
            this.psg.OutputA = 1;
        }
        else if (this.psg.Regs[(8)] == 0)
        {
            if (this.psg.CountA <= length) this.psg.CountA += length;
        }
        if (this.psg.Regs[(7)] & 0x02)
        {
            if (this.psg.CountB <= length) this.psg.CountB += length;
            this.psg.OutputB = 1;
        }
        else if (this.psg.Regs[(9)] == 0)
        {
            if (this.psg.CountB <= length) this.psg.CountB += length;
        }
        if (this.psg.Regs[(7)] & 0x04)
        {
            if (this.psg.CountC <= length) this.psg.CountC += length;
            this.psg.OutputC = 1;
        }
        else if (this.psg.Regs[(10)] == 0)
        {
            if (this.psg.CountC <= length) this.psg.CountC += length;
        }
        if ((this.psg.Regs[(7)] & 0x38) == 0x38)
            if (this.psg.CountN <= length) this.psg.CountN += length;
        outn = (this.psg.OutputN | this.psg.Regs[(7)]);
        while (length > 0)
        {
            var vol;
            var left = 2;
            var vola, volb, volc;
            vola = volb = volc = 0;
            do
            {
                var nextevent;
                if (this.psg.CountN < left) nextevent = this.psg.CountN;
                else nextevent = left;
                if (outn & 0x08)
                {
                    if (this.psg.OutputA) vola += this.psg.CountA;
                    this.psg.CountA -= nextevent;
                    while (this.psg.CountA <= 0)
                    {
                        this.psg.CountA += this.psg.PeriodA;
                        if (this.psg.CountA > 0)
                        {
                            this.psg.OutputA ^= 1;
                            if (this.psg.OutputA) vola += this.psg.PeriodA;
                            break;
                        }
                        this.psg.CountA += this.psg.PeriodA;
                        vola += this.psg.PeriodA;
                    }
                    if (this.psg.OutputA) vola -= this.psg.CountA;
                }
                else
                {
                    this.psg.CountA -= nextevent;
                    while (this.psg.CountA <= 0)
                    {
                        this.psg.CountA += this.psg.PeriodA;
                        if (this.psg.CountA > 0)
                        {
                            this.psg.OutputA ^= 1;
                            break;
                        }
                        this.psg.CountA += this.psg.PeriodA;
                    }
                }
                if (outn & 0x10)
                {
                    if (this.psg.OutputB) volb += this.psg.CountB;
                    this.psg.CountB -= nextevent;
                    while (this.psg.CountB <= 0)
                    {
                        this.psg.CountB += this.psg.PeriodB;
                        if (this.psg.CountB > 0)
                        {
                            this.psg.OutputB ^= 1;
                            if (this.psg.OutputB) volb += this.psg.PeriodB;
                            break;
                        }
                        this.psg.CountB += this.psg.PeriodB;
                        volb += this.psg.PeriodB;
                    }
                    if (this.psg.OutputB) volb -= this.psg.CountB;
                }
                else
                {
                    this.psg.CountB -= nextevent;
                    while (this.psg.CountB <= 0)
                    {
                        this.psg.CountB += this.psg.PeriodB;
                        if (this.psg.CountB > 0)
                        {
                            this.psg.OutputB ^= 1;
                            break;
                        }
                        this.psg.CountB += this.psg.PeriodB;
                    }
                }
                if (outn & 0x20)
                {
                    if (this.psg.OutputC) volc += this.psg.CountC;
                    this.psg.CountC -= nextevent;
                    while (this.psg.CountC <= 0)
                    {
                        this.psg.CountC += this.psg.PeriodC;
                        if (this.psg.CountC > 0)
                        {
                            this.psg.OutputC ^= 1;
                            if (this.psg.OutputC) volc += this.psg.PeriodC;
                            break;
                        }
                        this.psg.CountC += this.psg.PeriodC;
                        volc += this.psg.PeriodC;
                    }
                    if (this.psg.OutputC) volc -= this.psg.CountC;
                }
                else
                {
                    this.psg.CountC -= nextevent;
                    while (this.psg.CountC <= 0)
                    {
                        this.psg.CountC += this.psg.PeriodC;
                        if (this.psg.CountC > 0)
                        {
                            this.psg.OutputC ^= 1;
                            break;
                        }
                        this.psg.CountC += this.psg.PeriodC;
                    }
                }
                this.psg.CountN -= nextevent;
                if (this.psg.CountN <= 0)
                {
                    if ((this.psg.RNG + 1) & 2)
                    {
                        this.psg.OutputN = (~this.psg.OutputN & 0xff); // raz
                        outn = (this.psg.OutputN | this.psg.Regs[(7)]);
                    }
                    if (this.psg.RNG & 1) {
                        this.psg.RNG ^= 0x24000;
                    }
                    this.psg.RNG >>= 1;
                    this.psg.CountN += this.psg.PeriodN;
                }
                left -= nextevent;
            } while (left > 0);
            if (this.psg.Holding == 0)
            {
                this.psg.CountE -= 2;
                if (this.psg.CountE <= 0)
                {
                    do
                    {
                        this.psg.CountEnv--;
                        this.psg.CountE += this.psg.PeriodE;
                    } while (this.psg.CountE <= 0);
                    if (this.psg.CountEnv < 0)
                    {
                        if (this.psg.Hold)
                        {
                            if (this.psg.Alternate)
                                this.psg.Attack ^= 0x1f;
                            this.psg.Holding = 1;
                            this.psg.CountEnv = 0;
                        }
                        else
                        {
                            if (this.psg.Alternate && (this.psg.CountEnv & 0x20))
                                this.psg.Attack ^= 0x1f;
                            this.psg.CountEnv &= 0x1f;
                        }
                    }
                    this.psg.VolE = this.psg.VolTable[this.psg.CountEnv ^ this.psg.Attack];
                    if (this.psg.EnvelopeA) this.psg.VolA = this.psg.VolE;
                    if (this.psg.EnvelopeB) this.psg.VolB = this.psg.VolE;
                    if (this.psg.EnvelopeC) this.psg.VolC = this.psg.VolE;
                }
            }
            vol = (vola * this.psg.VolA + volb * this.psg.VolB + volc * this.psg.VolC) / (3 * 2);
            if (--length & 1) {
                var val = vol / 0x0fff;
                stream[idx++] = val;
            }
        }
    }
    this.init = function(regs) {
        this.psg.Regs = regs;
        this.psg.RNG = 1;
        this.psg.OutputA = 0;
        this.psg.OutputB = 0;
        this.psg.OutputC = 0;
        this.psg.OutputN = 0xff;
        this.psg.ready = 0;
    }
    this.start = function() {
        var self = this;
        if (this.ctx == null && (window.AudioContext || window.webkitAudioContext)) {
            self.e8910_build_mixer_table();
            var ctx = window.AudioContext ?
                new window.AudioContext({sampleRate: 22050}) :
                new window.webkitAudioContext();
            this.ctx = ctx;
            this.node = this.ctx.createScriptProcessor(512, 0, 1);
            this.node.onaudioprocess = function(e) {
                self.e8910_callback(e.outputBuffer.getChannelData(0), 512);
            }
            this.node.connect(this.ctx.destination);
            var resumeFunc =
                function(){if (ctx.state !== 'running') ctx.resume();}
            document.documentElement.addEventListener("keydown", resumeFunc);
            document.documentElement.addEventListener("click", resumeFunc);
        }
        if (this.ctx) this.psg.ready = 1;
    }
    this.stop = function() {
        this.psg.ready = 0;
    }
}
