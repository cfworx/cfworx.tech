---
title: "Physical Security"
date: 2025-10-07
description: "Security+ notes: fencing and bollards, surveillance and sensors, access control vestibules, door locks and biometrics, and badge cloning."
draft: false
---

## Perimeter and deterrence

- Fences: define a boundary, deter, delay intruders to buy response time. Best for large perimeters.
- Bollards: sturdy steel/concrete posts against vehicle threats specifically.
- Physical brute force takes four shapes: forcible entry (counter with hardened doors/deadbolts), tampering with devices (counter with redundancy), confronting guards (conflict/self-defense training), vehicle ramming (bollards and reinforced barriers).

## Surveillance

- Four components: video, security guards, lighting, sensors.
- Cameras: motion detection, night vision, facial recognition, PTZ (pan-tilt-zoom to follow an intrusion). Put them at data centers, telecom closets, entrances/exits, and record everything.
- Sensor types: infrared (body heat), pressure (weight on a mat), microwave (pulse reflection off movement), ultrasonic (wave reflection).
- Bypass methods to know: visual obstruction (paint/tape/objects), blinding with light bursts, acoustic jamming, EMI jamming, and plain physical tampering (cutting wires).

## Entry control

- Access control vestibule: double-door, only one open at a time. Stops piggybacking and tailgating.
- Piggybacking vs tailgating: piggybacking has the authorized person's consent (social engineering); tailgating does not (sneaking through behind them).
- Badges use RFID, NFC, or magnetic strips, often with a guard for deterrence, ID checks, and response.

## Locks and biometrics

- Lock progression: traditional padlocks (weak) → basic locks (pickable) → electronic (PIN, wireless NFC/BT/RFID, biometrics). Cipher locks (numbered push-buttons) guard high-security rooms like server rooms.
- Biometric error rates: FAR (false acceptance, lets the wrong person in), FRR (false rejection, blocks the right person), CER (crossover error rate, the balance point where FAR = FRR; lower CER = better system). Raising sensitivity lowers FAR but raises FRR.

## Badge cloning

- Copy RFID/NFC data to a blank card: scan → extract credentials → write to new card → use it.
- Defenses: encryption on the card system, MFA, updated protocols, user education, shielded sleeves, log auditing.
