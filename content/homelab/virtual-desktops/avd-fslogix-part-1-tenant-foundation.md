---
title: "AVD + FSLogix part 1: the MFA policy that turned itself back on"
date: 2026-08-27
description: "Part 1 of the AVD lab: a free tenant with Azure and M365 trials, three users, one group, the 2026 Entra MFA traps, and a vnet with no outbound by default."
draft: false
weight: 1
aliases: ["/homelab/domain-infrastructure/avd-fslogix-part-1-tenant-foundation/"]
---

I'm building an
[AVD + FSLogix break/fix lab](/homelab/virtual-desktops/avd-fslogix-break-fix-lab/),
and before any of that can exist I need a tenant for it to live in.

That means an Azure free account and a Microsoft 365 Business Premium
trial in the *same* tenant, three users, one group, and MFA arranged so
labadmin is protected but the silent Kerberos auth in
[part 2](/homelab/virtual-desktops/avd-fslogix-part-2-storage-kerberos-plumbing/)
never sees a prompt it can't answer. On the Azure side: a subscription
labadmin actually owns, a budget on that subscription, and a small vnet
for the session hosts to land in later.

Total cost: $0. That doesn't mean it went smoothly, so I'm writing down
the surprises, mostly for my own reference.

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
all part 2 cares about. I'd do trial-tenant-first if I were doing this
again, but this worked fine.

## Setting up labadmin

The first real account was labadmin, created in Entra and handed the
Global Administrator role. I did its first sign-in in a separate
browser profile so it wouldn't pick up my personal account's cookies,
and I registered an MFA method for it the same day.

That same-day registration turned out to matter. More on that below.

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

## The usage location gotcha

The first license assignment failed with an error that never mentions
location. Users created in Entra are born without a usage location, and
Microsoft won't license a user it doesn't have a country for.

I set the usage location on the user, assigned the license again, and
it went through. The other way around this: create users in the M365
admin center instead, where the wizard collects the location as part of
the flow.

## Users and the group

labuser1 and labuser2, both with the forced password change at first
sign-in turned *off*. They're throwaway test identities that will get
typed into session hosts over and over, and I didn't want a password
reset landing in the middle of that.

One security group, AVD-Users, with just the two test users in it.
labadmin stayed out on purpose. Later in the series that group gets the
app assignments and the storage permissions, and the admin account
needs neither.

Entra showed four accounts rather than the three I created. The extra
one was the personal Microsoft account that created the tenant,
unlicensed and unused, left over from signing up for Azure first.

[![Entra user list: the personal account that created the tenant plus the three lab identities](/homelab/images/part1-entra-users.png)](/homelab/images/part1-entra-users.png)

## Security defaults off, and the four policies Microsoft deploys in their place

This is the one that cost me the most time.

The storage Kerberos auth in part 2 can't handle MFA at all. The ticket
is fetched silently at logon, and there's no UI where a prompt could
appear. But a fresh tenant enforces MFA for everyone through security
defaults, and security defaults can't do exclusions.

So the plan was the standard swap: security defaults off, then a single Conditional
Access policy requiring MFA for labadmin only. Business Premium
includes Entra ID P1, so Conditional Access is available.

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
  had, it just prompted. Update: this policy later went Off too, in
  [part 2](/homelab/virtual-desktops/avd-fslogix-part-2-storage-kerberos-plumbing/), because managed
  policies can't exclude the storage account app, so it would have
  MFA-gated labadmin's own Kerberos ticket to the profile share.

None of the three touches an ordinary labuser sign-in, so the silent
Kerberos auth is safe. My own policy, MFA-labadmin, went in a minute
after the managed ones: one user, all resources, require multifactor
authentication.

[![MFA-labadmin policy details: one user in scope, all resources, require multifactor authentication](/homelab/images/part1-mfa-labadmin-policy.png)](/homelab/images/part1-mfa-labadmin-policy.png)

This earned a line on the troubleshooting checklist in
[the break/fix post](/homelab/virtual-desktops/avd-fslogix-break-fix-lab/):
after disabling security defaults, check the managed policies Microsoft
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
Contributor, because later in the series labadmin hands storage RBAC
roles to AVD-Users, and Contributor can do everything *except* grant
access.

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

## The vnet create blade, and the private subnet checkbox

vnet-lab should have been the easiest resource of the day: one address
space, 10.10.0.0/16, one subnet, snet-avd at 10.10.1.0/24, no Bastion,
no firewall, nothing extra. It ended up being the part I fumbled the
most.

The Address space tab now has *two* tables that both accept CIDR
ranges, and I typed mine into the wrong one. Advertised address
prefixes governs what a VPN gateway advertises to on-prem
networks, which this lab will never have, and the blade kept insisting I
hadn't added an address space.

It was right. I hadn't.

The real table is up top, and the Add a subnet link floats above the
address space box rather than inside it, so I hunted for it everywhere
except where it was. Somewhere in the retyping my /16 also became
10.9.0.0, which would have worked fine and then contradicted every path
and diagram I wrote afterward. I caught it on the Review + create tab.

[![vnet-lab validation passed: West Central US, 10.10.0.0/16 with snet-avd at 10.10.1.0/24, Bastion and firewall disabled](/homelab/images/part1-vnet-review.png)](/homelab/images/part1-vnet-review.png)

Those were annoyances. The checkbox was the real problem.

Enable private subnet (no default outbound access) arrived *checked*,
because private subnets became the default for new vnets after March
31, 2026. Leave it checked and the session hosts deploy with no
outbound internet at all: Windows can't activate or update, the AVD
agent can't reach the brokering service to register, and the SMB
connection to the profile share fails for the same reason. None of it
errors at deploy time.

Microsoft's answer is a NAT gateway at roughly $32 a month plus data
charges. For a sandbox that gets torn down in 30 days?

I unchecked the
box and took classic default outbound instead. It's the wrong answer for
production, but this vnet has 30 days to live.

This went on the checklist too: a new 2026 vnet has no outbound access
until you either uncheck that box or pay for a NAT gateway.

[![Add a subnet panel: snet-avd at 10.10.1.0/24, the private subnet checkbox now unchecked, above the note that private subnets became the default after March 31, 2026](/homelab/images/part1-subnet-panel.png)](/homelab/images/part1-subnet-panel.png)

## Conclusion

The tenant ended the day with three users, one group, Entra ID P1, one
custom Conditional Access policy, and 3 of the trial's 25 seats
assigned. On the Azure side labadmin owned the subscription, a budget
was watching it, and rg-avd-lab held exactly one resource: vnet-lab,
10.10.0.0/16 with snet-avd at 10.10.1.0/24. (Edit: so I believed. I
configured that whole vnet and never clicked Create. The host pool
wizard in
[part 3](/homelab/virtual-desktops/avd-fslogix-part-3-session-hosts/)
found this resource group with no network in it, and
the private-subnet checkbox got a second shot at me there.) Still $0
spent.

[![Active users: the three lab accounts licensed with Business Premium](/homelab/images/part1-active-users.png)](/homelab/images/part1-active-users.png)

One decision from this session shapes everything after it: the region
is West Central US, because it's currently the only US region that
supports per-group RBAC for cloud-only Entra Kerberos, and only on
premium file shares. The storage account and Kerberos setup are in
[part 2](/homelab/virtual-desktops/avd-fslogix-part-2-storage-kerberos-plumbing/),
and the experiments themselves are in
[the break/fix post](/homelab/virtual-desktops/avd-fslogix-break-fix-lab/).

Everything expires with the trials, so the whole lab has a hard
deadline of September 27.
