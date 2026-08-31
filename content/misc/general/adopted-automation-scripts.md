---
title: "I scripted away our 20-minute imaging checklist"
date: 2026-08-30
description: "The PowerShell script that replaced our by-hand post-imaging setup, and the remediation-script habit that grew out of it."
draft: false
---

When I first got to my job, every freshly imaged machine ended with
the same twenty minutes of hand work. Battery and power settings,
driver downloads, a GPU update, a system file check. Same steps, every
machine, done by a person.

Twenty minutes doesn't sound like much. Now run it against every
machine that gets imaged, all year. That's hundreds of hours of a
tech's time going to a checklist a computer could run.

So I wrote a
[PowerShell](https://learn.microsoft.com/en-us/powershell/) script
that runs the whole list: configures the battery settings, pulls down
the drivers the machine needs, runs the GPU update, then finishes with
the system file check. The things people were doing by hand now just
*run*.

Handing a .ps1 file to a busy tech is a good way to get it ignored,
so I ran it through
[ps2exe](https://github.com/MScholtes/PS2EXE) and made it an
executable the other techs could just double-click.

It didn't stay mine for long. Other techs picked it up, and eventually
it was adopted across the organization, which multiplied one machine's
twenty minutes into hundreds of hours the organization got back.

Imaging was only the start. Most of what I write now is remediation
scripts: the vulnerability scanner hands me the list of affected
machines, and when a fix exists, I turn it into a script.

Rollout is by
[deployment rings](https://www.hexnode.com/blogs/staged-patch-rollouts-canary-pilot-production-rings/):
one machine, then two, then four, then eight, doubling until the batch
is done. Each ring has to come back clean before the next one runs,
and that first machine is the canary.

If the canary falls over, I lost a few minutes on one machine instead
of a bad afternoon on the whole fleet.
