/* Ports & protocols drills (/tools/ports/). Data + checking only; the
   quiz flow lives in quiz-engine.js.

   Row formats (type code first):
     1  [1, service, [port, ...]]                      name -> port(s)
     2  [2, port, service, [aliases...], l4]           port -> name
     3  [3, service, "tcp" | "udp" | "both"]           transport
     4  [4, protocol, ip-protocol-number]              IP protocol number
*/
(function () {
  "use strict";

  var DATA = [
    [1,"SNMP",[161]],
    [2,80,"HTTP",["http"],"tcp"],
    [2,514,"Syslog",["syslog"],"udp"],
    [1,"SNMP traps",[162]],
    [1,"RADIUS",[1812,1813]],
    [3,"FTP","tcp"],
    [2,53,"DNS",["dns","domain name system"],"both"],
    [3,"IMAP","tcp"],
    [1,"HTTPS",[443]],
    [1,"NTP",[123]],
    [2,161,"SNMP",["snmp"],"udp"],
    [3,"DHCP","udp"],
    [1,"DHCP",[67,68]],
    [1,"Syslog",[514]],
    [1,"SSH",[22]],
    [4,"OSPF",89],
    [3,"RADIUS","udp"],
    [2,23,"Telnet",["telnet"],"tcp"],
    [1,"TFTP",[69]],
    [4,"TCP",6],
    [3,"NTP","udp"],
    [3,"SNMP","udp"],
    [2,22,"SSH",["ssh","secure shell"],"tcp"],
    [1,"IMAP",[143]],
    [2,123,"NTP",["ntp","network time protocol"],"udp"],
    [3,"POP3","tcp"],
    [3,"TACACS+","tcp"],
    [4,"GRE",47],
    [3,"SMTP","tcp"],
    [1,"TACACS+",[49]],
    [3,"DNS","both"],
    [1,"FTP",[20,21]],
    [3,"HTTPS","tcp"],
    [4,"ICMP",1],
    [2,69,"TFTP",["tftp","trivial ftp","trivial file transfer protocol"],"udp"],
    [2,25,"SMTP",["smtp","simple mail transfer protocol"],"tcp"],
    [1,"POP3",[110]],
    [2,443,"HTTPS",["https","http over tls","http secure"],"tcp"],
    [3,"SSH","tcp"],
    [2,49,"TACACS+",["tacacs","tacacs plus"],"tcp"],
    [1,"DNS",[53]],
    [4,"EIGRP",88],
    [1,"SMTP",[25]],
    [3,"Syslog","udp"],
    [3,"TFTP","udp"],
    [1,"HTTP",[80]],
    [2,110,"POP3",["pop3","pop"],"tcp"],
    [4,"UDP",17],
    [3,"Telnet","tcp"],
    [2,1812,"RADIUS",["radius"],"udp"],
    [1,"Telnet",[23]],
    [2,143,"IMAP",["imap","imap4"],"tcp"],
    [3,"HTTP","tcp"]
  ];

  function txt(s) { return { c: 0, s: s }; }
  function chip(s) { return { c: 1, s: s }; }

  function question(row) {
    switch (row[0]) {
      case 1: return [txt("What port number" + (row[2].length > 1 ? "s do " : " does ")),
                      chip(row[1]), txt(" use?")];
      case 2: {
        var where = row[4] === "both" ? "port " : row[4].toUpperCase() + " port ";
        return [txt("Which service runs on " + where), chip(String(row[1])), txt("?")];
      }
      case 3: return [txt("Does "), chip(row[1]), txt(" run over TCP, UDP, or both?")];
      default: return [txt("What IP protocol number does "), chip(row[1]), txt(" use?")];
    }
  }

  function hint(row) {
    switch (row[0]) {
      case 1: return row[2].length > 1 ? "e.g. 20 and 21" : "e.g. 80";
      case 2: return "e.g. HTTPS";
      case 3: return "TCP, UDP, or both";
      default: return "e.g. 6";
    }
  }

  function squash(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function check(row, raw) {
    var s = raw.replace(/[.,;\s]+$/, "");
    switch (row[0]) {
      case 1: {
        var nums = s.match(/\d+/g);
        if (!nums || nums.length !== row[2].length) { return false; }
        var want = row[2].slice().sort(function (a, b) { return a - b; });
        var got = [];
        for (var i = 0; i < nums.length; i++) { got.push(parseInt(nums[i], 10)); }
        got.sort(function (a, b) { return a - b; });
        for (var j = 0; j < want.length; j++) { if (got[j] !== want[j]) { return false; } }
        return true;
      }
      case 2: {
        var q = squash(s);
        if (q === squash(row[2])) { return true; }
        for (var k = 0; k < row[3].length; k++) { if (q === squash(row[3][k])) { return true; } }
        return false;
      }
      case 3: {
        var v = squash(s);
        var both = (v.indexOf("tcp") !== -1 && v.indexOf("udp") !== -1) || v === "both";
        if (both) { return row[2] === "both"; }
        if (v === "tcp") { return row[2] === "tcp"; }
        if (v === "udp") { return row[2] === "udp"; }
        return false;
      }
      default: {
        var m = /^(\d{1,3})$/.exec(s);
        return !!m && parseInt(m[1], 10) === row[2];
      }
    }
  }

  function joinPorts(ports) {
    var out = [];
    for (var i = 0; i < ports.length; i++) { out.push(String(ports[i])); }
    return out.join(" and ");
  }

  function answer(row) {
    switch (row[0]) {
      case 1: return [txt(joinPorts(row[2]))];
      case 2: return [txt(row[2])];
      case 3: return [txt(row[2] === "both" ? "both (TCP and UDP)" : row[2].toUpperCase())];
      default: return [txt(String(row[2]))];
    }
  }

  window.CFQuiz({ data: DATA, question: question, hint: hint, check: check, answer: answer });
})();
