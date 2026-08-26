---
title: "Amazon SageMaker"
date: 2026-02-12
description: "AIF-C01 notes on SageMaker: inference options compared, Data Wrangler, Feature Store, Clarify, Ground Truth, governance tools, Pipelines, and JumpStart."
draft: false
---

End-to-end managed ML: collect and prepare data, build and train, deploy and monitor, all in one place. For developers and data scientists building custom models (vs the [pre-trained AI services](/notes/artificial-intelligence/aws-certified-ai-practitioner/aws-managed-ai-services/)).

## Built-in algorithms

Supervised (linear regression/classification, KNN), unsupervised (PCA for dimensionality reduction, K-means, anomaly detection), text (NLP, summarization), image (classification, detection). Plus DeepAR for time-series forecasting (RNN-based).

## Deployment and inference

| Type | Latency | Payload | Best for |
|---|---|---|---|
| Real-time | ms to seconds | up to 25 MB | instant predictions, web/mobile |
| Serverless | ms to seconds, cold starts OK | up to 4 MB | sporadic traffic, no infra |
| Asynchronous | near real time | up to 1 GB, max 1 hour | big payloads, long processing (S3 in/out) |
| Batch transform | minutes to hours | 100 MB per mini-batch | whole datasets at once (S3 in/out) |

- Automatic Model Tuning (AMT): give it an objective metric, it picks hyperparameter ranges, search strategy, and early stopping. Saves money on bad configs.

## The tool zoo (know the one-liners)

| Tool | Job |
|---|---|
| Studio | unified interface for everything below |
| Data Wrangler | prepare/transform data, feature engineering, visual + SQL, data quality |
| Feature Store | central store for ML features, discoverable, reusable |
| Clarify | evaluate/compare FMs, explain predictions, detect bias in data and models |
| Ground Truth | humans label data and grade models, RLHF; Ground Truth Plus = managed labeling |
| Model Cards | document a model: intended use, risk rating, training details |
| Model Dashboard | all models in one portal, flag threshold violations |
| Model Monitor | production quality monitoring with drift alerts |
| Model Registry | version, catalog, approve, and share models |
| Pipelines | CI/CD for ML: automate build, train, test, deploy across steps (Processing, Training, Tuning, AutoML, ClarifyCheck, QualityCheck) |
| Role Manager | define persona-based access (data scientist, MLOps engineer) |
| JumpStart | model hub: pre-trained FMs (Hugging Face, Meta, Stability...) and pre-built solution templates, deployed into SageMaker under your control |
| Canvas | no-code visual ML with AutoML, ready-made models from Rekognition/Comprehend/Textract |
| MLFlow on SageMaker | managed MLFlow tracking servers for experiments |

- Clarify bias notes: detects skew (e.g. data over-representing middle-aged people); fix imbalanced classes with Data Wrangler augmentation. Bias types worth naming: sampling, measurement, observer, confirmation.
- Network isolation mode runs training containers with no outbound internet, not even S3.
