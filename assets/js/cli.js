/* Cisco CLI drills (/tools/cli/). Data + checking only; the quiz flow
   lives in quiz-engine.js.

   Row formats (type code first):
     1  [1, task, canonical-command, [alternate-commands...]]
     2  [2, prompt, mode-name, [accepted-spellings...]]

   Command grading works like IOS abbreviation rules, approximately:
   same number of words, and each typed word must be a prefix (at least
   two letters, or the whole word if it is shorter) of the expected
   word. Numbers, addresses and other non-letter parts must match
   exactly. So "sh run", "int fa0/1" and "no shut" are all accepted,
   and well-known short forms like "conf t" are listed as alternates. */
(function () {
  "use strict";

  var DATA = [
    /* ---- moving around ---- */
    [1, "Move from user EXEC to privileged EXEC mode.", "enable", []],
    [1, "Leave privileged EXEC and drop back to user EXEC.", "disable", []],
    [1, "From privileged EXEC, enter global configuration mode.", "configure terminal", ["conf t"]],
    [1, "Return straight to privileged EXEC from any configuration level.", "end", []],
    [1, "Move up one level, e.g. from interface config back to global config.", "exit", []],
    [1, "List every command available in the current mode.", "?", []],
    [1, "Run show running-config without leaving configuration mode.", "do show running-config", []],

    /* ---- show commands ---- */
    [1, "Display the configuration currently running in RAM.", "show running-config", []],
    [1, "Display the saved configuration in NVRAM.", "show startup-config", []],
    [1, "Show the IOS version, uptime and hardware details.", "show version", []],
    [1, "Show a one-line summary of every interface with its IP address and status.", "show ip interface brief", []],
    [1, "Display the switch's MAC address table.", "show mac address-table", ["show mac-address-table"]],
    [1, "List the VLANs and which ports belong to each.", "show vlan brief", ["show vlan"]],
    [1, "Display the IPv4 routing table.", "show ip route", []],
    [1, "List the directly connected Cisco devices discovered by CDP.", "show cdp neighbors", []],
    [1, "Show detailed statistics and error counters for the interfaces.", "show interfaces", []],
    [1, "On a switch, summarize every port's status, speed and duplex.", "show interfaces status", []],
    [1, "Display the ARP table.", "show ip arp", ["show arp"]],
    [1, "Show a one-line IPv6 summary of every interface.", "show ipv6 interface brief", []],
    [1, "Show the commands you recently typed.", "show history", []],
    [1, "List the contents of flash memory.", "show flash", ["dir flash:"]],
    [1, "Display the device's current date and time.", "show clock", []],

    /* ---- basic configuration ---- */
    [1, "Set the device's name to SW1.", "hostname SW1", []],
    [1, "Set the encrypted privileged-mode password to cisco123.", "enable secret cisco123", []],
    [1, "Enter configuration mode for the console port.", "line console 0", []],
    [1, "Enter configuration mode for the first 16 virtual terminal lines.", "line vty 0 15", []],
    [1, "On a line, set the login password to cisco.", "password cisco", []],
    [1, "On a line, make the device actually check the password at login.", "login", []],
    [1, "Encrypt every plaintext password in the configuration.", "service password-encryption", []],
    [1, "Start a message-of-the-day banner, using # as the delimiting character.", "banner motd #", []],
    [1, "Stop the device from trying DNS lookups on mistyped commands.", "no ip domain-lookup", ["no ip domain lookup"]],
    [1, "Keep console log messages from interrupting what you are typing.", "logging synchronous", []],
    [1, "Stop the console session from ever timing out.", "exec-timeout 0 0", []],

    /* ---- interfaces and addressing ---- */
    [1, "Enter configuration mode for the port FastEthernet 0/1.", "interface fastethernet 0/1", ["interface fastethernet0/1"]],
    [1, "Assign the address 192.168.1.10 with mask 255.255.255.0 to an interface.", "ip address 192.168.1.10 255.255.255.0", []],
    [1, "Enable an interface that is administratively down.", "no shutdown", []],
    [1, "Administratively disable an interface.", "shutdown", []],
    [1, "Label an interface with the text Uplink.", "description Uplink", []],
    [1, "Force an interface to 100 Mbps.", "speed 100", []],
    [1, "Force an interface to full duplex.", "duplex full", []],
    [1, "Enter configuration mode for the management SVI on VLAN 1.", "interface vlan 1", []],
    [1, "On a Layer 2 switch, set 192.168.1.1 as the default gateway.", "ip default-gateway 192.168.1.1", []],

    /* ---- VLANs ---- */
    [1, "Create VLAN 10 and enter its configuration.", "vlan 10", []],
    [1, "Inside VLAN configuration, name the VLAN Sales.", "name Sales", []],

    /* ---- saving, wiping, testing ---- */
    [1, "Save the running configuration so it survives a reboot.", "copy running-config startup-config", ["write memory", "write"]],
    [1, "Delete the saved configuration in NVRAM.", "erase startup-config", []],
    [1, "Restart the device.", "reload", []],
    [1, "Test reachability to 192.168.1.1.", "ping 192.168.1.1", []],

    /* ---- SSH ---- */
    [1, "Allow only SSH version 2 connections.", "ip ssh version 2", []],
    [1, "Generate the RSA key pair that SSH needs.", "crypto key generate rsa", []],
    [1, "Create the local user admin with encrypted password cisco123.", "username admin secret cisco123", []],
    [1, "On the vty lines, allow SSH and refuse Telnet.", "transport input ssh", []],

    /* ---- which mode is this prompt? ---- */
    [2, "Switch>", "user EXEC", ["userexec", "userexecmode", "user"]],
    [2, "Switch#", "privileged EXEC", ["privilegedexec", "privilegedexecmode", "privexec", "enablemode", "privileged"]],
    [2, "Switch(config)#", "global configuration", ["globalconfiguration", "globalconfigurationmode", "globalconfig", "config"]],
    [2, "Switch(config-if)#", "interface configuration", ["interfaceconfiguration", "interfaceconfigurationmode", "interfaceconfig", "configif", "interface"]],
    [2, "Switch(config-line)#", "line configuration", ["lineconfiguration", "lineconfigurationmode", "lineconfig", "configline", "line"]],
    [2, "Switch(config-vlan)#", "VLAN configuration", ["vlanconfiguration", "vlanconfigurationmode", "vlanconfig", "configvlan", "vlan"]],
    [2, "Router(config-router)#", "router configuration", ["routerconfiguration", "routerconfigurationmode", "routerconfig", "configrouter", "router"]]
  ];

  function txt(s) { return { c: 0, s: s }; }
  function chip(s) { return { c: 1, s: s }; }

  function question(row) {
    if (row[0] === 1) { return [txt(row[1])]; }
    return [txt("A device shows the prompt "), chip(row[1]), txt(". Which mode is this?")];
  }

  function hint(row) {
    return row[0] === 1 ? "abbreviations OK, e.g. sh run" : "e.g. global configuration";
  }

  /* ---- IOS-style abbreviated command matching ----------------------- */

  /* one word: letters (and hyphens) up front, everything else after */
  function splitWord(w) {
    var m = /^([a-z-]*)(.*)$/.exec(w);
    return [m[1], m[2]];
  }

  function wordOk(typed, wanted) {
    var t = splitWord(typed), w = splitWord(wanted);
    if (t[1] !== w[1]) { return false; }              /* digits, dots, /, : exact */
    if (w[0] === "") { return t[0] === ""; }
    if (t[0].length < Math.min(2, w[0].length)) { return false; }
    return w[0].indexOf(t[0]) === 0;
  }

  function cmdMatch(input, target) {
    var a = input.toLowerCase().split(/\s+/);
    var b = target.toLowerCase().split(/\s+/);
    if (a.length !== b.length) { return false; }
    for (var i = 0; i < a.length; i++) {
      if (!wordOk(a[i], b[i])) { return false; }
    }
    return true;
  }

  function squash(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function check(row, raw) {
    var s = raw.replace(/\s+/g, " ").replace(/[.,;]+$/, "");
    if (row[0] === 1) {
      if (cmdMatch(s, row[2])) { return true; }
      for (var i = 0; i < row[3].length; i++) {
        if (cmdMatch(s, row[3][i])) { return true; }
      }
      return false;
    }
    var q = squash(s.replace(/\bmode\b/gi, ""));
    if (q === squash(row[2])) { return true; }
    for (var j = 0; j < row[3].length; j++) {
      if (q === row[3][j]) { return true; }
    }
    return false;
  }

  function answer(row) {
    if (row[0] === 1) { return [chip(row[2])]; }
    return [txt(row[2] + " mode")];
  }

  window.CFQuiz({ data: DATA, question: question, hint: hint, check: check, answer: answer });
})();
