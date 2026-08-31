---
title: "A pooled AVD host pool with FSLogix profiles on Azure Files"
date: 2026-08-31
description: "The whole AVD lab build in one post: a free tenant, the 2026 Entra MFA traps, an Azure Files share on Entra Kerberos with no domain controller, and two session hosts that failed to deploy the first time."
draft: false
aliases:
  - "/homelab/domain-infrastructure/avd-fslogix-part-1-tenant-foundation/"
  - "/homelab/domain-infrastructure/avd-fslogix-part-2-storage-kerberos-plumbing/"
  - "/homelab/virtual-desktops/avd-fslogix-part-1-tenant-foundation/"
  - "/homelab/virtual-desktops/avd-fslogix-part-2-storage-kerberos-plumbing/"
  - "/homelab/virtual-desktops/avd-fslogix-part-3-session-hosts/"
  - "/homelab/virtual-desktops/avd-fslogix-break-fix-lab/"
---

This checks off the AVD line in [my lab plan](/homelab/general/lab-plan/):
a pooled Azure Virtual Desktop host pool, two Entra-joined session
hosts, and an Azure Files share for FSLogix profile containers,
authenticated with Microsoft Entra Kerberos and no domain controller
anywhere in the picture. Fully cloud-native: no directory sync, no
Windows file server.

It took three days across a week, it's built entirely on an Azure free
account and an M365 Business Premium trial, and everything expires
with the trials on September 27, so the whole lab has a hard teardown
deadline. This post is the build, all of it, including the vnet I
configured and never actually created.

Where it stands as of this writing: a cloud-only user can sign into a
full Windows 11 desktop on the pool. FSLogix itself isn't configured
yet, so profiles are still local and the Kerberos ticket to the share
is still untested. That part is next.

## Which comes first: the M365 tenant or the Azure account

I signed up for the Azure free account first, with a personal Microsoft
account. Azure created a tenant on the spot, named it Default
Directory, and dropped the new subscription into it.

The cleaner order is the reverse: create the M365 trial tenant first,
then sign up for Azure from inside it, and the subscription is born
where your users will live. Rather than build a second tenant and
transfer the subscription across, I attached the Business Premium trial
to the tenant Azure had already made.

Either way, the subscription and the licenses end up together, which is
what matters later. I'd do trial-tenant-first if I were doing this
again, but this worked fine.

The first real account was labadmin, created in Entra and handed the
Global Administrator role. I did its first sign-in in a separate
browser profile so it wouldn't pick up my personal account's cookies,
and I registered an MFA method for it the same day. That same-day
registration turned out to matter. More on that below.

## Four small problems checking out a free trial

Four things got in the way of a working trial, and not one of them said
what was actually wrong:

1. The billing menu item the documentation points at, Purchase
   services, no longer exists. It became Marketplace in a December 2025
   rename, and most guides haven't caught up.
2. The trial checked out into a *second* billing account, so the Your
   products page looked empty after purchase. The licenses weren't
   missing. The page was filtered to the wrong billing account, and the
   small Change billing account control was the entire fix.
3. The Try now button stayed grayed out until the billing account had
   both a payment method and a complete sold-to address. Nothing on the
   page said that was the reason.
4. Auto-renew arrived set to Off, which is new and welcome, but I
   verified it anyway. The expiry date next to it is the lab's hard
   teardown deadline.

[![Your products showing the Change billing account control and the trial expiring 9/27/2026](/homelab/images/part1-billing-account.png)](/homelab/images/part1-billing-account.png)

## Users, licenses, and the group

The first license assignment failed with an error that never mentions
location. Users created in Entra are born without a usage location, and
Microsoft won't license a user it doesn't have a country for. I set
the usage location on the user, assigned the license again, and it went
through. The other way around this: create users in the M365 admin
center instead, where the wizard collects the location as part of the
flow.

The lab users are labuser1 and labuser2, both with the forced password
change at first sign-in turned *off*. They're throwaway test identities
that will get typed into session hosts over and over, and I didn't want
a password reset landing in the middle of that.

One security group, AVD-Users, with just the two test users in it.
labadmin stayed out on purpose. That group gets the app assignments and
the storage permissions later, and the admin account needs neither.

Entra showed four accounts rather than the three I created. The extra
one was the personal Microsoft account that created the tenant,
unlicensed and unused, left over from signing up for Azure first.

[![Entra user list: the personal account that created the tenant plus the three lab identities](/homelab/images/part1-entra-users.png)](/homelab/images/part1-entra-users.png)

