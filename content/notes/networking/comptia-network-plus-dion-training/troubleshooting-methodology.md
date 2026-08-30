---
title: "Troubleshooting methodology"
date: 2025-09-10
description: "Network+ notes: the 7-step CompTIA troubleshooting process, OSI-based approaches, escalation tiers, verification, and documentation habits."
draft: false
---

## The seven steps

1. Identify the problem
2. Establish a theory of probable cause
3. Test the theory
4. Establish a plan of action
5. Implement the solution
6. Verify full system functionality
7. Document findings, actions, and outcomes

## Step 1: identify

Question the user: symptoms, error messages, sounds, how long, what
changed, who else is affected, what they already tried.

Back up before touching anything. Restores are your safety net when a
fix goes sideways.

## Steps 2-3: theory and test

Question the obvious, then research: external (Google, DownDetector)
and internal (docs, logs, diagnostics). Physically inspect (fan
noise, drive clicks, burning smell), and reproduce the issue when
possible.

The OSI approaches: top-to-bottom (Layer 7 down), bottom-up (Layer 1
up), or divide and conquer (start mid-stack, then go up or down based
on results). Check with colleagues to avoid repeating what's already
been tried.

Test without changing configs first (is it plugged in?).

Theory confirmed: plan the fix. Not confirmed: new theory. Beyond your
skills or authority: escalate.

Tier 1 is basic, Tier 2 advanced, Tier 3 the SMEs and sysadmins.

## Steps 4-5: plan and implement

The options: repair, replace, or work around. Weigh repair vs
replacement cost, org guidelines, and temporary fixes for critical
outages.

Plan resources, time, cost, and blast radius (rebooting a server
disrupts the whole org; an end-user box doesn't). Get permission per
policy, stick to the plan, and re-authorize any deviation.

## Step 6: verify

Confirm the original problem is gone, replaced parts work, nothing
else broke, disabled software stays disabled, logs look clean, and
software and drivers are current.

Then prevent recurrence: user education and policy enforcement, with
management buy-in.

## Step 7: document

What was wrong, what you did, how to prevent it, in a ticketing
system (Freshdesk, Jira, HelpScout), knowledge base, or FAQ. Document
as you go, not after.

The payoffs: new techs learn from history, trend analysis surfaces
systemic issues (a password-reset trend justified self-service reset
and cut those tickets 90%), and ticket data justifies staffing.
