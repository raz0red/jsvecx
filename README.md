# JSVecX

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Ported by raz0red

## Overview
 
JSVecX is a JavaScript port of the VecX emulator. The emulator was ported from
the original C version as developed by Valavan Manohararajah to JavaScript/HTML5.
This port relies on the HTML5 Canvas element for display and the Web Audio API 
for sound (no flash is required). 

The emulator can be found at the following location: 

http://www.twitchasylum.com/jsvecx/

[![JSVecX](https://raw.githubusercontent.com/raz0red/jsvecx/master/screenshots/jsvecx.jpg)](http://www.twitchasylum.com/jsvecx/)

It is also worth noting that there is nothing illegal about posting the
commercial Vectrex roms, they were made available for non-commercial use in the 90's. 

## Known issues

  * Buggy Sound ~ While the emulator now has sound support, it is a bit 
    quirky. Several games will experience periodic audio issues (Berzerk, 
    Star Trek, Armor Attack). Sound can be toggled on and off by clicking 
    the "speaker" button.
  * Overlays are misaligned ~ (core bug) The vector rendering code of VecX
    doesn't appear to be 100% accurate. As a result, some of the overlays
    are a bit misaligned. In addition, text is also sometimes unreadable.
    I will be looking at the vector rendering code to see if this can be 
    resolved. 

## Change Log

### 05/19/19 (0.2.1)
    - Added ability to "drag and drop" local ROM files
    - Added "Birds of Prey" homebrew game
    - Added "Patriots III" homebrew game
    - Updated to latest version of jQuery (3.4.1)

### 05/14/19 (0.2.0)
    - Initial sound support (still quite buggy)
    - Added "Asteroid Cowboy" homebrew game
    - Added box art for Thrust and Minestorm
    - Removed Chrome frame extension (deprecated long ago)

### 05/22/10 (0.1.0)
    - Added support for Google Chrome Frame. This will prompt IE users to install
      this plugin which allows JSVecX to run within Internet Explorer. 

### 05/19/10 
    - Thanks to an awesome tip from Parabellum, author of the great Vectrex
      emulator ParaJVE, it appears that the Mine Storm bug is now resolved. 
    - Another fix thanks to Parabellum's notes, Bedlam is now working
    - Added Polar Rescue, now works thanks to fixes listed above. 

### 05/18/10 
    - Updated to use "fast boot rom", reduces the Vectrex intro screen time
    - Several optimizations. 
 
### 05/09/10 
    - Initial release
