/*
  input.js
  maps inputs from various sources to vecx.js
  - keyboard
*/

var input = (function() {
  var my = {};

  //
  // keyboard
  //
  my.keys = (function() {
    var my = {
      'switchKeys' : false, // false := keyboard is used for player one
    };
    var pressed = [
      {"left":false, "right":false, "up":false, "down":false},
      {"left":false, "right":false, "up":false, "down":false}
    ];
    var keyHandler = function(e) {
      var handled = true;
      var held = (e.type == "keydown"); // which event keyup or -down
      var controller = my.switchKeys ? 1 : 0;
      switch( e.keyCode ) {
        case 37:
        case 76: // left
          pressed[controller].left = held;
          break;
        case 38:
        case 80: // up
          pressed[controller].up = held;
          break;
        case 39:
        case 222: // right
          pressed[controller].right = held;
          break;
        case 40:
        case 59:
        case 186: // down
          pressed[controller].down = held;
          break;
        case 65: // a
          vecx.button(controller, 0, held);
          break;
        case 83: // s
          vecx.button(controller, 1, held);
          break;
        case 68: // d
          vecx.button(controller, 2, held);
          break;
        case 70: // f
          vecx.button(controller, 3, held);
          break;
        default:
        handled = false;
      }

      // send axis to vecx
      for (var i = 0; i < pressed.length; i++) {
        if (pressed[i].left) {
          vecx.axis(i, 0, 0x00);
        } else if (pressed[i].right) {
          vecx.axis(i, 0, 0xFF);
        } else {
          vecx.axis(i, 0, 0x80);
        }
        if (pressed[i].down) {
          vecx.axis(i, 1, 0x00);
        } else if (pressed[i].up) {
          vecx.axis(i, 1, 0xFF);
        } else {
          vecx.axis(i, 1, 0x80);
        }
      }

      if( handled && e.preventDefault ) {
        e.preventDefault();
      }

    };

    addEventListener("keydown", keyHandler, false);
    addEventListener("keyup", keyHandler, false);

    return my;
  })();

  return my;
})();