## Security defaults off, and the four policies Microsoft deploys in their place

This is the one that cost me the most time.

The storage Kerberos auth this lab is built around can't handle MFA at
all. The ticket is fetched silently at logon, and there's no UI where a
prompt could appear. But a fresh tenant enforces MFA for everyone
through security defaults, and security defaults can't do exclusions.

So the plan was the standard swap: security defaults off, then a single
Conditional Access policy requiring MFA for labadmin only. Business
Premium includes Entra ID P1, so Conditional Access is available.

Entra enforces that order, which I learned by trying to build the
replacement policy first:

[![Failed to create MFA-labadmin: security defaults is enabled in the tenant](/homelab/images/part1-securitydefaults-block.png)](/homelab/images/part1-securitydefaults-block.png)

Fair enough. I turned security defaults off and went back to build the
policy.

In the same minute the switch flipped, Microsoft auto-deployed four
managed Conditional Access policies into the tenant, every creation
timestamp reading 6:42. One of them is called Multifactor
authentication for all users, and it turns MFA back on for every user.
Which is exactly what I had just turned off.

If I hadn't gone looking, every labuser sign-in would have gotten an
MFA prompt during the silent ticket request, the request would have
failed, and *nothing* would have been logged anywhere. I set that
policy to Off.

[![Conditional Access policy list: four Microsoft-managed policies, one user policy, and the all-users MFA policy set to Off](/homelab/images/part1-ca-policies.png)](/homelab/images/part1-ca-policies.png)

I left the other three on:

- **Block legacy authentication.** Nothing in this lab uses POP, IMAP,
  or anything else legacy, so this costs me nothing and removes some
  attack surface.
- **Multifactor authentication for Azure Management.** labadmin is the
  only account that touches the Azure control plane, and it already has
  MFA registered.
- **Multifactor authentication for admins.** This one would have locked
  labadmin out if I hadn't registered an MFA method on day one. Since I
  had, it just prompted. It didn't survive the lab either: it went Off
  at the storage step below, because managed policies can't exclude the
  storage account app, so it would have MFA-gated labadmin's own
  Kerberos ticket to the profile share.

None of the three touches an ordinary labuser sign-in, so the silent
Kerberos auth is safe. My own policy, MFA-labadmin, went in a minute
after the managed ones: one user, all resources, require multifactor
authentication.

[![MFA-labadmin policy details: one user in scope, all resources, require multifactor authentication](/homelab/images/part1-mfa-labadmin-policy.png)](/homelab/images/part1-mfa-labadmin-policy.png)

This earned the first line on my troubleshooting checklist: after
disabling security defaults, check the managed policies Microsoft
deploys in their place, because one of them re-enables MFA for all
users.

## Global Admin owns nothing in Azure

labadmin ran the whole tenant and couldn't create a resource group.

Entra roles and Azure RBAC are two separate permission systems that
happen to share a sign-in page. Global Admin sits at the top of the
first and means *nothing* in the second, where the only name on the
subscription was the personal account that created it. Entra does have
an elevate access switch for exactly this situation, but the personal
account was right there, so I just used it.

One last errand as the personal account, then: Subscriptions, Access
control (IAM), and labadmin became an Owner. Owner rather than
Contributor, because labadmin later hands storage RBAC roles to
AVD-Users, and Contributor can do everything *except* grant access.

The assignment flow has grown some friction since the guides I learned
from were written. Owner now lives on a separate Privileged
administrator roles tab behind a warning that asks whether a lesser
role would do, and a Conditions step makes you say out loud that the
new owner may assign all roles. Seems reasonable for a role that can
hand out every other role.

[![Add role assignment Conditions tab: allow user to assign all roles, flagged as highly privileged, with a least privilege warning](/homelab/images/part1-owner-conditions.png)](/homelab/images/part1-owner-conditions.png)

While I was still signed in with the account that could see billing, I
put a budget on the subscription: $200 monthly, with alerts at 25 and
50 percent. Auto-renew was already off on the M365 side, so the Azure
subscription is the only place a charge could still show up.

[![Budget alert conditions: an actual cost alert at 25 percent of the 200 dollar monthly budget](/homelab/images/part1-budget-alerts.png)](/homelab/images/part1-budget-alerts.png)

One decision from this first day shapes everything after it: the
region is West Central US, because it's currently the only US region
that supports per-group RBAC for cloud-only Entra Kerberos, and only
on premium file shares.

## The vnet create blade, and the private subnet checkbox

