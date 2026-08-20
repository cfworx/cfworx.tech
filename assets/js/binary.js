/* Binary & hex conversion drills (/tools/binary/). Data + checking
   only; the quiz flow lives in quiz-engine.js.

   Row formats (type code first):
     1  [1, "10110100", 180]        8-bit binary -> decimal
     2  [2, "180", "10110100"]      decimal -> 8-bit binary
     3  [3, "0xC0", 192]            hex -> decimal
     4  [4, "192", "C0"]            decimal -> hex
     5  [5, "0x5D", "01011101"]     hex -> 8-bit binary
     6  [6, "11000000", "C0"]       binary -> hex
     7  [7, dotted-dec, dotted-bin] address -> binary octets
     8  [8, dotted-bin, dotted-dec] binary octets -> address
     9  [9, "2^11", 2048]           power of two
    10  [10, "512", 9]              2^? = value
    11  [11, "5", 30]               usable hosts from n host bits
*/
(function () {
  "use strict";

  var DATA = [
    [1,"11011111",223],
    [8,"10101100.00011101.01101111.11100110","172.29.111.230"],
    [2,"255","11111111"],
    [9,"2^8",256],
    [1,"11111110",254],
    [5,"0xFE","11111110"],
    [1,"11111111",255],
    [8,"00001010.01100011.00101001.00000111","10.99.41.7"],
    [11,"5",30],
    [4,"64","40"],
    [8,"11001011.00000000.01110001.01001101","203.0.113.77"],
    [7,"192.168.4.129","11000000.10101000.00000100.10000001"],
    [1,"00000011",3],
    [3,"0x7F",127],
    [7,"255.255.224.0","11111111.11111111.11100000.00000000"],
    [4,"255","FF"],
    [1,"10000000",128],
    [1,"01100010",98],
    [2,"252","11111100"],
    [4,"200","C8"],
    [1,"10111111",191],
    [9,"2^13",8192],
    [2,"0","00000000"],
    [6,"10101000","A8"],
    [4,"100","64"],
    [8,"11000000.00000000.00000010.10010010","192.0.2.146"],
    [5,"0xE7","11100111"],
    [2,"64","01000000"],
    [1,"11000000",192],
    [9,"2^10",1024],
    [9,"2^6",64],
    [5,"0xB4","10110100"],
    [2,"100","01100100"],
    [10,"512",9],
    [1,"11110000",240],
    [1,"01100100",100],
    [3,"0xE0",224],
    [1,"00111111",63],
    [2,"128","10000000"],
    [5,"0x81","10000001"],
    [2,"24","00011000"],
    [1,"01111111",127],
    [6,"11110000","F0"],
    [5,"0x5D","01011101"],
    [6,"11111110","FE"],
    [11,"9",510],
    [2,"224","11100000"],
    [7,"131.107.3.94","10000011.01101011.00000011.01011110"],
    [2,"240","11110000"],
    [2,"32","00100000"],
    [1,"01111000",120],
    [1,"10011111",159],
    [5,"0x2A","00101010"],
    [1,"11001000",200],
    [2,"127","01111111"],
    [3,"0xA8",168],
    [2,"213","11010101"],
    [3,"0xAC",172],
    [1,"00100000",32],
    [2,"80","01010000"],
    [1,"10000001",129],
    [6,"01100110","66"],
    [2,"10","00001010"],
    [2,"43","00101011"],
    [2,"1","00000001"],
    [1,"11111100",252],
    [7,"172.16.200.14","10101100.00010000.11001000.00001110"],
    [2,"129","10000001"],
    [2,"193","11000001"],
    [1,"11011001",217],
    [9,"2^11",2048],
    [2,"192","11000000"],
    [6,"11000000","C0"],
    [3,"0xC0",192],
    [2,"22","00010110"],
    [2,"23","00010111"],
    [3,"0x1E",30],
    [5,"0x3C","00111100"],
    [2,"254","11111110"],
    [4,"172","AC"],
    [1,"11111000",248],
    [8,"11111111.11111111.11111000.00000000","255.255.248.0"],
    [4,"17","11"],
    [7,"10.1.128.63","00001010.00000001.10000000.00111111"],
    [3,"0x0A",10],
    [1,"10001001",137],
    [1,"10101000",168],
    [3,"0xFF",255],
    [4,"254","FE"],
    [2,"208","11010000"],
    [6,"00011110","1E"],
    [10,"4096",12],
    [5,"0xF0","11110000"],
    [1,"01011010",90],
    [2,"200","11001000"],
    [1,"00001010",10],
    [2,"248","11111000"],
    [6,"10000001","81"],
    [10,"16384",14],
    [1,"11100000",224]
  ];

  function txt(s) { return { c: 0, s: s }; }
  function chip(s) { return { c: 1, s: s }; }

  function question(row) {
    switch (row[0]) {
      case 1: return [txt("What is "), chip(row[1]), txt(" in decimal?")];
      case 2: return [txt("What is "), chip(row[1]), txt(" in 8-bit binary?")];
      case 3: return [txt("What is "), chip(row[1]), txt(" in decimal?")];
      case 4: return [txt("What is "), chip(row[1]), txt(" in hexadecimal?")];
      case 5: return [txt("What is "), chip(row[1]), txt(" in 8-bit binary?")];
      case 6: return [txt("What is the binary value "), chip(row[1]), txt(" in hexadecimal?")];
      case 7: return [txt("Write "), chip(row[1]), txt(" in binary, octet by octet:")];
      case 8: return [txt("Convert "), chip(row[1]), txt(" back to dotted decimal:")];
      case 9: return [txt("What is "), chip(row[1]), txt("?")];
      case 10: return [txt("2 to what power equals " + row[1] + "?")];
      default: return [txt("A subnet leaves " + row[1] +
                           " host bits. How many usable host addresses is that?")];
    }
  }

  function hint(row) {
    switch (row[0]) {
      case 1: case 3: case 9: return "e.g. 180";
      case 2: case 5: return "e.g. 10110100";
      case 4: case 6: return "e.g. 0xC0";
      case 7: return "e.g. 11000000.10101000.00000100.10000001";
      case 8: return "e.g. 192.168.4.129";
      case 10: return "e.g. 9";
      default: return "e.g. 30";
    }
  }

  function isBits(s) { return /^[01]{1,8}$/.test(s); }

  function check(row, raw) {
    var s = raw.replace(/[.,;\s]+$/, "");
    switch (row[0]) {
      case 1: case 3:
        return /^\d{1,3}$/.test(s) && parseInt(s, 10) === row[2];
      case 2: case 5:
        return isBits(s) && parseInt(s, 2) === parseInt(row[2], 2);
      case 4: case 6: {
        var h = s.replace(/^0x/i, "");
        return /^[0-9a-f]{1,2}$/i.test(h) && parseInt(h, 16) === parseInt(row[2], 16);
      }
      case 7: {
        var parts = s.split(/[.\s]+/);
        var want = row[2].split(".");
        if (parts.length !== 4) { return false; }
        for (var i = 0; i < 4; i++) {
          if (!isBits(parts[i]) || parseInt(parts[i], 2) !== parseInt(want[i], 2)) { return false; }
        }
        return true;
      }
      case 8: {
        var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
        if (!m) { return false; }
        var want8 = row[2].split(".");
        for (var j = 1; j <= 4; j++) {
          if (parseInt(m[j], 10) !== parseInt(want8[j - 1], 10)) { return false; }
        }
        return true;
      }
      case 9: case 11:
        return /^\d{1,7}$/.test(s.replace(/,/g, "")) &&
               parseInt(s.replace(/,/g, ""), 10) === row[2];
      default: { /* type 10 */
        var p = /^(?:2\s*\^)?\s*(\d{1,2})$/.exec(s);
        return !!p && parseInt(p[1], 10) === row[2];
      }
    }
  }

  function answer(row) {
    switch (row[0]) {
      case 4: case 6: return [chip("0x" + row[2])];
      case 7: return [chip(row[2])];
      case 8: return [chip(row[2])];
      case 10: return [txt(String(row[2]) + "  (2^" + row[2] + " = " + row[1] + ")")];
      default: return [chip(String(row[2]))];
    }
  }

  window.CFQuiz({ data: DATA, question: question, hint: hint, check: check, answer: answer });
})();
