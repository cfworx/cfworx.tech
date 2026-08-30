---
title: "AVD + FSLogix part 3: the airgapped subnet I warned about got me anyway"
date: 2026-08-30
description: "Part 3 of the AVD lab: the host pool wizard, two session hosts that failed to register, the private-subnet setting that didn't stick, and the first logon."
draft: true
---

[Part 2](/homelab/domain-infrastructure/avd-fslogix-part-2-storage-kerberos-plumbing/)
ended with a confession: every green checkmark on the storage side was
a claim, not a result, because testing a silent Kerberos ticket takes
a Windows machine signed in as a lab user. So this part builds the
machines. A pooled host pool, two Entra-joined session hosts, a
desktop app group for labuser1, a RemoteApp group for labuser2, and
one logon to prove the whole identity stack holds.

It took two deployments. The first one died on the exact network trap
I wrote a whole section about in
[part 1](/homelab/domain-infrastructure/avd-fslogix-part-1-tenant-foundation/).

## The host pool wizard, three years newer than the guides

hp-lab: pooled, breadth-first load balancing, max session limit 2. The
limit is artificially low on purpose. With two hosts and a ceiling of
two, sessions spread across both machines instead of stacking on one,
and the cross-host profile lock scenarios in the
[break/fix post](/homelab/virtual-desktops/avd-fslogix-break-fix-lab/)
happen naturally instead of being staged.

One choice on the Basics tab didn't exist when my plan was written:
Create Session Host Configuration, Yes or No. Yes hands the VM
lifecycle to AVD, which updates hosts from a template you define. No
is the classic mode where you own the machines and AVD just brokers to
them. For a lab whose entire point is power-yanking a host
mid-session, No.

[![The host pool Basics tab: hp-lab in West Central US, pooled, breadth-first, max session limit 2, Session Host Configuration set to No](/homelab/images/part3-hostpool-basics.png)](/homelab/images/part3-hostpool-basics.png)

The Virtual machines tab had four defaults I didn't want, and I caught
three of them before Review + create:

1. Name prefix had quietly become `hp-lab`, so the VMs would have been
   hp-lab-0 and hp-lab-1, the same name as the pool. Fixed to
   `avd-sh`.
2. Domain to join defaulted to Active Directory, with a placeholder
   UPN of vmjoiner@contoso.com sitting there waiting to fail. Flipped
   to Microsoft Entra ID, which makes the AD fields vanish and
   replaces them with one question about Intune (No).
