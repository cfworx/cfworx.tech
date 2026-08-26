---
title: "ML Project Phases and Hyperparameters"
date: 2026-02-10
description: "AIF-C01 notes: the ML project lifecycle from business framing to monitoring, exploratory data analysis, hyperparameter tuning, and when not to use ML."
draft: false
---

## The lifecycle

Business problem → ML problem framing → data collection and preparation → feature engineering → model training and tuning → evaluation → testing and deployment → monitoring and debugging → retrain with new data. Loop until business goals are met, then keep looping anyway: requirements and data drift.

- Framing: stakeholders define value, budget, KPIs, and whether ML is even appropriate. Data scientists, engineers, and SMEs together.
- Data processing: centralize, preprocess, visualize, engineer features.
- Exploratory data analysis: graph the data; a correlation matrix shows how linked variables are and hints at which features matter.
- Deployment choices: real time, serverless, asynchronous, batch, on-prem.
- Monitoring: catch performance drops early, debug behavior, retrain on schedule or drift.

## Hyperparameters

- Settings external to the data, fixed before training: they define model structure and learning process.

| Hyperparameter | Effect |
|---|---|
| Learning rate | step size for weight updates; high converges fast but may overshoot, low is precise but slow |
| Batch size | examples per weight update; small = stabler but slower, large = faster but less stable |
| Epochs | passes over the training set; too few underfits, too many overfits |
| Regularization | simplicity vs complexity balance; increase it to fight overfitting |

- Tuning = searching for the best values (grid search, random search, or SageMaker Automatic Model Tuning).

## When NOT to use ML

For deterministic problems where the answer can simply be computed (probability of drawing a blue card from a known deck), write normal code. ML or an LLM gives you an approximation of something you could have had exactly.
