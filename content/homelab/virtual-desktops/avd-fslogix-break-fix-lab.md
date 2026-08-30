---
title: "AVD + FSLogix break/fix lab: it's always one of two error codes"
date: 2026-08-27
description: "Built a pooled Azure Virtual Desktop host pool with FSLogix profiles on Azure Files, then broke the permissions on purpose and fixed every failure mode."
draft: false
weight: 4
---

<!-- screenshot: architecture overview or portal resource group view -->

This checks off the AVD line in [my lab plan](/homelab/general/lab-plan/):
a pooled Azure Virtual Desktop host pool delivering both a full desktop
and RemoteApps, with FSLogix profile containers on an Azure Files
share, built from scratch.

Building it was only half the point. The other half was deliberately
misconfiguring the permissions at each layer to watch how it fails
(access denied, temp profiles, locked VHDX files), and practicing
fixing each one the way I'd have to on a real ticket. The tenant,
users, and MFA groundwork under all of this is
[part 1](/homelab/virtual-desktops/avd-fslogix-part-1-tenant-foundation/).

## Architecture

Fully cloud-native. No domain controller, no directory sync, no
Windows file server.

Azure Files supports Microsoft Entra Kerberos with cloud-only
identities for SMB now, and it's built for exactly this scenario:
cloud-only users on Entra-joined session hosts, with their FSLogix
profiles on an Azure Files share.

```text
Entra ID tenant
├── labadmin (Global Admin)
├── labuser1, labuser2 → group: AVD-Users
│
Azure subscription
└── rg-avd-lab
    ├── vnet-lab (10.10.0.0/16) / snet-avd (10.10.1.0/24)
    ├── stavdlab#### (FileStorage, Premium LRS)
    │     └── share: profiles, auth via Entra Kerberos
    ├── Host pool: hp-lab (Pooled, breadth-first, max 2 sessions/host)
    │     ├── avd-sh-01 (D2s_v3, Win11 multi-session 24H2, Entra-joined)
    │     ├── avd-sh-02 (D2s_v3, Win11 multi-session 24H2, Entra-joined)
    │     ├── Desktop app group: hp-lab-DAG → labuser1
    │     └── RemoteApp app group: hp-lab-RAG → labuser2
    └── Workspace: ws-lab
```

Two decisions shaped everything else. Breadth-first load balancing
with an artificially low max session limit of 2, so sessions spread
across both hosts. I *wanted* cross-host profile lock scenarios to
happen naturally. And one Desktop app group plus one RemoteApp group
on the same pool with non-overlapping assignments, so I could see both
delivery models and play with the pool's preferred application group
type setting.

## Identity groundwork

Three lab users (labadmin, labuser1, labuser2) and a security group
AVD-Users holding the two test users.

Then the piece that would have been an afternoon of debugging if I'd
missed it. A fresh tenant ships with security defaults on, which force
MFA for everyone, and Entra Kerberos for Azure Files does not support
MFA on the storage account's app registration, because the Kerberos
ticket is retrieved silently at logon and there's no UI for a step-up
prompt. Security defaults can't do exclusions, so I disabled them and
rebuilt protection with Conditional Access instead: MFA required for
labadmin, lab users left out.

Miss this and there's no error anywhere to find, just users landing on
temp profiles while the cause sits in a Conditional Access policy they
can't see.

## Storage and the two-layer permission model

Storage account: FileStorage kind, Premium LRS (the documented tier
for the Entra-only FSLogix scenario), with a `profiles` file share.
The full storage build, blade for blade, is in
[part 2](/homelab/virtual-desktops/avd-fslogix-part-2-storage-kerberos-plumbing/).
Enabling Microsoft Entra Kerberos under identity-based access
registers an Entra app for the storage account, and then there are two
follow-ups that are easy to miss:

- Exclude that app from any MFA Conditional Access policy (see above).
- Add `kdc_enable_cloud_group_sids` to the tags array in the app
  registration manifest. Mandatory for cloud-only identities: without
  it, the Kerberos ticket only carries on-prem group SIDs, so ACLs
  granted to a cloud-only group like AVD-Users never evaluate.

Permissions on the share are two independent layers, and knowing
*which* layer is failing is most of the troubleshooting battle.

Layer 1, share-level (Azure RBAC):

| Principal | Role |
|---|---|
| AVD-Users | Storage File Data SMB Share Contributor |
| labadmin | Storage File Data SMB Share Elevated Contributor |

Layer 2, directory/file-level (Windows ACLs), the FSLogix baseline on
the share root:

