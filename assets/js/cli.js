/* Cisco CLI drills (/tools/cli/). Data + checking only; the quiz flow
   lives in quiz-engine.js. Deck curated from the CCNA 200-301 (v1.1)
   blueprint's "configure and verify" topics.

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
    [1, "End your terminal session on the device.", "logout", ["exit"]],
    [1, "List every command available in the current mode.", "?", []],
    [1, "Run show running-config without leaving configuration mode.", "do show running-config", []],
    [1, "Turn off the --More-- paging for this session.", "terminal length 0", []],
    [1, "Watch syslog and debug messages over your SSH session.", "terminal monitor", []],
    [1, "Show the commands you recently typed.", "show history", []],

    /* ---- filtering show output ---- */
    [1, "Show only the running-config lines that contain the word ospf.", "show running-config | include ospf", ["show running-config | i ospf"]],
    [1, "Show the running config starting from the first vty line.", "show running-config | begin line vty", []],
    [1, "Show every interface block of the running config.", "show running-config | section interface", []],
    [1, "List interface summaries, hiding the ones with no IP address.", "show ip interface brief | exclude unassigned", []],

    /* ---- config management ---- */
    [1, "Display the configuration currently running in RAM.", "show running-config", []],
    [1, "Display the saved configuration in NVRAM.", "show startup-config", []],
    [1, "Save the running configuration so it survives a reboot.", "copy running-config startup-config", ["write memory", "write"]],
    [1, "Back up the running config to a TFTP server.", "copy running-config tftp:", []],
    [1, "Restore a config from a TFTP server into the running config.", "copy tftp: running-config", []],
    [1, "Copy a new IOS image from a TFTP server into flash.", "copy tftp: flash:", []],
    [1, "Delete the saved configuration in NVRAM.", "erase startup-config", []],
    [1, "Delete the VLAN database file when factory-resetting a switch.", "delete vlan.dat", ["delete flash:vlan.dat"]],
    [1, "Restart the device.", "reload", []],
    [1, "Show the IOS version, uptime and hardware details.", "show version", []],
    [1, "Show hardware models and serial numbers.", "show inventory", []],
    [1, "List the contents of flash memory.", "show flash", ["dir flash:"]],
    [1, "Display the device's current date and time.", "show clock", []],

    /* ---- basic device setup ---- */
    [1, "Set the device's name to SW1.", "hostname SW1", []],
    [1, "Start a message-of-the-day banner, using # as the delimiting character.", "banner motd #", []],
    [1, "Stop the device from trying DNS lookups on mistyped commands.", "no ip domain-lookup", ["no ip domain lookup"]],
    [1, "Keep console log messages from interrupting what you are typing.", "logging synchronous", []],
    [1, "Stop the console session from ever timing out.", "exec-timeout 0 0", []],
    [1, "Encrypt every plaintext password in the configuration.", "service password-encryption", []],

    /* ---- interfaces & addressing ---- */
    [1, "Enter configuration mode for the port FastEthernet 0/1.", "interface fastethernet 0/1", ["interface fastethernet0/1"]],
    [1, "Configure ports GigabitEthernet 0/1 through 0/2 at the same time.", "interface range gigabitethernet 0/1 - 2", ["interface range gigabitethernet0/1 - 2"]],
    [1, "Assign the address 192.168.1.10 with mask 255.255.255.0 to an interface.", "ip address 192.168.1.10 255.255.255.0", []],
    [1, "Enable an interface that is administratively down.", "no shutdown", []],
    [1, "Administratively disable an interface.", "shutdown", []],
    [1, "Label an interface with the text Uplink.", "description Uplink", []],
    [1, "Force an interface to 100 Mbps.", "speed 100", []],
    [1, "Force an interface to full duplex.", "duplex full", []],
    [1, "Let the port auto-detect whether a crossover cable is needed.", "mdix auto", []],
    [1, "List interfaces with their status and descriptions.", "show interfaces description", []],
    [1, "Show switch-port error counters such as CRCs, runts and giants.", "show interfaces counters errors", []],
    [1, "Reset the traffic and error counters on GigabitEthernet 0/1.", "clear counters gigabitethernet 0/1", ["clear counters gigabitethernet0/1"]],
    [1, "Show Layer 3 details for GigabitEthernet 0/0, including any ACLs applied to it.", "show ip interface gigabitethernet 0/0", ["show ip interface gigabitethernet0/0"]],
    [1, "Show a one-line summary of every interface with its IP address and status.", "show ip interface brief", []],
    [1, "Show detailed statistics and error counters for the interfaces.", "show interfaces", []],
    [1, "On a switch, summarize every port's status, speed and duplex.", "show interfaces status", []],
    [1, "Display the ARP table.", "show ip arp", ["show arp"]],

    /* ---- IPv6 ---- */
    [1, "Enable IPv6 routing on a router (it is off by default).", "ipv6 unicast-routing", []],
    [1, "Give an interface the IPv6 address 2001:db8:1::1/64.", "ipv6 address 2001:db8:1::1/64", []],
    [1, "Assign prefix 2001:db8:1::/64 and let the interface build its host bits from its MAC address.", "ipv6 address 2001:db8:1::/64 eui-64", []],
    [1, "Display the IPv6 neighbor table (IPv6's ARP-table equivalent).", "show ipv6 neighbors", []],
    [1, "Display the IPv6 routing table.", "show ipv6 route", []],
    [1, "Show a one-line IPv6 summary of every interface.", "show ipv6 interface brief", []],

    /* ---- VLANs & access ports ---- */
    [1, "Create VLAN 10 and enter its configuration.", "vlan 10", []],
    [1, "Inside VLAN configuration, name the VLAN Sales.", "name Sales", []],
    [1, "Delete VLAN 10.", "no vlan 10", []],
    [1, "Statically make a port an access port (no DTP negotiation of trunking).", "switchport mode access", []],
    [1, "Assign an access port to VLAN 10.", "switchport access vlan 10", []],
    [1, "Set VLAN 20 as the voice VLAN for an attached IP phone.", "switchport voice vlan 20", []],
    [1, "Show full switchport detail for GigabitEthernet 0/1: mode, access and voice VLANs, trunking state.", "show interfaces gigabitethernet 0/1 switchport", ["show interfaces gigabitethernet0/1 switchport"]],
    [1, "Display the switch's MAC address table.", "show mac address-table", ["show mac-address-table"]],
    [1, "Show only the dynamically learned MAC addresses.", "show mac address-table dynamic", []],
    [1, "Clear the dynamically learned MAC addresses.", "clear mac address-table dynamic", []],
    [1, "List the VLANs and which ports belong to each.", "show vlan brief", ["show vlan"]],

    /* ---- trunking / 802.1Q ---- */
    [1, "Force a port to be a trunk.", "switchport mode trunk", []],
    [1, "On a switch that also supports ISL, set the trunk encapsulation to 802.1Q.", "switchport trunk encapsulation dot1q", []],
    [1, "Allow only VLANs 10 and 20 on a trunk.", "switchport trunk allowed vlan 10,20", []],
    [1, "Add VLAN 30 to a trunk's allowed list WITHOUT replacing the existing list.", "switchport trunk allowed vlan add 30", []],
    [1, "Set VLAN 99 as the trunk's native (untagged) VLAN.", "switchport trunk native vlan 99", []],
    [1, "Stop a port from sending DTP negotiation frames.", "switchport nonegotiate", []],
    [1, "Show trunk ports with their native VLAN and allowed VLANs.", "show interfaces trunk", []],

    /* ---- CDP & LLDP ---- */
    [1, "List the directly connected Cisco devices discovered by CDP.", "show cdp neighbors", []],
    [1, "Show CDP neighbors including their IP addresses and IOS versions.", "show cdp neighbors detail", []],
    [1, "Disable CDP on the entire device.", "no cdp run", []],
    [1, "Enable LLDP globally (it is off by default on Cisco gear).", "lldp run", []],
    [1, "List the neighbors discovered via LLDP.", "show lldp neighbors", []],

    /* ---- EtherChannel ---- */
    [1, "Put a port into EtherChannel 1 using LACP, actively negotiating.", "channel-group 1 mode active", []],
    [1, "Put a port into EtherChannel 1 using LACP, waiting for the other side to start.", "channel-group 1 mode passive", []],
    [1, "Put a port into EtherChannel 1 using PAgP, actively negotiating.", "channel-group 1 mode desirable", []],
    [1, "Enter configuration mode for the logical EtherChannel interface 1.", "interface port-channel 1", []],
    [1, "Show EtherChannel bundle state and member-port flags (the go-to verification).", "show etherchannel summary", []],

    /* ---- spanning tree ---- */
    [1, "Set the spanning-tree mode to Rapid PVST+.", "spanning-tree mode rapid-pvst", []],
    [1, "Use the macro that makes this switch the root bridge for VLAN 10.", "spanning-tree vlan 10 root primary", []],
    [1, "Manually set this switch's STP priority for VLAN 10 to 24576.", "spanning-tree vlan 10 priority 24576", []],
    [1, "Let an access port skip the listening and learning states.", "spanning-tree portfast", []],
    [1, "Err-disable this port if a BPDU ever arrives on it.", "spanning-tree bpduguard enable", []],
    [1, "Globally enable BPDU guard on every PortFast port.", "spanning-tree portfast bpduguard default", []],
    [1, "Show spanning-tree status: root bridge, priorities, port roles and states.", "show spanning-tree", []],

    /* ---- routing table & static routes ---- */
    [1, "Display the IPv4 routing table.", "show ip route", []],
    [1, "Show only the OSPF-learned routes.", "show ip route ospf", []],
    [1, "Show exactly which route the router would use to reach 10.2.2.2.", "show ip route 10.2.2.2", []],
    [1, "Enable IPv4 routing on a Layer 3 switch.", "ip routing", []],
    [1, "Add a static route to 192.168.2.0/24 via next hop 10.0.0.2.", "ip route 192.168.2.0 255.255.255.0 10.0.0.2", []],
    [1, "Add a default route (gateway of last resort) via 10.0.0.2.", "ip route 0.0.0.0 0.0.0.0 10.0.0.2", []],
    [1, "Add a backup static route to 192.168.2.0/24 via 172.16.0.2 that only installs if the primary dies, using administrative distance 130.", "ip route 192.168.2.0 255.255.255.0 172.16.0.2 130", []],
    [1, "Add an IPv6 static route to 2001:db8:2::/64 via 2001:db8:12::2.", "ipv6 route 2001:db8:2::/64 2001:db8:12::2", []],
    [1, "Add an IPv6 default route via 2001:db8:12::2.", "ipv6 route ::/0 2001:db8:12::2", []],

    /* ---- inter-VLAN routing ---- */
    [1, "Create subinterface 10 on GigabitEthernet 0/0 for router-on-a-stick.", "interface gigabitethernet 0/0.10", ["interface gigabitethernet0/0.10"]],
    [1, "On a subinterface, tag traffic with VLAN 10 (must come before the IP address).", "encapsulation dot1q 10", []],
    [1, "Turn a switch port into a routed Layer 3 port.", "no switchport", []],
    [1, "Enter configuration mode for the management SVI on VLAN 1.", "interface vlan 1", []],
    [1, "On a Layer 2 switch, set 192.168.1.1 as the default gateway.", "ip default-gateway 192.168.1.1", []],

    /* ---- OSPFv2 ---- */
    [1, "Start OSPF process number 1.", "router ospf 1", []],
    [1, "In OSPF configuration, set the router ID to 1.1.1.1.", "router-id 1.1.1.1", []],
    [1, "In OSPF configuration, activate area 0 on every interface in 10.0.0.0/24 (careful: wildcard mask).", "network 10.0.0.0 0.0.0.255 area 0", []],
    [1, "In OSPF configuration, advertise GigabitEthernet 0/1's subnet but send no hellos out of it.", "passive-interface gigabitethernet 0/1", ["passive-interface gigabitethernet0/1"]],
    [1, "In OSPF configuration, advertise your default route to the other routers.", "default-information originate", []],
    [1, "Keep this interface's router from ever becoming DR or BDR.", "ip ospf priority 0", []],
    [1, "Set the OSPF network type that skips DR/BDR election on a point-to-point link.", "ip ospf network point-to-point", []],
    [1, "Manually set this interface's OSPF cost to 10.", "ip ospf cost 10", []],
    [1, "Set this interface's OSPF hello timer to 10 seconds.", "ip ospf hello-interval 10", []],
    [1, "Restart the OSPF process so a new router ID takes effect.", "clear ip ospf process", []],
    [1, "Show OSPF adjacencies and their states (you want FULL).", "show ip ospf neighbor", []],
    [1, "Show per-interface OSPF details: timers, network type, DR/BDR, cost.", "show ip ospf interface", []],
    [1, "Show the routing-protocol summary: router ID, advertised networks, passive interfaces.", "show ip protocols", []],
    [1, "Watch OSPF adjacency events live.", "debug ip ospf events", []],
    [1, "Stop every running debug.", "undebug all", ["no debug all"]],

    /* ---- HSRP ---- */
    [1, "In HSRP group 1, set the shared virtual gateway address 192.168.1.254.", "standby 1 ip 192.168.1.254", []],
    [1, "In HSRP group 1, set this router's priority to 110 so it wins the active role.", "standby 1 priority 110", []],
    [1, "In HSRP group 1, let this router take the active role back after it recovers.", "standby 1 preempt", []],
    [1, "Show one-line-per-group HSRP status.", "show standby brief", []],

    /* ---- NAT ---- */
    [1, "Mark an interface as the NAT inside interface.", "ip nat inside", []],
    [1, "Mark an interface as the NAT outside interface.", "ip nat outside", []],
    [1, "Statically translate inside host 192.168.1.10 to the public address 203.0.113.10.", "ip nat inside source static 192.168.1.10 203.0.113.10", []],
    [1, "PAT: translate everything ACL 1 matches out interface GigabitEthernet 0/1, sharing that one address.", "ip nat inside source list 1 interface gigabitethernet 0/1 overload", ["ip nat inside source list 1 interface gigabitethernet0/1 overload"]],
    [1, "Show the NAT table with its inside/outside local and global columns.", "show ip nat translations", []],
    [1, "Show NAT hit counts and pool usage.", "show ip nat statistics", []],
    [1, "Flush every entry from the NAT translation table.", "clear ip nat translation *", []],

    /* ---- DHCP ---- */
    [1, "On the client-facing interface, relay DHCP broadcasts to the server at 10.1.1.5.", "ip helper-address 10.1.1.5", []],
    [1, "Make an interface get its own address via DHCP.", "ip address dhcp", []],
    [1, "Keep 192.168.1.1 through 192.168.1.10 from being handed out by the DHCP server.", "ip dhcp excluded-address 192.168.1.1 192.168.1.10", []],
    [1, "Create a DHCP pool named LAN10.", "ip dhcp pool LAN10", []],
    [1, "In a DHCP pool, lease addresses from the 192.168.1.0/24 network.", "network 192.168.1.0 255.255.255.0", []],
    [1, "In a DHCP pool, hand clients 192.168.1.1 as their gateway.", "default-router 192.168.1.1", []],
    [1, "In a DHCP pool, hand clients 8.8.8.8 as their DNS server.", "dns-server 8.8.8.8", []],
    [1, "Show the leases the DHCP server has handed out.", "show ip dhcp binding", []],

    /* ---- NTP ---- */
    [1, "Sync this device's clock to the NTP server at 10.1.1.1.", "ntp server 10.1.1.1", []],
    [1, "Make this device an NTP server at stratum 3.", "ntp master 3", []],
    [1, "Check whether the clock is synchronized and at what stratum.", "show ntp status", []],
    [1, "List NTP peers (the * marks the one you are synced to).", "show ntp associations", []],

    /* ---- syslog & SNMP ---- */
    [1, "Send syslog messages to the server at 10.1.1.100.", "logging 10.1.1.100", ["logging host 10.1.1.100"]],
    [1, "Send only severity 0-4 (warnings and worse) to the syslog server.", "logging trap warnings", ["logging trap 4"]],
    [1, "Timestamp log messages with date and time down to the millisecond.", "service timestamps log datetime msec", []],
    [1, "Show the log buffer and the logging settings.", "show logging", []],
    [1, "Create an SNMPv2c read-only community string named CCNA.", "snmp-server community CCNA ro", []],

    /* ---- device access & passwords ---- */
    [1, "Set the encrypted privileged-mode password to cisco123.", "enable secret cisco123", []],
    [1, "Create the local user admin with encrypted password cisco123.", "username admin secret cisco123", []],
    [1, "Create the local user admin with privilege level 15 and encrypted password cisco123.", "username admin privilege 15 secret cisco123", []],
    [1, "Enter configuration mode for the console port.", "line console 0", []],
    [1, "Enter configuration mode for the first 16 virtual terminal lines.", "line vty 0 15", []],
    [1, "On a line, set the login password to cisco.", "password cisco", []],
    [1, "On a line, make the device check the LINE password at login.", "login", []],
    [1, "On the vty lines, require login with a local username and password.", "login local", []],
    [1, "Show who is logged in and on which lines.", "show users", []],
    [1, "Use ACL 10 to restrict which source addresses may connect to the vty lines.", "access-class 10 in", []],

    /* ---- SSH ---- */
    [1, "Set the domain name example.com (required before generating SSH keys).", "ip domain-name example.com", []],
    [1, "Generate the RSA key pair that SSH needs.", "crypto key generate rsa", []],
    [1, "Allow only SSH version 2 connections.", "ip ssh version 2", []],
    [1, "On the vty lines, allow SSH and refuse Telnet.", "transport input ssh", []],
    [1, "Show the SSH version and settings on this device.", "show ip ssh", []],
    [1, "From this IOS device, SSH to 10.1.1.1 as the user admin.", "ssh -l admin 10.1.1.1", []],

    /* ---- ACLs ---- */
    [1, "Create standard ACL 10 permitting the whole 192.168.1.0/24 network.", "access-list 10 permit 192.168.1.0 0.0.0.255", []],
    [1, "Create extended ACL 100 permitting TCP from 192.168.1.0/24 to host 10.1.1.5 on port 80.", "access-list 100 permit tcp 192.168.1.0 0.0.0.255 host 10.1.1.5 eq 80", []],
    [1, "Create (and enter) a named extended ACL called BLOCK-WEB.", "ip access-list extended BLOCK-WEB", []],
    [1, "Apply ACL 100 inbound on an interface.", "ip access-group 100 in", []],
    [1, "Show every ACL with its per-line match counters.", "show access-lists", []],

    /* ---- port security ---- */
    [1, "Enable port security on an access port (defaults: one MAC, violation shutdown).", "switchport port-security", []],
    [1, "Allow up to 2 MAC addresses on a secured port.", "switchport port-security maximum 2", []],
    [1, "Learn connected MACs automatically and write them into the running config.", "switchport port-security mac-address sticky", []],
    [1, "Set the violation mode that drops bad frames and logs them WITHOUT shutting the port.", "switchport port-security violation restrict", []],
    [1, "Show port-security state and the violation count for GigabitEthernet 0/1.", "show port-security interface gigabitethernet 0/1", ["show port-security interface gigabitethernet0/1"]],
    [1, "Automatically recover ports err-disabled by port-security violations.", "errdisable recovery cause psecure-violation", []],

    /* ---- DHCP snooping & DAI ---- */
    [1, "Enable DHCP snooping globally.", "ip dhcp snooping", []],
    [1, "Enable DHCP snooping on VLAN 10.", "ip dhcp snooping vlan 10", []],
    [1, "Mark the port toward the real DHCP server as trusted.", "ip dhcp snooping trust", []],
    [1, "Show the DHCP snooping MAC/IP/lease binding table.", "show ip dhcp snooping binding", []],
    [1, "Enable Dynamic ARP Inspection on VLAN 10.", "ip arp inspection vlan 10", []],
    [1, "Exempt an uplink port from Dynamic ARP Inspection checks.", "ip arp inspection trust", []],

    /* ---- troubleshooting ---- */
    [1, "Test reachability to 192.168.1.1.", "ping 192.168.1.1", []],
    [1, "Ping 10.0.0.2 sourcing the packets from interface GigabitEthernet 0/0.", "ping 10.0.0.2 source gigabitethernet 0/0", ["ping 10.0.0.2 source gigabitethernet0/0"]],
    [1, "Trace the hop-by-hop path to 10.0.0.2.", "traceroute 10.0.0.2", []],
    [1, "Test from IOS whether TCP port 80 is open on 10.1.1.5.", "telnet 10.1.1.5 80", []],
    [1, "Show CPU usage with the hungriest processes first.", "show processes cpu sorted", []],

    /* ---- which mode is this prompt? ---- */
    [2, "Switch>", "user EXEC", ["userexec", "userexecmode", "user"]],
    [2, "Switch#", "privileged EXEC", ["privilegedexec", "privilegedexecmode", "privexec", "enablemode", "privileged"]],
    [2, "Switch(config)#", "global configuration", ["globalconfiguration", "globalconfigurationmode", "globalconfig", "config"]],
    [2, "Switch(config-if)#", "interface configuration", ["interfaceconfiguration", "interfaceconfigurationmode", "interfaceconfig", "configif", "interface"]],
    [2, "Switch(config-if-range)#", "interface range configuration", ["interfacerangeconfiguration", "interfacerangeconfigurationmode", "interfacerangeconfig", "configifrange", "interfacerange", "ifrange"]],
    [2, "Switch(config-line)#", "line configuration", ["lineconfiguration", "lineconfigurationmode", "lineconfig", "configline", "line"]],
    [2, "Switch(config-vlan)#", "VLAN configuration", ["vlanconfiguration", "vlanconfigurationmode", "vlanconfig", "configvlan", "vlan"]],
    [2, "Router(config-router)#", "router configuration", ["routerconfiguration", "routerconfigurationmode", "routerconfig", "configrouter", "router"]],
    [2, "R1(config-subif)#", "subinterface configuration", ["subinterfaceconfiguration", "subinterfaceconfigurationmode", "subinterfaceconfig", "configsubif", "subif", "subinterface"]],
    [2, "R1(dhcp-config)#", "DHCP pool configuration", ["dhcppoolconfiguration", "dhcppoolconfigurationmode", "dhcppoolconfig", "dhcpconfig", "dhcppool", "dhcp"]]
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
    /* bare words need >=2 letters ("sh", "run"); words with a non-letter
       tail accept a single letter, because "g0/1" is how everyone types
       GigabitEthernet0/1 and the digits disambiguate it anyway */
    var min = w[1] ? 1 : 2;
    if (t[0].length < Math.min(min, w[0].length)) { return false; }
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
