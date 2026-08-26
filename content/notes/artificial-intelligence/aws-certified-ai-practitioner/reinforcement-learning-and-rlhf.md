---
title: "Reinforcement Learning and RLHF"
date: 2026-02-08
description: "AIF-C01 notes on reinforcement learning: agent, environment, rewards, and policies, plus how RLHF aligns LLMs using human feedback."
draft: false
---

## Reinforcement learning

- An agent learns by acting in an environment to maximize cumulative reward. No labeled dataset; feedback comes from consequences.

| Term | Meaning |
|---|---|
| Agent | the learner/decision maker |
| Environment | the world it acts in |
| Action | a choice the agent makes |
| Reward | feedback for an action |
| State | current situation |
| Policy | the strategy mapping states to actions |

- Loop: observe state → pick action per policy → environment returns new state + reward → update policy. Repeat thousands of simulations, learning from mistakes and successes.
- Maze robot example: -1 per step, -10 for hitting a wall, +100 for the exit. Over many runs the policy converges on efficient navigation.
- Applications: game AI, robotics, portfolio management, treatment plan optimization, autonomous vehicle path planning.

## RLHF

- Reinforcement Learning from Human Feedback: put human judgment inside the reward function so the model aligns with what people actually want. Used across GenAI, notably LLM training. It's the difference between "technically correct" and "sounds human."
- Pipeline for, say, an internal knowledge chatbot:

1. Collect human-written prompts and responses.
2. Supervised fine-tune a base model on internal data; compare its answers to the human ones.
3. Build a separate reward model: humans pick which of two responses they prefer, until the reward model can predict human preference.
4. Run RL with the reward model as the scoring function. This last part runs fully automated.
