---
title: "AVD + FSLogix part 2: the manifest tag everything hangs on"
date: 2026-08-28
description: "Part 2 of the AVD lab: a premium file share for FSLogix profiles, Entra Kerberos with cloud-only identities, the manifest tag, and MFA round two."
draft: false
---

In [part 1](/homelab/domain-infrastructure/avd-fslogix-part-1-tenant-foundation/)
I built the tenant: three users, one group, MFA on the admin and
nowhere else. This time I built the share every
[break/fix experiment](/homelab/virtual-desktops/avd-fslogix-break-fix-lab/)
later in the series runs against: an Azure Files share for the FSLogix
profile containers, authenticated with Microsoft Entra Kerberos and no
domain controller anywhere in the picture.

Permissions on that share come in two independent layers: share-level
Azure RBAC on top, Windows ACLs underneath. Telling those layers apart
is most of the troubleshooting work later, so they'll get their own
post once both of them exist.

This one covers the storage account, the Kerberos setup, and the
identity errands that make cloud-only auth possible at all.

## The storage account, and the ways the blade steers you wrong

The requirements were strict: FileStorage kind, premium performance,
LRS, in West Central US, because that combination is what supports
per-group RBAC with cloud-only identities. The 2026 create blade offers
several ways to end up with something else.

I reached the blade through a Blob Storage breadcrumb, which mattered
more than it should. Primary service arrived unset, and with
Performance set to Premium the blade uses that field to pick between
three premium account types: block blobs, file shares, page blobs.
Come in on a blob-flavored entry path and it can steer you into a
premium block blob account, which can't host a file share *at
all*, and nothing tells you until the file shares blade comes up empty.

I set Primary service to Azure Files, a Media tier selector appeared,
and I picked SSD (premium).

Then a choice that didn't exist when most of the guides were written:
File share billing, Provisioned v1 or Provisioned v2, with v2
pre-selected.

Would v2 have worked? Probably. Microsoft's June
announcement says Entra Kerberos now works across all the billing
models.

But I didn't want *probably* in a lab that's already about
debugging auth failures, and v1 is what creates the classic FileStorage
account every doc I was following describes blade for blade. So v1 it
was.

After deployment the Overview page showed Account kind FileStorage,
SSD (premium), LRS, westcentralus. One more line there worth noticing:
Default share-level permissions, Disabled.

I left it that way. Assigning RBAC to a specific group instead of falling back to a
default-for-everyone permission is the whole reason this lab is in
West Central US.

## The profiles share, and an RC4 warning that doesn't apply here

The file shares blade is called Classic file shares now, which is the
portal's way of telling v1 users their account type has a successor. I
created the share: profiles, SMB, 100 GiB provisioned.

Premium bills on the provisioned size whether you use it or not, and
100 GiB is the minimum, so that's roughly $16 a month at full price.
That makes an empty share the biggest line item in the whole
lab, bigger than the session hosts, as long as they spend their nights
deallocated.

I skipped backup on the share. Azure Backup creates a Recovery
Services vault behind the scenes, and Recovery Services vaults are a
pain to delete at teardown time.

[![The profiles share properties: 100 GiB provisioned, Premium, backup not configured, identity-based access configured with no domain](/homelab/images/part2-share-properties.png)](/homelab/images/part2-share-properties.png)

Across the top of the blade sat an orange warning: Windows Kerberos
RC4 hardening may affect your Azure Files access, action required,
July 2026 update. It reads urgent. It applies to storage accounts
using on-prem AD DS authentication configured before 2023, whose
tickets can still be RC4, and Entra Kerberos tickets are always
AES-256, so it has nothing to say about this account.

I still read it twice before I was sure I could ignore it.

## Enabling Entra Kerberos, and the two fields that stay empty

Identity-based access on the share offers three identity sources:
on-prem AD DS, Microsoft Entra Domain Services, and Microsoft Entra
Kerberos. Setup under the third one is a single checkbox, and below it
two fields for domain name and domain GUID.

I left both empty. Those exist for *hybrid* identities, where Windows
ACL management needs to know about the on-prem domain, and filling
them in on a cloud-only setup just imports confusion.

Saving does more than flip a setting. It creates an app registration
in Entra named [Storage Account] stavdlab0001.file.core.windows.net,
that app represents the storage account for everything
identity-related, and the next two errands happened on it.

## Admin consent and the manifest tag

The app hides on the All applications tab of App registrations rather
than Owned applications, because no human created it.

Errand one was admin consent. The app requests three Microsoft Graph
delegated permissions (openid, profile, and User.Read), and an admin has
to approve them once for the tenant. One button, Grant admin consent
for Default Directory, three green checkmarks.

Errand two is the one the whole cloud-only scenario depends on, and
it's a single string in a JSON file. The app's manifest has a tags
array, and it needs this in it:

```text
"tags": ["kdc_enable_cloud_group_sids"]
```

