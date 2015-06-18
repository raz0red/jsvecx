--------------------------------------------
JSVecX
--------------------------------------------

Ported by raz0red

--------------------------------------------
Overview
--------------------------------------------

JSVecX i a JavaScript port of the VecX emulator. The emulator was ported from
the original C version as developed by Valavan Manohararajah to JavaScript
and the HTML5 canvas element (no flash or other plugins are required). 

The port is pretty CPU intensive, so you will need a modern computer with
Chrome, Firefox, Opera, or a recent version of Safari. 

The emulator can be found at the following location: 

[http://www.twitchasylum.com/jsvecx/] 

--------------------------------------------
About
--------------------------------------------

The first question people ask when I describe this port is, "Why?", which is
actually a pretty good question. For me, porting emulators is really more than
the final product. It provides a unique ability to examine the hardware of a
classic system at a level that I would never get when just playing the games.
For some time I have been interested in the Vectrex system. I always wanted
one growing up, but it was always well out of my price range. So, I have
periodically looked to see if there were any emulators that I could port to
the Wii. I think hands down, the best Vectrex emulator out there is ParaJVE
but it is currently closed source. VecX, while a good emulator has its quirks,
so I never really considered porting it to the Wii. However, recently I noted
the various emulators being ported to JavaScript/HTML5 and VecX seemed like a
perfect candidate for porting to such a platform. 

It is also worth noting that there is nothing illegal about posting the
commercial Vectrex roms, they were made public domain in the 90's. 

--------------------------------------------
Known issues
--------------------------------------------

  * No Sound
  * Overlays are misaligned ~ (core bug) The vector rendering code of VecX
    doesn't appear to be 100% accurate. As a result, some of the overlays
    are a bit misaligned. In addition, text is also sometimes unreadable.
    I will be looking at the vector rendering code to see if this can be 
    resolved. 
  * Arrow Keys on Opera ~ The arrow keys don't work with Opera on certain
    platforms (Mac, Linux, etc.). As such, I added the ability to use a
    different set of keys (P - L - ; - ' ). I will look into this a bit more
    and try to figure out why Opera handles the arrow keys differently than
    other browsers. 
  * Cartridge selection on Opera ~ Once a game is selected, Opera continues
    to send keyboard events to the cartridge pull-down. To stop this, you must
    click somewhere else on the page. Not sure why this is happening, will look
    into it more. 

--------------------------------------------
Change Log
--------------------------------------------

05/22/10 
-------------------
 - Added support for Google Chrome Frame. This will prompt IE users to install
   this plugin which allows JSVecX to run within Internet Explorer. 

05/19/10 
-------------------
 - Thanks to an awesome tip from Parabellum, author of the great Vectrex
   emulator ParaJVE, it appears that the Mine Storm bug is now resolved. 
 - Another fix thanks to Parabellum's notes, Bedlam is now working
 - Added Polar Rescue, now works thanks to fixes listed above. 

05/18/10 
-------------------
 - Updated to use "fast boot rom", reduces the Vectrex intro screen time
 - Several optimizations. 
 
05/09/10 
-------------------
 - Initial release
