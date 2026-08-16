---
title: "Lab plan"
date: 2026-08-16
description: "My homelab roadmap: what I'm building and in what order."
draft: false
---

My running plan for the homelab, in the order I'm working them. Each lab
gets a writeup when it's done.

## Phase 1: Domain Infrastructure

- Windows Server VM: build the AD domain with DC, DNS, DHCP
- Second DC: replication and FSMO roles
- OU structure with sites and departments. Bulk-create users and groups from a CSV with PowerShell
- Group Policy: drive mappings, password policy, USB restrictions, folder redirection, kiosk lockdown GPO
- Certificate Services (internal PKI), join a Linux box to the domain

## Phase 2: Desktop Engineering

- Windows 11 imaging: reference image, deploy with MDT, then Autopilot with Intune
- Intune: enrollment, Win32 app packaging and deployment, compliance policies, BitLocker
- Package an app as .intunewin or MSI transform and deploy it silently
- PowerShell remediation scripts through Intune Proactive Remediations

## Phase 3: Virtual Desktops & Applications

- Hypervisor: Proxmox or Hyper-V
- Azure Virtual Desktop: host pool, FSLogix profile containers, RemoteApp publishing, session host scaling
- On-prem RDS: Connection Broker, Session Host, RemoteApp publishing
- Full desktop vs. published app writeup

## Phase 4: Storage

- TrueNAS or Storage Spaces: build the pools, pull a disk, rebuild
- iSCSI LUNs to the hypervisor, run VMs from network storage
- SMB shares with AD permissions, quotas, shadow copies
- Veeam backups and a restore test

## Phase 5: Networking

- VLANs: management, servers, clients, IoT, guest. Inter-VLAN routing with an L3 switch or router-on-a-stick
- Firewall rules between VLANs with pfSense or OPNsense, plus a site-to-site or client VPN
- Wireshark captures: DHCP handshake, DNS lookups
- Network topology diagram in draw.io
