---
title: "Using PowerShell with Azure AD"
date: 2026-11-03T06:00:00-08:00
description: "AZ-140 notes on managing Entra ID (Azure AD) users and groups from the Az module: finding cmdlets with Get-Command, Get-AzADUser, Get-AzADGroup, and New-AzADUser."
draft: false
---

Anything in the portal can be done in PowerShell, and some newer or
advanced things are command line only for a while. The real reason
is speed and repetition: 50 clicks becomes one line, and one line
can run against 50 resource groups.

Session already signed in with
[Connect-AzAccount](/notes/virtual-desktops/azure/az-140/john-christopher/az-powershell-module/).

## Finding the cmdlet

Don't memorize cmdlet names. Search by verb and noun:

```powershell
Get-Command -Verb Get -Noun *user*
Get-Command -Verb Get -Noun *group*
Get-Command -Verb New -Noun *user*
```

Hundreds of matches come back once Az is installed, from every
module. The Entra ones are in **Az.Resources** with `AzAD` in the
noun.

![Get-Command -Verb get -Noun *user* output, with Get-AzADUser from Az.Resources near the top](/notes/virtual-desktops/azure/az-140/images/get-command-get-user.png)

![Get-Command -Verb get -Noun *group* output, with Get-AzADGroup, Get-AzADGroupMember and Get-AzADGroupOwner from Az.Resources](/notes/virtual-desktops/azure/az-140/images/get-command-get-group.png)

Same cmdlets show up for the other worlds too, which is easy to mix
up:

| Cmdlet | Talks to |
| --- | --- |
| `Get-ADUser` | On-prem AD (ActiveDirectory module) |
| `Get-AzADUser` | Entra ID (Az.Resources) |
| `Get-MgUser` | Entra ID (Microsoft Graph module) |
| `Get-LocalUser` | Local accounts on this machine |

## Users and groups

```powershell
Get-AzADUser                                  # all users
Get-AzADUser -DisplayName "Jane Dobbson"
Get-AzADUser -UserPrincipalName janedobs@division3builds.com
Get-AzADGroup                                 # all groups
Get-AzADGroupMember -GroupDisplayName "<group name>"
```

## Creating a user

![Get-Command -Verb new -Noun *user* output, with New-AzADUser from Az.Resources at the top](/notes/virtual-desktops/azure/az-140/images/get-command-new-user.png)

```powershell
$password = ConvertTo-SecureString -String "<password>" -AsPlainText -Force
New-AzADUser -DisplayName "James Williamson" -Password $password -AccountEnabled $true `
  -MailNickname "jameswilliamson" -UserPrincipalName "jameswilliamson@division3builds.com"
```

- `ConvertTo-SecureString -AsPlainText -Force` turns the typed
  password into a SecureString, which `-Password` requires. `-Force`
  is required with `-AsPlainText`, just confirming it's on purpose.
- Required: `-DisplayName`, `-MailNickname` (the mail alias),
  `-UserPrincipalName`, and a password.
- The UPN's domain has to be a verified domain in the tenant. No
  custom domain yet means `@<tenant>.onmicrosoft.com`; existing users
  in `Get-AzADUser` show which suffix to use.
- `-ForceChangePasswordNextLogin` makes the user pick a new one at
  first sign-in.
- The backtick at the end of a line continues the command on the next
  line.

![New-AzADUser output for James Williamson with the UserPrincipalName jameswilliamson@division3builds.com; the password is blurred](/notes/virtual-desktops/azure/az-140/images/new-azaduser.png)

**Course gotcha that's fixed now**: in the video `-AccountEnabled`
threw "a parameter cannot be found" and got deleted. Current
Az.Resources has it again (`-AccountEnabled $true`, alias
`-EnableAccount`), and it ran fine here. The lesson still holds:
Microsoft changes cmdlets faster than the docs and the videos keep
up, so when an example errors on a parameter, check the cmdlet's page
or `Get-Help New-AzADUser -Parameter *`.

**Plain-text passwords**: a password typed into a command lands in the
PowerShell history file
(`(Get-PSReadLineOption).HistorySavePath`) and in any screenshot.
`$password = Read-Host -AsSecureString` prompts for it instead.

## Check in the portal

Entra admin center → Users: James Williamson is there with
**On-premises sync: No**. Created in the cloud, not synced from AD
like Jane, Jason, and Adam.

![Entra admin center Users list with James Williamson as a cloud-only user next to the synced test users; the real and admin accounts are blurred](/notes/virtual-desktops/azure/az-140/images/entra-users-new-cloud-user.png)

## Az vs Microsoft Graph PowerShell

The `AzAD` cmdlets cover the basics (users, groups, apps, service
principals) because Azure work needs them. For real Entra admin work
(licenses, roles, Conditional Access, authentication methods)
Microsoft's module is **Microsoft Graph PowerShell**: `Connect-MgGraph`,
`Get-MgUser`, `New-MgUser`. Since Az.Resources 5.1 the AzAD cmdlets
call Microsoft Graph underneath anyway (the `#microsoft.graph.user`
in the output).

Where it pays off: a script that reads a CSV and runs `New-AzADUser`
per row creates a whole department in one go.
