---
title: "AVD + FSLogix Part 1: Tenant Foundation"
date: 2026-08-27
description: "Part 1 of the AVD lab: a free cloud-only tenant with Azure and M365 trials living together, three users, one group, and the 2026 Entra MFA traps."
draft: false
---

Part 1 of the AVD + FSLogix series. Before the
[break/fix build](/homelab/virtual-desktops/avd-fslogix-break-fix-lab/)
could exist, it needed a foundation: an Azure free account and a
Microsoft 365 Business Premium trial living in one tenant, three users,
one group, and MFA arranged so the admin is protected without strangling
the silent Kerberos auth coming in part 2. Total out of pocket: zero.
This post is the hour that took, told through the surprises.

## The ordering mistake that wasn't fatal

I signed up for the Azure free account first, with a personal Microsoft
account. Azure created a tenant on the spot, named it Default Directory,
and dropped the new subscription into it.

The cleaner order is the reverse. Create the M365 trial tenant first,
then sign up for Azure from inside it, and the subscription is born
where your users will live. Rather than build a second tenant and
transfer the subscription across, I attached the Business Premium trial
to the tenant Azure had already made. That works. Subscription and
licenses end up together either way, which is all part 2 cares about.

Trial first is cleaner. Tenant first is recoverable.

## Bootstrap admin

First account: labadmin, created in Entra and handed Global Admin. Its
first sign-in happened in a separate browser profile, so its session
stays clear of my personal account's cookies, and I registered MFA on
day one. That felt like ceremony at the time. It pays off two sections
from now.

## Trial checkout friction

Four small obstacles sat between me and a working trial, and none of
them said what was actually wrong.

- The billing menu item the documentation points at, Purchase services,
  no longer exists. It became Marketplace in a December 2025 rename, and
  most guides haven't caught up.
- The trial checked out into a second billing account, so Your products
  looked empty after purchase. The licenses weren't missing. The page
  was filtered to the wrong billing account, and the small Change
  billing account control was the entire fix.
- Try now stays grayed out until the billing account has both a payment
  method and a complete sold-to address. It doesn't tell you that. It
  just stays gray.
- Auto-renew arrived set to Off, which is new and welcome. Verify it
  anyway. The expiry date next to it is now the lab's hard teardown
  deadline.

[![Your products showing the Change billing account control and the trial expiring 9/27/2026](/homelab/images/part1-billing-account.png)](/homelab/images/part1-billing-account.png)

## The usage location gotcha

Users created in Entra are born without a usage location, and Microsoft
won't license a user it doesn't have a country for. The assignment fails
with an error that never mentions location. Set the usage location on
the user, then assign the license, and it goes through.

Or sidestep it: create users in the M365 admin center instead, where the
wizard collects the location as part of the flow.

## Users and the group

labuser1 and labuser2, both with the forced password change at first
sign-in turned off. These are throwaway test identities that will get
typed into session hosts over and over, so that's ergonomics, not
negligence.

One security group, AVD-Users, with exactly the two test users in it.
labadmin stays out on purpose. In part 2 that group gates both the app
assignments and the storage permissions, and the admin needs neither by
default.

Entra shows four accounts, not three. The personal Microsoft account
that created the tenant is still a member, unlicensed and unused, a
harmless leftover of the ordering mistake.

[![Entra user list: the personal account that created the tenant plus the three lab identities](/homelab/images/part1-entra-users.png)](/homelab/images/part1-entra-users.png)

## The security defaults swap, 2026 edition

The headline gotcha.

Part 2's storage Kerberos app can't tolerate MFA. The ticket is fetched
silently at logon and there is no UI for a prompt. A fresh tenant
enforces MFA for everyone through security defaults, and security
defaults can't do exclusions, so the plan was the standard swap: turn
security defaults off, then rebuild protection as one Conditional Access
policy requiring MFA for labadmin only. Business Premium includes Entra
P1, so Conditional Access is available.

Entra enforces that order, which I learned by trying to build the
replacement policy first:

[![Failed to create MFA-labadmin: security defaults is enabled in the tenant](/homelab/images/part1-securitydefaults-block.png)](/homelab/images/part1-securitydefaults-block.png)

Fair enough. Defaults off, then. And the 2026 wrinkle arrived in the
same minute the switch flipped: Microsoft auto-deployed four managed
Conditional Access policies into the tenant, every creation timestamp
reading 6:42. One of them, Multifactor authentication for all users,
re-armed the exact trap I had just disarmed. If I hadn't gone looking,
every lab user would have hit an MFA wall the storage auth can't climb,
and nothing would have logged a complaint. I switched that one policy
Off.

[![Conditional Access policy list: four Microsoft-managed policies, one user policy, and the all-users MFA policy set to Off](/homelab/images/part1-ca-policies.png)](/homelab/images/part1-ca-policies.png)

The other three stayed On:

- Block legacy authentication. Nothing in this lab speaks POP, IMAP, or
  any other legacy protocol, so this blocks attack surface and costs
  nothing.
- Multifactor authentication for Azure Management. Only labadmin
  touches the Azure control plane, and labadmin has MFA.
- Multifactor authentication for admins. This is the payoff for
  registering labadmin's MFA on day one: when the policy deployed
  itself, it was a prompt, not a lockout.

None of the three touches an ordinary labuser sign-in, so the silent
Kerberos flow stays clean. My own policy, MFA-labadmin, went in a minute
after the managed ones: one user, all resources, require multifactor
authentication.

[![MFA-labadmin policy details: one user in scope, all resources, require multifactor authentication](/homelab/images/part1-mfa-labadmin-policy.png)](/homelab/images/part1-mfa-labadmin-policy.png)

And the episode earns a new line on part 2's silent-auth-failure
checklist: after disabling security defaults, audit the managed policies
Microsoft deploys in their place, because one of them re-enables MFA for
all users.

## End state

Three users, one group, Entra P1 lit, one custom Conditional Access
policy, 3 of the trial's 25 seats assigned, and nothing spent.
Everything expires with the trials, so the whole lab has a hard
deadline: September 27.

[![Active users: the three lab accounts licensed with Business Premium](/homelab/images/part1-active-users.png)](/homelab/images/part1-active-users.png)

The region for part 2 was also settled here: West Central US, currently
the only US region supporting per-group RBAC for cloud-only Entra
Kerberos, and only on premium file shares. That constraint picked the
region before a single VM existed. The build itself is in
[part 2](/homelab/virtual-desktops/avd-fslogix-break-fix-lab/).
