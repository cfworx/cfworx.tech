---
title: "PowerShell fundamentals"
date: 2026-10-19T06:15:00-07:00
description: "AZ-140 notes on PowerShell basics: verb-noun cmdlets, parameters, remoting and WinRM, piping, help, variables, the ISE, execution policy, and 5.1 vs 7."
draft: false
---

Still the main admin tool across Microsoft's cloud: Azure, Entra,
Exchange Online, Teams, SharePoint, Intune, security and compliance.
This lesson is local-machine basics; connecting to the cloud services
comes later.

## Two PowerShells

The course runs Windows PowerShell 5.1, the one built into Windows.
PowerShell 7 is the newer, separate install, and a few commands
below changed or disappeared there.

|  | Windows PowerShell 5.1 | PowerShell 7 |
| --- | --- | --- |
| Launch with | `powershell` | `pwsh` |
| Comes with Windows | Yes | No, separate install |
| Runs on | Windows only | Windows, macOS, Linux |
| ISE | Yes | No (VS Code instead) |

## Getting in

- Start, search PowerShell (or right-click Start on Windows 10). Run
  as administrator for anything that needs admin rights, which is a
  lot of it.
- From Command Prompt, type `powershell`.
- Console for running commands; the ISE (Integrated Scripting
  Environment, type `ise`) for writing scripts. The ISE shows
  parameters and their valid values as you type. Run Script (F5)
  runs the whole thing, Run Selection (F8) just the highlighted lines.
- The ISE is Windows PowerShell 5.1 only and gets no new features.
  Microsoft's replacement is VS Code with the PowerShell extension,
  which has an ISE mode.

## Verb-noun

Every cmdlet is Verb-Noun:

| Verb | Use |
| --- | --- |
| Get | Show information |
| Set | Change something |
| Remove | Delete |
| Move, Copy | Move or copy |
| Start, Stop | Start or stop (services, processes) |

`Get-Verb` lists all the approved verbs.

Parameters come after a dash. Some cmdlets give useful output with no
parameters; others need parameters before they do anything.

```powershell
Get-Service                    # every service and its status
Stop-Service -Name WSearch     # Windows Search
Start-Service -Name WinRM
Get-Process                    # running processes
```

Console habits:

- Tab completes cmdlet and parameter names; Shift+Tab goes back.
- Up arrow recalls earlier commands.
- `cls` clears the screen (alias for `Clear-Host`).
- No red text usually means it worked. No news is good news.
- A missing required parameter makes PowerShell prompt for it;
  Ctrl+C bails out.

## Remoting and WinRM

WinRM (Windows Remote Management) is the service PowerShell remoting
runs over, and it has to be running on the target machine.
`Enable-PSRemoting` sets it up: starts WinRM and adds the firewall
rule.

```powershell
Enter-PSSession -ComputerName client68    # interactive session on the remote box
Invoke-Command -ComputerName client10, client11 -ScriptBlock { Get-Service }
```

The course also shows `Get-Service -ComputerName client68` and
`Get-Process -ComputerName client10, client11, client12` (a
comma-separated list hits several machines at once). Those built-in
`-ComputerName` parameters don't go through WinRM; they use older
protocols. PowerShell 7 removed `-ComputerName` from the service
cmdlets, and Microsoft's direction is remoting with `Invoke-Command`.

## Piping

`|` sends the output of one cmdlet into the next.

```powershell
Get-EventLog -LogName Security -Newest 10 | Format-List | Out-File C:\securitylog.txt
notepad C:\securitylog.txt
```

- Default output is usually a table, and long values get cut off.
  `Format-List` puts every property on its own line.
- `Out-File` writes the output to a file.
- Reading the Security log needs an admin session.
- `Get-EventLog` is gone in PowerShell 7. The replacement works in
  both: `Get-WinEvent -LogName Security -MaxEvents 10`.

## Help

- `Get-Help Get-EventLog` shows the syntax. The first run offers
  `Update-Help` to download the full help files.
- `Get-Help Get-EventLog -Examples` for just the examples.
- `Get-Help Get-EventLog -Online` opens the Microsoft Learn page.
  Every cmdlet has one, with examples, and searching the cmdlet name
  finds it too. The course prefers those over the built-in help.

## Variables

Variables start with `$`:

```powershell
$ComputerName = "client10"
Get-Process -ComputerName $ComputerName

$num = 1
$numb = 2
$num + $numb    # 3
```

## Scripts and execution policy

- Scripts are `.ps1` files.
- Execution policy controls whether scripts run; commands typed at
  the prompt always work. `Get-ExecutionPolicy` shows the current
  one.
- Defaults: Restricted (no scripts) on Windows 10 and 11,
  RemoteSigned on Windows Server.
- RemoteSigned: local scripts run, downloaded ones need a signature.
  Unrestricted (what the course sets) runs anything, with a warning
  for downloaded scripts.
- `Set-ExecutionPolicy RemoteSigned` changes it for the machine
  (needs admin). Add `-Scope CurrentUser` for just the current
  account, no admin needed.
- It's a safety net against running scripts by accident, not a
  security boundary.