| Principal | Permission | Applies to |
|---|---|---|
| CREATOR OWNER | Modify | Subfolders and files only |
| AVD-Users | Modify | This folder only |
| labadmin / Administrators | Full control | This folder, subfolders and files |

This baseline is what lets each user create their own profile folder
without being able to touch anyone else's.

<!-- screenshot: share ACLs / Manage access tab -->

## Host pool, app groups, session hosts

- Host pool hp-lab: Pooled, breadth-first, max session limit 2.
- Two session hosts from the gallery image Windows 11 Enterprise
  multi-session 24H2 + Microsoft 365 Apps. The 24H2 build is a hard
  requirement of the cloud-only Entra Kerberos method.
- Standard_D2s_v3, Standard SSD OS disks, no public IPs (connections
  come through the AVD gateway), joined directly to Entra ID.
- Workspace ws-lab with the Desktop app group registered, plus a
  RemoteApp group publishing Notepad, Calculator, Edge, and Word.
- Assignments: hp-lab-DAG → labuser1, hp-lab-RAG → labuser2, preferred
  application group type set to Desktop (only matters if a user is
  ever assigned to both types).

Entra-joined hosts need two extra pieces: the Virtual Machine User
Login RBAC role assigned to AVD-Users at resource group scope, and
`targetisaadjoined:i:1` added to the host pool's RDP properties so I
can connect from a personal device that isn't Entra-joined itself.

Validation: signed in at windows.cloud.microsoft as labuser1 and got
the full desktop; as labuser2 and got RemoteApps only. A RemoteApp
session is still a full session under the hood, so it creates an
FSLogix profile too.

<!-- screenshot: workspace showing desktop + RemoteApps -->

## FSLogix configuration

On both session hosts I verified the FSLogix service was present
(`C:\Program Files\FSLogix\Apps\frxsvc.exe`) and upgraded it to the
latest release in place.

Two registry settings make the Entra-joined + Azure Files combo work
at all:

```text
HKLM\SYSTEM\CurrentControlSet\Control\Lsa\Kerberos\Parameters
  CloudKerberosTicketRetrievalEnabled (DWORD) = 1   ! hosts can get cloud Kerberos tickets

HKLM\SOFTWARE\Policies\Microsoft\AzureADAccount
  LoadCredKeyFromProfile (DWORD) = 1                ! Credential Manager keys roam with the profile
```

Then the profile container settings under
`HKLM\SOFTWARE\FSLogix\Profiles`:

```text
Enabled                              = 1
VHDLocations                         = \\stavdlab####.file.core.windows.net\profiles
VolumeType                           = VHDX
SizeInMBs                            = 5120   ! small lab profiles
IsDynamic                            = 1      ! thin-provisioned
FlipFlopProfileDirectoryName         = 1      ! folders named username_SID, readable
DeleteLocalProfileWhenVHDShouldApply = 1      ! clears stale local copies that block attach
LockedRetryCount                     = 3      ! default is 12; lower so lock failures resolve in seconds
LockedRetryInterval                  = 5      ! seconds between retries
PreventLoginWithFailure              = 0      ! experiment toggle, see below
PreventLoginWithTempProfile          = 0      ! experiment toggle, see below
```

Rebooted both hosts, then baseline validation: signed in as labuser1
and confirmed `Profile_labuser1.vhdx` existed in the user's folder on
the share, frxtray showed green, the Microsoft-FSLogix-Apps/Operational
event log was clean, and the VHDX detached at sign-out. Repeated once
for labuser2 through a RemoteApp.

<!-- screenshot: frxtray green + VHDX on the share -->

## Learning the healthy state first

Before breaking anything, I looked at what healthy looks like. With
labuser1 signed in, from Cloud Shell:

```powershell
Get-AzStorageFileHandle -Context $ctx -ShareName profiles -Recursive |
    Where-Object Path -like "*labuser1*"
```

That open handle on the VHDX *is* the lock. Locked-profile problems
are either a handle that's still open when it shouldn't be, or
permissions stopping FSLogix from opening one at all.

## The break/fix experiments