Without the tag, the Kerberos tickets this app issues carry only
on-prem group SIDs, and a cloud-only tenant has *none*. Every ACL
granted to AVD-Users then evaluates against a ticket that never
mentions AVD-Users, so access fails, nothing errors, nothing is
logged, and none of it can be seen from inside a session host.

That's the failure shape this whole lab exists to practice on, so it
went straight onto the silent-auth-failure checklist.

[![The app manifest with kdc_enable_cloud_group_sids in the tags array](/homelab/images/part2-manifest-tag.png)](/homelab/images/part2-manifest-tag.png)

Microsoft's docs warn against editing anything else in this
auto-generated app, and I took the warning seriously: I added the tag
and touched nothing else.

## Excluding the storage app from MFA, and a correction to part 1

Part 1 arranged MFA so labadmin is protected everywhere and the lab
users nowhere, because the Kerberos ticket for the file share is
fetched silently at logon and there's no UI for a prompt. The storage
app exists now, so I could finally build the exclusion: MFA-labadmin,
Target resources, Exclude, select the storage account app.

That blade has been renamed since the guides were written, to Resources
(formerly cloud apps), but it's the same thing. labadmin keeps MFA on
everything except the one app that can't tolerate it.

Scrolling through the resource picker I also spotted Azure Virtual
Desktop and Azure Virtual Desktop ARM Provider already sitting in the
tenant as enterprise apps. Those service principals are what the
session hosts will talk to, and in a production design they're also
what you'd target to require MFA on AVD sign-ins specifically. I left
them alone for now.

While I was in there, I realized part 1 got something wrong.

I wrote that the managed Multifactor authentication for admins policy
could stay On, reasoning that labadmin has MFA registered so the
policy just prompts. What that reasoning missed: managed policies
don't let you edit their target list. That policy can't exclude the
storage app, which means it would MFA-gate labadmin's own Kerberos
ticket to the share: the admin version of the silent temp-profile
failure.

So that policy has to go Off too, and MFA-labadmin, which carries the
exclusion, takes over as labadmin's protection. Any MFA that has to
coexist with Entra Kerberos has to live in a policy *you own*, because
the managed ones can't be exclusion-edited. Part 1 now has a
correction pointing here.

The policy list after the switch, with both managed MFA policies Off
and MFA-labadmin doing the work:

[![Conditional Access policies: the managed admins and all-users MFA policies both Off, MFA-labadmin On](/homelab/images/part2-ca-admins-off.png)](/homelab/images/part2-ca-admins-off.png)

## Layer 1: share-level RBAC

With the identity plumbing settled, the two permission layers from the
plan went down the same day.

Layer 1 is Azure RBAC on the profiles share itself. The Add role
assignment blade offers four SMB data roles:

[![The four Storage File Data SMB roles in the Add role assignment blade, with Elevated Contributor highlighted](/homelab/images/part2-smb-share-roles.png)](/homelab/images/part2-smb-share-roles.png)

The difference that matters is in the descriptions. Contributor gets
read, write, and delete over SMB. Elevated Contributor adds the right
to *modify NTFS permissions*, which is exactly what an admin laying
down ACL baselines needs and exactly what ordinary users shouldn't
have.

So: Storage File Data SMB Share Contributor for AVD-Users, Elevated
Contributor for labadmin, both scoped to this share only. The result:

[![Role assignments on the profiles share: AVD-Users as SMB Share Contributor, labadmin as Elevated Contributor, both scoped to this resource](/homelab/images/part2-share-rbac-assignments.png)](/homelab/images/part2-share-rbac-assignments.png)

## Layer 2: the ACL baseline

Layer 2 is the Windows ACL baseline on the share root, set through the
share's Manage access blade. Three entries:

[![The FSLogix ACL baseline on the share root: CREATOR OWNER on subfolders and files only, AVD-Users on this folder only, labadmin with full control everywhere](/homelab/images/part2-acl-baseline.png)](/homelab/images/part2-acl-baseline.png)

- **CREATOR OWNER**, Modify, subfolders and files only: whoever creates
  a profile folder owns what's inside it.
- **AVD-Users**, Modify, this folder only: users can create their
  profile folder at the root but can't reach into anyone else's.
- **labadmin**, Full control, everywhere: someone has to clean up.

That combination is the whole FSLogix trick: every user can make their
own container, and nobody can touch a container that isn't theirs.

## Conclusion

Done: the storage account, the profiles share, Entra Kerberos enabled,
admin consent granted, the cloud-group-SIDs tag in the manifest, the
storage app excluded from MFA-labadmin, and both permission layers on
the share. The first resource in the lab that actually costs money is
now running, at about 53 cents a day.

Next up: session hosts, so a profile container can actually land on
this share, and then the
[break/fix experiments](/homelab/virtual-desktops/avd-fslogix-break-fix-lab/)
that tear these two layers apart on purpose. Every one of those
experiments comes down to knowing which layer is failing.

For now, the most expensive thing in the lab is an empty 100 GiB
share that exactly three identities are allowed to touch. 53 cents a
day buys a lot of future debugging.