vnet-lab should have been the easiest resource of the day: one address
space, 10.10.0.0/16, one subnet, snet-avd at 10.10.1.0/24, no Bastion,
no firewall, nothing extra. It ended up being the part I fumbled the
most, twice over.

The Address space tab now has *two* tables that both accept CIDR
ranges, and I typed mine into the wrong one. Advertised address
prefixes governs what a VPN gateway advertises to on-prem
networks, which this lab will never have, and the blade kept insisting I
hadn't added an address space. It took me longer than I'd like to admit
to accept that the blade was correct and my /16 was sitting in a field
meant for a VPN gateway.

The real table is up top, and the Add a subnet link floats above the
address space box rather than inside it, so I hunted for it everywhere
except where it was. Somewhere in the retyping my /16 also became
10.9.0.0, which would have worked fine and then contradicted every path
and diagram I wrote afterward. I caught it on the Review + create tab.

[![vnet-lab validation passed: West Central US, 10.10.0.0/16 with snet-avd at 10.10.1.0/24, Bastion and firewall disabled](/homelab/images/part1-vnet-review.png)](/homelab/images/part1-vnet-review.png)

Those were annoyances compared to the checkbox.

Enable private subnet (no default outbound access) arrived *checked*,
because private subnets became the default for new vnets after March
31, 2026. Leave it checked and the session hosts deploy with no
outbound internet at all: Windows can't activate or update, the AVD
agent can't reach the brokering service to register, and the SMB
connection to the profile share fails for the same reason. None of it
errors at deploy time.

Microsoft's answer is a NAT gateway at roughly $32 a month plus data
charges, which I wasn't going to pay for a sandbox that gets torn down
in 30 days, so I unchecked the box and took classic default outbound
instead. It's the wrong answer for production, but this vnet has 30
days to live.

This went on the checklist too: a new 2026 vnet has no outbound access
until you either uncheck that box or pay for a NAT gateway.

[![Add a subnet panel: snet-avd at 10.10.1.0/24, the private subnet checkbox now unchecked, above the note that private subnets became the default after March 31, 2026](/homelab/images/part1-subnet-panel.png)](/homelab/images/part1-subnet-panel.png)

And then, as I only discovered three days later, I never clicked
Create. All that panel work was real, the validation screenshot is
real, and the resource never existed. I switched tabs to write up my
notes and walked away believing rg-avd-lab held a network. That
surfaces again at the host pool step below.

## The storage account, and the ways the blade steers you wrong

The next session was storage: the share the FSLogix profile containers
will live on.

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
pre-selected. Microsoft's June announcement says Entra Kerberos now
works across all the billing models, so v2 probably would have worked.
But I didn't want *probably* in a lab that's already about debugging
auth failures, and v1 is what creates the classic FileStorage account
every doc I was following describes blade for blade, so I switched it
to v1.

After deployment the Overview page showed Account kind FileStorage,
SSD (premium), LRS, westcentralus. One more line there worth noticing:
Default share-level permissions, Disabled. I left it that way.
Assigning RBAC to a specific group instead of falling back to a
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

That went straight onto the silent-auth-failure checklist.

[![The app manifest with kdc_enable_cloud_group_sids in the tags array](/homelab/images/part2-manifest-tag.png)](/homelab/images/part2-manifest-tag.png)

Microsoft's docs warn against editing anything else in this
auto-generated app, and I took the warning seriously: I added the tag
and touched nothing else.

## Excluding the storage app from MFA, and a correction to the MFA plan

The first day arranged MFA so labadmin is protected everywhere and the
lab users nowhere, because the Kerberos ticket for the file share is
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

While I was in there, I realized my day-one reasoning had a hole in it.

I had decided the managed Multifactor authentication for admins policy
could stay On, reasoning that labadmin has MFA registered so the
policy just prompts. What that reasoning missed: managed policies
don't let you edit their target list. That policy can't exclude the
storage app, which means it would MFA-gate labadmin's own Kerberos
ticket to the share: the admin version of the silent temp-profile
failure.

So that policy went Off too, and MFA-labadmin, which carries the
exclusion, took over as labadmin's protection. Any MFA that has to
coexist with Entra Kerberos has to live in a policy *you own*, because
the managed ones can't be exclusion-edited.

The policy list after the switch, with both managed MFA policies Off
and MFA-labadmin doing the work:

[![Conditional Access policies: the managed admins and all-users MFA policies both Off, MFA-labadmin On](/homelab/images/part2-ca-admins-off.png)](/homelab/images/part2-ca-admins-off.png)

## Two permission layers on the share

