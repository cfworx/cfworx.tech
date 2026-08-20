/* IPv6 practice (/tools/ipv6/). Data + checking only; the quiz flow
   lives in quiz-engine.js. All 120 questions were generated and
   answer-checked ahead of time with Python's ipaddress module.

   Row formats (type code first):
     1  [1, full-form, canonical-compressed]        compress it
     2  [2, compressed, full-form]                  expand it
     3  [3, address, type-key]                      identify the type
     4  [4, mac, interface-id]                      EUI-64 interface ID
     5  [5, mac, "prefix/64", full-address]         EUI-64 full address
     6  [6, address, solicited-node-multicast]
     7  [7, address, prefix-len, prefix-address]    extract the prefix

   Compression answers must be the one correct RFC 5952 form (that is
   the drill); everywhere else any valid spelling of the right address
   is accepted. */
(function () {
  "use strict";

  var DATA = [
    [1,"2001:8355:0000:45f0:0000:0000:0000:dd03","2001:8355:0:45f0::dd03"],
    [6,"fe80::544:b85:dad:f3c","ff02::1:ffad:f3c"],
    [2,"fe80:752::f1f8:d5a7:0:1d48","fe80:0752:0000:0000:f1f8:d5a7:0000:1d48"],
    [1,"2001:0000:0000:0000:0e14:04dc:0000:0000","2001::e14:4dc:0:0"],
    [6,"3fff:5820:0:aaaf::8e73","ff02::1:ff00:8e73"],
    [7,"3fff:a2c:6cb:a39:0:9283:e14d:d55f",64,"3fff:a2c:6cb:a39::"],
    [1,"2600:0000:0000:0000:0fc2:e210:0000:0112","2600::fc2:e210:0:112"],
    [2,"3fff:0:4df5::d761:b4f:7a45","3fff:0000:4df5:0000:0000:d761:0b4f:7a45"],
    [5,"f6:a8:7b:63:a6:48","2001:db8:43:53a::/64","2001:db8:43:53a:f4a8:7bff:fe63:a648"],
    [7,"2001:6687:7c7b:3cda:3354:9f3f:ceee:97c9",56,"2001:6687:7c7b:3c00::"],
    [7,"2001:e431:ceab:3e1:e6f:3ffd:2b0:9654",60,"2001:e431:ceab:3e0::"],
    [3,"fe80::3a20:22c1:831d:f48f","ll"],
    [4,"ccfb.cc5e.5425","cefb:ccff:fe5e:5425"],
    [3,"2600::a1b5:762d:d043","gua"],
    [7,"3fff:a623:0:475e:e95:cb07:ae27:c199",60,"3fff:a623:0:4750::"],
    [4,"e8:5f:7a:c9:f7:df","ea5f:7aff:fec9:f7df"],
    [2,"3fff:ad91:89f2:60a6::78d4","3fff:ad91:89f2:60a6:0000:0000:0000:78d4"],
    [6,"3fff:0:0:3d31::","ff02::1:ff00:0"],
    [4,"f2:d3:dd:c8:1f:4c","f0d3:ddff:fec8:1f4c"],
    [2,"2600:699:0:8aa3::244d","2600:0699:0000:8aa3:0000:0000:0000:244d"],
    [2,"fd0c::ebf:cde:c60:0","fd0c:0000:0000:0000:0ebf:0cde:0c60:0000"],
    [2,"3fff:a30:3cf7::a3e7:d60b","3fff:0a30:3cf7:0000:0000:0000:a3e7:d60b"],
    [6,"fe80::","ff02::1:ff00:0"],
    [2,"2600:76ae::6d4:0:db9f:374c","2600:76ae:0000:0000:06d4:0000:db9f:374c"],
    [5,"cc2f.d0ad.0a00","2001:db8:4:fa0::/64","2001:db8:4:fa0:ce2f:d0ff:fead:a00"],
    [1,"3fff:0833:0578:0000:0000:40d8:0443:0000","3fff:833:578::40d8:443:0"],
    [4,"b419.4c1e.7e5d","b619:4cff:fe1e:7e5d"],
    [2,"fd55::8477:d9c:1395:e4f3:63d","fd55:0000:0000:8477:0d9c:1395:e4f3:063d"],
    [3,"2600:acc2:ecce::143:9c2b","gua"],
    [1,"3fff:0e54:0000:0000:8488:0000:0794:c534","3fff:e54::8488:0:794:c534"],
    [6,"2001::de:6518:0:e06:7ad2","ff02::1:ff06:7ad2"],
    [4,"e6:cc:8b:31:ba:6e","e4cc:8bff:fe31:ba6e"],
    [6,"2600::5cfd:0:0:6f40","ff02::1:ff00:6f40"],
    [5,"06:64:a7:23:83:29","2001:db8:17:fbb::/64","2001:db8:17:fbb:464:a7ff:fe23:8329"],
    [2,"2600::28f:d0d1:f2f1:0","2600:0000:0000:0000:028f:d0d1:f2f1:0000"],
    [3,"fe80::221a:1abf:f58:284b","ll"],
    [1,"2600:0000:0ee2:0000:0000:0000:9ac1:0000","2600:0:ee2::9ac1:0"],
    [3,"2001:18f5:6c88:7d9f::","gua"],
    [3,"2600:0:7eb0::262:4ec:336","gua"],
    [7,"3fff:45e:7312:0:709:178d:ba98:7fa8",60,"3fff:45e:7312::"],
    [1,"fd12:0000:0000:0000:5683:9fd9:bb3a:0000","fd12::5683:9fd9:bb3a:0"],
    [4,"6a:80:43:7d:4b:a7","6880:43ff:fe7d:4ba7"],
    [3,"fd65:c4a:681:abf::b68:56b3","ula"],
    [2,"fd09::14e:fae2:7ab","fd09:0000:0000:0000:0000:014e:fae2:07ab"],
    [3,"fd89:d1fe::7cff:3d9c:fcf2","ula"],
    [2,"fe80:f307:1f68:937::","fe80:f307:1f68:0937:0000:0000:0000:0000"],
    [6,"2001:9e2:9eb::6ae0:0","ff02::1:ffe0:0"],
    [7,"2600::a9df:f86a:df1:9fa:dd29",48,"2600::"],
    [1,"fe80:9e5b:0000:0000:0000:59ef:0000:6c56","fe80:9e5b::59ef:0:6c56"],
    [2,"fd71::282f:b69:aa9d:35c:0","fd71:0000:0000:282f:0b69:aa9d:035c:0000"],
    [1,"2001:0000:0000:0000:b875:0e74:92fe:02bf","2001::b875:e74:92fe:2bf"],
    [5,"6024.0dab.ba1e","2001:db8:c0:a36::/64","2001:db8:c0:a36:6224:dff:feab:ba1e"],
    [1,"fd12:0000:0000:0000:09f3:0000:04b8:0fce","fd12::9f3:0:4b8:fce"],
    [2,"2001:e125:f7f:430::c70:7554","2001:e125:0f7f:0430:0000:0000:0c70:7554"],
    [1,"fe80:0000:7686:0866:0000:0000:02d9:aea9","fe80:0:7686:866::2d9:aea9"],
    [7,"2600:779:0:f4d9:0:130:e7a:66b8",64,"2600:779:0:f4d9::"],
    [5,"9c66.a8f2.d20f","2001:db8:8:fe5::/64","2001:db8:8:fe5:9e66:a8ff:fef2:d20f"],
    [7,"3fff:a728:833f:91cb:0:40a:0:7273",64,"3fff:a728:833f:91cb::"],
    [5,"b20a.008b.6482","2001:db8:ae:97c::/64","2001:db8:ae:97c:b00a:ff:fe8b:6482"],
    [3,"fe80::1cd3:b321:5c64:38ec","ll"],
    [6,"fe80::512","ff02::1:ff00:512"],
    [4,"4eb3.730e.dd79","4cb3:73ff:fe0e:dd79"],
    [3,"2a00::2ec7:7c33:0","gua"],
    [2,"fe80::","fe80:0000:0000:0000:0000:0000:0000:0000"],
    [1,"2001:cbd5:0000:0000:0000:0000:5cbc:5715","2001:cbd5::5cbc:5715"],
    [7,"3fff::6d47:0:0:4f9:f83d",64,"3fff:0:0:6d47::"],
    [3,"fe80::7014:6bf1:b621:82cb","ll"],
    [1,"2001:0543:dc99:1163:0000:0000:6634:9210","2001:543:dc99:1163::6634:9210"],
    [3,"fd5d:1345::cea6:6fdc:a65:d009","ula"],
    [1,"fe80:1f7a:eabb:0000:0000:0000:0000:0000","fe80:1f7a:eabb::"],
    [6,"2600:5ca7:6716::3805:324b","ff02::1:ff05:324b"],
    [1,"2001:0000:00fa:0000:0000:0000:0000:0000","2001:0:fa::"],
    [1,"2600:8cac:0000:0000:069c:0352:0000:0000","2600:8cac::69c:352:0:0"],
    [2,"fd37:723::3ae5:0:3f3b:8ec1","fd37:0723:0000:0000:3ae5:0000:3f3b:8ec1"],
    [2,"fd9f:399f::b1ad:0:741:2133","fd9f:399f:0000:0000:b1ad:0000:0741:2133"],
    [1,"fd12:0000:0000:0000:3a80:0000:9404:e086","fd12::3a80:0:9404:e086"],
    [1,"fe80:0e80:06d2:0000:0000:0003:6767:fa31","fe80:e80:6d2::3:6767:fa31"],
    [2,"2001:0:aa5::a15:9b","2001:0000:0aa5:0000:0000:0000:0a15:009b"],
    [5,"30:13:9f:46:fb:09","2001:db8:6c:377::/64","2001:db8:6c:377:3213:9fff:fe46:fb09"],
    [1,"2001:0000:0000:0624:bf53:0000:0000:0215","2001::624:bf53:0:0:215"],
    [2,"fd38::8fef:0:6fd4","fd38:0000:0000:0000:0000:8fef:0000:6fd4"],
    [3,"ff02::5","mc"],
    [4,"8420.8a40.e85c","8620:8aff:fe40:e85c"],
    [2,"fe80:d91:1fb9:c137::703:afae","fe80:0d91:1fb9:c137:0000:0000:0703:afae"],
    [6,"2600::5db:a28:0:0","ff02::1:ff00:0"],
    [4,"6e8a.4630.0974","6c8a:46ff:fe30:974"],
    [6,"fe80::5873:28c9:af24:82d9","ff02::1:ff24:82d9"],
    [4,"dad0.7f03.d7c2","d8d0:7fff:fe03:d7c2"],
    [7,"2001:0:3b45:80c5:0:a279:dd6:1606",56,"2001:0:3b45:8000::"],
    [3,"ff02::1","mc"],
    [1,"fe80:0afb:0000:0000:0000:0000:0bd6:00ea","fe80:afb::bd6:ea"],
    [2,"3fff:5d06::21fe:0:bdf3:cd6","3fff:5d06:0000:0000:21fe:0000:bdf3:0cd6"],
    [3,"fd06:3e6::aa9:652:c1ae:33ce","ula"],
    [1,"fd12:0104:17a9:0209:0000:0000:0000:85d4","fd12:104:17a9:209::85d4"],
    [6,"2600:68a9:aa3:8fd3::18ce","ff02::1:ff00:18ce"],
    [6,"3fff:bf1:342::f5f:e72:a148","ff02::1:ff72:a148"],
    [7,"2001:0:ab3f:4b19:fd8:633:0:466c",48,"2001:0:ab3f::"],
    [7,"3fff:4b34:f71b:cd1d:98f:0:9c72:aafd",64,"3fff:4b34:f71b:cd1d::"],
    [1,"3fff:05b0:0000:0000:0000:0294:cf76:04e2","3fff:5b0::294:cf76:4e2"],
    [3,"2a00:e0::5001:5b50:5d2c:b44","gua"],
    [2,"2600::79c:9177:1203","2600:0000:0000:0000:0000:079c:9177:1203"],
    [2,"fdd2:8fa::28fb:6164:0:0","fdd2:08fa:0000:0000:28fb:6164:0000:0000"],
    [2,"2001:d853:bf68::221:f03","2001:d853:bf68:0000:0000:0000:0221:0f03"],
    [7,"2001:3e26:c97d:0:fc7:5f1:a7a0:54ba",60,"2001:3e26:c97d::"],
    [3,"ff02::2","mc"],
    [1,"2001:7929:694a:0000:0000:0ca4:2238:0000","2001:7929:694a::ca4:2238:0"],
    [3,"::1","lo"],
    [3,"ff02::a","mc"],
    [6,"2001::9832:5a0:0","ff02::1:ffa0:0"],
    [5,"54:ff:f3:ae:3b:ed","2001:db8:6:918::/64","2001:db8:6:918:56ff:f3ff:feae:3bed"],
    [4,"20a7.a97f.8ec6","22a7:a9ff:fe7f:8ec6"],
    [2,"2600::e20:b15","2600:0000:0000:0000:0000:0000:0e20:0b15"],
    [3,"2001:0:90b9::7f8","gua"],
    [2,"fd9c::455:27e:b211:edb0:a477","fd9c:0000:0000:0455:027e:b211:edb0:a477"],
    [4,"1c:ac:e4:d1:53:8f","1eac:e4ff:fed1:538f"],
    [1,"fe80:2ca8:90e6:0000:0000:98b6:0033:5881","fe80:2ca8:90e6::98b6:33:5881"],
    [6,"fe80::8df:0:b71","ff02::1:ff00:b71"],
    [7,"3fff:da6:d5b:d691:0:cfa:0:caf",48,"3fff:da6:d5b::"],
    [1,"2001:0000:0dcd:0000:0000:0000:85e7:0253","2001:0:dcd::85e7:253"],
    [7,"2600:b357:2b2:a2d:9254:3af2:3507:cf00",48,"2600:b357:2b2::"]
  ];

  var TYPE_NAMES = {
    gua: "global unicast", ll: "link-local", ula: "unique local",
    mc: "multicast", lo: "loopback", un: "unspecified"
  };
  var TYPE_ACCEPT = {
    gua: ["globalunicast", "global", "gua", "globalunicastaddress", "aggregatableglobal"],
    ll: ["linklocal", "lla", "linklocaladdress", "linklocalunicast"],
    ula: ["uniquelocal", "ula", "uniquelocaladdress", "uniquelocalunicast"],
    mc: ["multicast", "multicastaddress"],
    lo: ["loopback", "loopbackaddress"],
    un: ["unspecified", "unspecifiedaddress"]
  };

  function txt(s) { return { c: 0, s: s }; }
  function chip(s) { return { c: 1, s: s }; }

  function question(row) {
    switch (row[0]) {
      case 1: return [txt("Write "), chip(row[1]),
                      txt(" in its correct compressed (abbreviated) form:")];
      case 2: return [txt("Write "), chip(row[1]),
                      txt(" out in full, all eight groups:")];
      case 3: return [txt("What type of IPv6 address is "), chip(row[1]), txt("?")];
      case 4: return [txt("Using EUI-64, what interface ID does the MAC address "),
                      chip(row[1]), txt(" produce?")];
      case 5: return [txt("A host on the network "), chip(row[2]),
                      txt(" builds its address with EUI-64 from the MAC "),
                      chip(row[1]), txt(". What is its full IPv6 address?")];
      case 6: return [txt("What is the solicited-node multicast address for "),
                      chip(row[1]), txt("?")];
      default: return [txt("What is the /" + row[2] + " prefix that the address "),
                       chip(row[1]), txt(" belongs to?")];
    }
  }

  function hint(row) {
    switch (row[0]) {
      case 1: return "e.g. 2001:db8::12:1";
      case 2: return "eight groups, no ::";
      case 3: return "e.g. link-local";
      case 4: return "e.g. 0214:22ff:fe01:2345";
      case 5: return "any valid form works";
      case 6: return "e.g. ff02::1:ff00:1";
      default: return "e.g. 2001:db8:12::/48";
    }
  }

  /* ---- parsing ------------------------------------------------------- */

  /* any valid v6 spelling -> array of 8 group values, else null */
  function parseV6(s) {
    s = s.toLowerCase();
    if (s.indexOf(".") !== -1) { return null; }
    var halves = s.split("::");
    if (halves.length > 2) { return null; }
    function side(str) {
      if (str === "") { return []; }
      var parts = str.split(":");
      for (var i = 0; i < parts.length; i++) {
        if (!/^[0-9a-f]{1,4}$/.test(parts[i])) { return null; }
      }
      return parts;
    }
    var left = side(halves[0]);
    if (left === null) { return null; }
    var g = [], i;
    if (halves.length === 2) {
      var right = side(halves[1]);
      if (right === null || left.length + right.length > 7) { return null; }
      for (i = 0; i < left.length; i++) { g.push(parseInt(left[i], 16)); }
      for (i = left.length + right.length; i < 8; i++) { g.push(0); }
      for (i = 0; i < right.length; i++) { g.push(parseInt(right[i], 16)); }
    } else {
      if (left.length !== 8) { return null; }
      for (i = 0; i < 8; i++) { g.push(parseInt(left[i], 16)); }
    }
    return g;
  }

  function sameAddr(input, canonical) {
    var a = parseV6(input), b = parseV6(canonical);
    if (!a || !b) { return false; }
    for (var i = 0; i < 8; i++) { if (a[i] !== b[i]) { return false; } }
    return true;
  }

  function squash(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function check(row, raw) {
    var s = raw.replace(/[.,;\s]+$/, "");
    switch (row[0]) {
      case 1: /* must be THE canonical compressed form */
        return s.toLowerCase() === row[2];
      case 2: /* eight explicit groups, leading zeros optional, no :: */
        if (s.indexOf("::") !== -1) { return false; }
        return sameAddr(s, row[2]);
      case 3: {
        var q = squash(s.replace(/\baddress\b/gi, ""));
        var ok = TYPE_ACCEPT[row[2]];
        for (var i = 0; i < ok.length; i++) { if (q === ok[i]) { return true; } }
        return false;
      }
      case 4: { /* 4 groups, leading zeros optional */
        var parts = s.toLowerCase().split(":");
        if (parts.length !== 4) { return false; }
        var want = row[2].split(":");
        for (var j = 0; j < 4; j++) {
          if (!/^[0-9a-f]{1,4}$/.test(parts[j])) { return false; }
          if (parseInt(parts[j], 16) !== parseInt(want[j], 16)) { return false; }
        }
        return true;
      }
      case 5: return sameAddr(s, row[3]);
      case 6: return sameAddr(s, row[2]);
      default: { /* type 7: address part + optional /len */
        var pm = /^(.*?)\s*\/\s*(\d{1,3})$/.exec(s);
        var addr = s, plen = null;
        if (pm) { addr = pm[1]; plen = parseInt(pm[2], 10); }
        if (plen !== null && plen !== row[2]) { return false; }
        return sameAddr(addr, row[3]);
      }
    }
  }

  function answer(row) {
    switch (row[0]) {
      case 1: return [chip(row[2])];
      case 2: return [chip(row[2])];
      case 3: return [txt(TYPE_NAMES[row[2]])];
      case 4: return [chip(row[2])];
      case 5: return [chip(row[3])];
      case 6: return [chip(row[2])];
      default: return [chip(row[3] + "/" + row[2])];
    }
  }

  window.CFQuiz({ data: DATA, question: question, hint: hint, check: check, answer: answer });
})();
