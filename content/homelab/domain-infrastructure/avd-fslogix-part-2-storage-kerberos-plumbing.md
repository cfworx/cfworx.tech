---
title: "AVD + FSLogix Part 2: Storage and the Kerberos Plumbing"
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

Permissions on that share come in two independent layers, share-level
Azure RBAC on top and Windows ACLs underneath, and telling those layers
apart is most of the troubleshooting work later. This post covers the
storage account, the Kerberos setup, and the identity work that makes
cloud-only auth possible at all. The permission layers get their own
post once both of them exist.

## Creating the storage account, and the ways the blade steers you wrong

The requirements were strict: FileStorage kind, premium performance,
LRS, in West Central US, because that combination is what supports
per-group RBAC with cloud-only identities. The 2026 create blade offers
several ways to end up with something else.

I reached the blade through a Blob Storage breadcrumb, which mattered
more than it should. Primary service arrived unset, and with
Performance set to Premium the blade uses that field to pick between
three premium account types: block blobs, file shares, page blobs.
Coming in on a blob-flavored entry path it can steer you into a premium
block blob account, which can't host a file share at all, and nothing
tells you until the file shares blade comes up empty. I set Primary
service to Azure Files, a Media tier selector appeared, and I picked
SSD (premium).

Then a choice that didn't exist when most of the guides were written:
File share billing, Provisioned v1 or Provisioned v2, with v2
pre-selected. V2 is the newer model, and Microsoft's June announcement
says Entra Kerberos now works across all the billing models, so it
would probably have worked. I didn't want probably in a lab that's
already about debugging auth failures, and v1 is what creates the
classic FileStorage account that every doc I was following describes
blade for blade, so I went with v1.

After deployment the Overview page showed Account kind FileStorage, SSD
(premium), LRS, westcentralus. One more line there worth noticing:
Default share-level permissions, Disabled. I left it that way.
Assigning RBAC to a specific group instead of falling back to a
default-for-everyone permission is the whole reason this lab is in West
Central US.

## The profiles share, and an RC4 warning that doesn't apply here

The file shares blade is called Classic file shares now, which is the
portal telling v1 users their account type has a successor. I created
the share: profiles, SMB, 100 GiB provisioned. Premium bills on the
provisioned size whether you use it or not, and 100 GiB is the minimum,
so that's roughly $16 a month at full price, the biggest line item in
the whole lab, bigger than the session hosts as long as they spend
their nights deallocated. I skipped backup on the share, because Azure
Backup creates a Recovery Services vault behind the scenes, and
Recovery Services vaults are a pain to delete at teardown time.

[![The profiles share properties: 100 GiB provisioned, Premium, backup not configured, identity-based access configured with no domain](/homelab/images/part2-share-properties.png)](/homelab/images/part2-share-properties.png)

Across the top of the blade sat an orange warning: Windows Kerberos RC4
hardening may affect your Azure Files access, action required, July
2026 update. It reads urgent. It applies to storage accounts using
on-prem AD DS authentication configured before 2023, whose tickets can
still be RC4. Entra Kerberos tickets are always AES-256, so it has
nothing to say about this account. I still read it twice before I was
sure I could ignore it.

## Enabling Entra Kerberos, and the two fields that stay empty

[![Identity-based access on the classic file share: on-prem AD DS, Entra Domain Services, and Entra Kerberos, all before setup](/homelab/images/part2-identity-access.png)](/homelab/images/part2-identity-access.png)

Identity-based access on the share offers three identity sources:
on-prem AD DS, Microsoft Entra Domain Services, and Microsoft Entra
Kerberos. Set up under the third one is a single checkbox, and below it
two fields for domain name and domain GUID, which I left empty. Those
exist for hybrid identities, where Windows ACL management needs to know
about the on-prem domain, and filling them in on a cloud-only setup
just imports confusion.

Saving does more than flip a setting. It creates an app registration in
Entra named [Storage Account] stavdlab0001.file.core.windows.net, that
app represents the storage account for everything identity-related, and
the next two errands happened on it.

## Admin consent and the manifest tag on the storage app

The app hides on the All applications tab of App registrations rather
than Owned applications, because no human created it. Errand one was
admin consent: the app requests three Microsoft Graph delegated
permissions, openid, profile, and User.Read, and an admin has to
approve them once for the tenant. One button, Grant admin consent for
Default Directory, and three green checkmarks.

[![The storage app's API permissions after admin consent: openid, profile, and User.Read all granted for Default Directory](/homelab/images/part2-api-permissions.png)](/homelab/images/part2-api-permissions.png)

Errand two is the one the whole cloud-only scenario depends on, and
it's a single string in a JSON file. The app's manifest has a tags
array, and it needs this in it:

```text
"tags": ["kdc_enable_cloud_group_sids"]
```

Without the tag, the Kerberos tickets this app issues carry only
on-prem group SIDs, and a cloud-only tenant has none. Every ACL granted
to AVD-Users then evaluates against a ticket that never mentions
AVD-Users, so access fails, nothing errors, and nothing is logged, and
none of it can be seen from inside a session host. That's the failure
shape this whole lab exists to practice on, so it went straight onto
the silent-auth-failure checklist.

[![The app manifest with kdc_enable_cloud_group_sids in the tags array](/homelab/images/part2-manifest-tag.png)](/homelab/images/part2-manifest-tag.png)

Microsoft's docs warn against editing anything else in this
auto-generated app, and I took the warning seriously: I added the tag
and touched nothing else.

## Excluding the storage app from MFA, and a correction to part 1

Part 1 arranged MFA so labadmin is protected everywhere and the lab
users nowhere, because the Kerberos ticket for the file share is
fetched silently at logon and there's no UI for a prompt. The storage
app exists now, so I could finally build the exclusion: MFA-labadmin,
Target resources, Exclude, select the storage account app. That blade
has been renamed since the guides were written, Resources (formerly
cloud apps), but it's the same thing. labadmin keeps MFA on everything
except the one app that can't tolerate it.

Scrolling through the resource picker I also spotted Azure Virtual
Desktop and Azure Virtual Desktop ARM Provider already sitting in the
tenant as enterprise apps. Those service principals are what the
session hosts will talk to, and in a production design they're also
what you'd target to require MFA on AVD sign-ins specifically. I left
them alone for now.

While I was in there I realized part 1 got something wrong. I wrote
that the managed Multifactor authentication for admins policy could
stay On, reasoning that labadmin has MFA registered so the policy just
prompts. What that reasoning missed: managed policies don't let you
edit their target list, so that policy can't exclude the storage app,
which means it would MFA-gate labadmin's own Kerberos ticket to the
share, the admin version of the silent temp-profile failure. So that
policy has to go Off too, and MFA-labadmin, which carries the
exclusion, takes over as labadmin's protection. Any MFA that has to
coexist with Entra Kerberos has to live in a policy you own, because
the managed ones can't be exclusion-edited. Part 1 now has a correction
pointing here.

## Where this leaves the phase

Done: the storage account, the profiles share, Entra Kerberos enabled,
admin consent granted, the cloud-group-SIDs tag in the manifest, and
the storage app excluded from MFA-labadmin. The first resource in the
lab that actually costs money is now running, at about 53 cents a day.

Still open, in order: switch the managed admins MFA policy Off, assign
the share-level RBAC that forms permission layer 1 (Storage File Data
SMB Share Contributor for AVD-Users, Elevated Contributor for
labadmin), and then mount the share and lay down the Windows ACL
baseline that forms layer 2. The two-layer model gets its own write-up
once both layers exist, because every break/fix experiment in this
series comes down to telling those two layers apart.