Permissions on the share come in two independent layers: share-level
Azure RBAC on top, Windows ACLs underneath. Telling those layers apart
is most of the troubleshooting work whenever profile access breaks, so
I laid both down deliberately.

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

Layer 2 is the Windows ACL baseline on the share root, set through the
share's Manage access blade. Three entries:

[![The FSLogix ACL baseline on the share root: CREATOR OWNER on subfolders and files only, AVD-Users on this folder only, labadmin with full control everywhere](/homelab/images/part2-acl-baseline.png)](/homelab/images/part2-acl-baseline.png)

- **CREATOR OWNER**, Modify, subfolders and files only: whoever creates
  a profile folder owns what's inside it.
- **AVD-Users**, Modify, this folder only: users can create their
  profile folder at the root but can't reach into anyone else's.
- **labadmin**, Full control, everywhere: someone has to clean up.

That closed out the storage day: the first resource in the lab that
actually costs money, at about 53 cents a day, and every checkmark on
it still a claim rather than a result, because nothing had fetched a
Kerberos ticket yet. There was no Windows machine to fetch one from.

## The host pool wizard, three years newer than the guides

So the third session built the machines: a pooled host pool, two
Entra-joined session hosts, a desktop app group for labuser1, a
RemoteApp group for labuser2, and one logon to prove the identity
stack holds. It took two deployments, and the first one died on the
exact network trap I wrote a whole section about above.

hp-lab: pooled, breadth-first load balancing, max session limit 2. The
limit is artificially low on purpose. With two hosts and a ceiling of
two, sessions spread across both machines instead of stacking on one,
so the cross-host profile lock scenarios I want to practice against
this lab will happen naturally instead of being staged.

One choice on the Basics tab didn't exist when my plan was written:
Create Session Host Configuration, Yes or No. Yes hands the VM
lifecycle to AVD, which updates hosts from a template you define. No
is the classic mode where you own the machines and AVD just brokers to
them. For a lab whose entire point is power-yanking a host
mid-session, I want to own the machines, so No it was.

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

The fourth default wasn't on this tab at all, and I didn't find it
until the deployment failed.

## None available

The Virtual network dropdown said "None available." My first guesses
were a region mismatch or a stale blade, so I toggled the VM location
away and back, refreshed, and restarted the wizard, none of which
changed anything. Then I opened rg-avd-lab in another tab and it
contained exactly one resource: the storage account.

There was no vnet. This is where the walked-away-without-clicking-
Create mistake from the first day finally showed itself: I had
described a network, validated a network, and screenshotted a network
that was never deployed.

So I built it, for real this time, and deleted the `default` subnet
the blade auto-creates alongside your own. On the Add a subnet panel I
unchecked Enable private subnet (no default outbound access), because
after March 31, 2026 that box arrives checked, and a checked box means
no outbound Internet for anything in the subnet. This is the exact trap
I'd written a section about above, I knew to look for it, and I have
the screenshot showing it unchecked before I clicked Create.

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
the panel before creation showed it unchecked, the subnet after
creation had it enabled, and the only setting that matters is the one
on the deployed subnet.

The fix was unremarkable: uncheck it on the live subnet, save, delete
both VMs, and add two new ones from the host pool's Session hosts
blade. The second deployment finished in about 10 minutes with every
extension green. (Yes, a NAT gateway is the production answer. It's
also about $32 a month plus data, and this lab has a September 27
expiry date.)

Then the resource group showed four OS disks for two VMs. When I
deleted the first pair of hosts I didn't tick the boxes to delete
their disks with them, and unattached Standard SSD disks bill about
$10 a month each just for existing, so I deleted those by hand too.

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
into one of them, which proves the Entra join, the Virtual Machine
User Login role, the RDP property, and the broker all work.

What it does not prove is anything on the storage side. FSLogix isn't
configured yet, so that first logon built a local profile and never
touched the share. The share, the RBAC, the ACL baseline, the manifest
tag, the MFA exclusion: all of it is still untested until a session
host actually fetches a Kerberos ticket.

That's the next session on this lab: FSLogix registry settings on both
hosts, the first VHDX landing on the share, and labuser2's RemoteApp
view. After that I want to start breaking the permission layers on
purpose and practicing the fixes, which is what the two-layer design
and the low session limit were for all along.

Next time I'll also check the subnet's private-subnet property on the
deployed subnet instead of trusting the create panel, which would have
saved the first deployment and about 40 minutes of my evening.

The VMs are deallocated tonight, since at $4.60 a day for the pair I'm
not paying for them to sit idle while I write.