Each one ran the same loop: break, observe, explain, revert, verify
healthy. Observation points every time: the logon experience, frxtray,
the FSLogix Operational event log, and the profile logs at
`C:\ProgramData\FSLogix\Logs\Profile\`.

### 1. The share-level RBAC break

Dropped AVD-Users from SMB Share Contributor to Reader. Next logon:
Windows lets you in, but FSLogix can't open the
container, logging ERROR_ACCESS_DENIED (0x00000005), and the user
lands on a temp profile. Anything saved there vanishes at sign-out,
which I demonstrated to myself on purpose.

Two patience lessons came with this one. RBAC changes can take 15-30
minutes to propagate, and cached Kerberos tickets mask permission
changes in *both* directions, so it's `klist purge` and a fresh logon
before trusting any result.

Share-level RBAC is evaluated before NTFS, so correct NTFS ACLs don't
help while the share-level role is wrong.

### 2. The root ACL break (new user)

Removed CREATOR OWNER from the share root and dropped AVD-Users to
Read, then treated labuser2 as a brand-new user. Profile directory
creation fails: same 0x00000005, different failing operation in the log
(create vs open). Reverted to the baseline table.

### 3. The single-user ACL break

Disabled inheritance on just labuser1's profile folder and removed
their entry. Attach of an existing VHDX fails at logon and the user
gets a temp profile, which is the classic one-user-broken,
everyone-else-fine ticket shape.

### 4. Failing closed instead of failing to temp

Set PreventLoginWithTempProfile=1 and repeated the ACL break. Instead
of a silent temp profile, the logon is blocked with an error dialog.

That's the tradeoff between the two settings: a temp profile keeps the
user working but hides the data-loss risk from them, while
prevent-login stops the logon so nothing gets silently lost.

<!-- screenshot: temp profile notification or blocked logon dialog -->

### 5. The stale locked VHDX

This is the failure people actually hit in production.

With labuser1 active on avd-sh-01, I power-yanked the host. A portal
Restart is a graceful shutdown and gives FSLogix time to detach
cleanly, so it had to be `az vm stop --skip-shutdown`.

Reconnected
immediately, the broker placed me on avd-sh-02, and FSLogix hit
ERROR_SHARING_VIOLATION (0x00000020) trying to attach a VHDX whose
handle was still held by the dead host. It retried LockedRetryCount
times and dropped to a temp profile.

The fix, the same way I'd do it in production:

```powershell
Get-AzStorageFileHandle -Context $ctx -ShareName profiles -Recursive |
    Where-Object Path -like "*labuser1*"

Close-AzStorageFileHandle -Context $ctx -ShareName profiles `
    -Path "labuser1_<SID>/Profile_labuser1.vhdx" -CloseAll
```

Sign out, sign in, healthy attach.

### 6. The deterministic lock

Handle expiry timing made experiment 5 inconsistent to reproduce, so
this is the on-demand version: from an admin session on the other
host, mount labuser1's VHDX directly with Mount-DiskImage, then have
labuser1 try to sign in. Same 0x20, fully reproducible, and great for
watching the profile log live with `Get-Content -Wait`.
Dismount-DiskImage to revert.

### 7. The anti-experiment

I also wanted to see what happens when the same user connects from a
second device, and the answer is nothing dramatic: the broker just
reconnects you to the existing session. Pooled AVD prevents the same
user double-attaching a profile, which is why real locked-VHDX
incidents are almost always stale handles, not true concurrency.

## The two error codes that matter

Nearly every FSLogix ticket I can imagine getting starts with telling
these two apart in the profile log:

| Code | Meaning | Layer |
|---|---|---|
| 0x00000005 | ERROR_ACCESS_DENIED | permissions (RBAC or NTFS) |
| 0x00000020 | ERROR_SHARING_VIOLATION | locked VHDX (a handle holds it) |

## Troubleshooting toolbox

- **frxtray.exe**: live per-session status and error codes.
- **`C:\ProgramData\FSLogix\Logs\Profile\`**: every attach step, with
  Win32 error codes.
- **Event Viewer, Microsoft-FSLogix-Apps**: the same story in event
  form.
- **`klist`** (as the user): was the cloud Kerberos ticket for the
  storage account issued at all?
- **`Test-NetConnection <acct>.file.core.windows.net -Port 445`**: can
  the host reach the share?
- **Get-/Close-AzStorageFileHandle**: see and clear VHDX locks.

And the silent-auth-failure checklist, for when nothing errors but
nothing works: security defaults disabled? Storage app excluded from
MFA Conditional Access? `kdc_enable_cloud_group_sids` tag in the
manifest? `klist purge` and a fresh logon after every permission
change? Any Microsoft managed Conditional Access policy that
re-enabled MFA for all users after security defaults went off?

## Next steps

Stretch goals I didn't get to this round: FSLogix Cloud Cache instead
of a single VHDLocations target, delivering the FSLogix settings
through the Intune settings catalog instead of raw registry, an
autoscaling plan, and redeploying the hosts from a custom image with
FSLogix pre-configured.

All of it is bounded by the trial clock either way: the whole lab
tears down with the trials on September 27, and whatever isn't done by
then didn't make the cut.