3. Image came up as Windows 11 Enterprise multi-session 25H2 + M365
   Apps, not the 24H2 my plan names. I kept it. The
   [current doc](https://learn.microsoft.com/en-us/azure/storage/files/storage-files-identity-auth-hybrid-identities-enable)
   lists 24H2 and 25H2 both, as long as they carry the March 2026
   cumulative update, and a fresh gallery image does.
4. Size defaulted to Standard_D2as_v5 instead of D2s_v3. Same
   2 vCPU / 8 GiB shape, newer AMD generation, cheaper per hour. Also
   kept.

The fourth default, the one I didn't catch, wasn't on this tab at all.

## None available

The Virtual network dropdown said "None available."

Was it a region mismatch? A stale blade? I toggled the VM location
away and back, refreshed, restarted the wizard. Still nothing. Then I
opened rg-avd-lab in another tab and it contained exactly one
resource: the storage account.

There was no vnet. Three days earlier I'd been on the Add a subnet
panel, unchecked the private-subnet box, and then switched to writing
the part 1 post before ever clicking Create. Part 1 describes vnet-lab
in its end-state section. Part 1 was describing a VNet that did not
exist.

So I built it, for real this time, and deleted the `default` subnet
the blade auto-creates alongside your own. On the Add a subnet panel I
unchecked Enable private subnet (no default outbound access), because
after March 31, 2026 that box arrives checked, and a checked box means
no outbound Internet for anything in the subnet. I know this. I wrote
about it. I have the screenshot showing it unchecked.

## 17 attempts

The wizard saw vnet-lab, validation passed, and the deployment ran for
20 minutes before both hosts failed on the same extension with the
same error:

```text
The DSC Extension failed to execute: Error downloading
https://wvdportalstorageblob.blob.core.windows.net/galleryartifacts/Configuration_1.0.03519.1433.zip
after 17 attempts: Unable to connect to the remote server.
```

[![The failed deployment: both hosts' DSC extensions in Conflict, every VM, NIC, and attestation resource green](/homelab/images/part3-dsc-failed.png)](/homelab/images/part3-dsc-failed.png)

The VMs themselves were fine. Allocated, attested, running. West
Central US had the capacity and my trial's 4 vCPU quota fit two
D2as_v5s exactly. The AVD agent installer just couldn't reach
Microsoft's own blob storage to download its configuration, which is
the signature of a machine with no route to the Internet.

I opened snet-avd in the portal's Edit subnet panel. The
private-subnet box was checked.

Whether the create panel dropped my setting or the blade re-applied
the new default at creation time, I don't know. What I do know is that
the panel before creation showed it unchecked and the subnet after
creation had it enabled, and the only setting that matters is the
second one. The panel lies, or at least it did once.

The fix was unremarkable: uncheck it on the live subnet, save, delete
both VMs, and add two new ones from the host pool's Session hosts
blade. The second deployment finished in about 10 minutes with every
extension green. (Yes, a NAT gateway is the production answer. It's
also about $32 a month plus data, and this lab has a September 27
expiry date.)

Then the resource group showed four OS disks for two VMs. When I
deleted the first pair of hosts I didn't tick the boxes to delete
their disks with them, and unattached Standard SSD disks bill about
$10 a month each just for existing. Those had to go.

## Session hosts, Available

Both hosts, power state Running, health state Available, agent version
1.0.15008.300, zero sessions. Three days of identity, storage, and
network work, and the lab finally had a pulse.

Two things an Entra-joined host needs before any user can connect, and
neither is in the wizard:

- The Virtual Machine User Login role for AVD-Users, assigned at the
  resource group so it covers both VMs. Without it the AVD broker
  happily hands the user to a host that then refuses them at the
  Windows sign-in layer.
- `targetisaadjoined:i:1` appended to the host pool's RDP properties.
  Entra-joined hosts expect the connecting device to be joined or
  registered too, and my personal PC is neither. The default property
  string doesn't include it; I had to add it to the end of the
  Advanced tab's value by hand.

The property string after the edit:

[![The host pool's Advanced RDP properties with targetisaadjoined:i:1 appended to the end of the default string](/homelab/images/part3-rdp-properties.png)](/homelab/images/part3-rdp-properties.png)

App groups next. The wizard had already created hp-lab-DAG and
registered it to the ws-lab workspace, so labuser1 just needed adding
under Assignments. The RemoteApp group I built by hand: hp-lab-rag,
publishing Notepad, Calculator, Microsoft Edge, and Word. The wizard
enumerates those from a running host's Start menu, which is why it
couldn't be done until the hosts were Available.

I went straight from the Applications tab to Create and skipped the
Assignments tab entirely, so labuser2 had to be added from the group's
own Assignments blade afterward. (I also had to reset labuser1's
password on the way to the first logon, because I'd written it down
somewhere clever. The M365 admin center reset lets you set your own
password and skip the forced change at next sign-in; the Entra one
doesn't.)

Then [windows.cloud.microsoft](https://windows.cloud.microsoft/),
signed in as labuser1, one desktop tile under ws-lab:

[![The Windows App devices page as labuser1: the ws-lab workspace with a single SessionDesktop tile](/homelab/images/part3-windows-app.png)](/homelab/images/part3-windows-app.png)

And a full Windows 11 desktop on the other side of it:

[![labuser1's first session: a Windows 11 desktop on avd-sh-0 with the Start menu open](/homelab/images/part3-first-logon.png)](/homelab/images/part3-first-logon.png)

## Conclusion

Bottom line: two session hosts are up and a cloud-only user can sign
into one of them, which retroactively proves the Entra join, the
Virtual Machine User Login role, the RDP property, and the broker all
work. What it does not prove is anything in part 2. FSLogix isn't
configured yet, so that first logon built a local profile and never
touched the share. The Kerberos ticket is still untested.

Check the subnet's private-subnet property after the VNet exists, not
on the panel that creates it. That one line would have saved the first
deployment and about 40 minutes.

Next: labuser2's RemoteApp view, then part 4, where FSLogix gets its
registry settings on both hosts. The
[break/fix post](/homelab/virtual-desktops/avd-fslogix-break-fix-lab/)
already spoils how that ends, but the first VHDX landing on the share
deserves its own write-up.

The VMs are deallocated tonight. At $4.60 a day for the pair, they
don't get to idle while I write.
