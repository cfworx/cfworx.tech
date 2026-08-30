---
title: "Responsible AI, governance, and GenAI risks"
date: 2026-02-13
description: "AIF-C01 notes: responsible AI dimensions, GenAI challenges like hallucinations and prompt misuse, compliance, governance strategies, and MLOps."
draft: false
---

## The four words

- **Responsible AI**: transparent, trustworthy systems with risks
  mitigated across the whole lifecycle.
- **Security**: confidentiality, integrity, and availability of data
  and infrastructure.
- **Governance**: policies, guidelines, and oversight so AI adds
  value, manages risk, and stays legal.
- **Compliance**: meeting regulations, especially in healthcare,
  finance, legal.

## Core dimensions of responsible AI

Fairness, explainability, privacy and security, transparency,
veracity and robustness, governance, safety, controllability.

The AWS tools that map to this: Bedrock model evaluation and
Guardrails, SageMaker Clarify (toxicity, bias), Data Wrangler
(rebalance datasets), Model Monitor, A2I human review, plus Role
Manager, Model Cards, and Model Dashboard for governance. AWS AI
Service Cards document each service's intended uses and limitations.

## Interpretability

Interpretability means a human can see why and how a decision was
made. The tradeoff: highly interpretable models (linear regression,
decision trees) perform worse than black boxes (neural networks).

Decision trees split on simple feature rules: easy to read, prone to
overfitting with too many branches. Partial Dependence Plots show one
feature's influence with the others held constant, useful for
explaining black-box models.

Explainability is the softer cousin: explain behavior from inputs and
outputs without opening the box. Sometimes that's enough.

Human-Centered Design for explainable AI designs for amplified
decision-making, unbiased decisions, and human-plus-AI learning.

## GenAI challenges

- **Toxicity**: offensive output. Mitigate with curated training data
  and guardrail models.
- **Hallucinations**: confident nonsense, a side effect of next-word
  sampling. Mitigate by educating users, verifying against sources,
  marking content unverified.
- **Plagiarism and cheating**: essays, applications; detection tech
  is an arms race.
- **Nondeterminism, regulatory and social risk, privacy**: all on the
  challenge list next to the capabilities (adaptability, creativity,
  personalization, scalability).

## Prompt misuse taxonomy

- **Poisoning**: malicious or biased data slipped into training.
- **Prompt injection / hijacking**: instructions embedded in prompts
  steer the model to the attacker's output.
- **Exposure**: sensitive training or inference data leaks into
  responses.
- **Prompt leaking**: the model reveals its own prompts or internal
  instructions.
- **Jailbreaking**: circumventing the model's safety constraints
  entirely.

## Compliance and governance

Regulated workloads (finance, healthcare, aerospace) mean audits,
archival, and agency reporting. AWS holds 140+ certifications (NIST,
ISO, SOC, HIPAA, GDPR, PCI DSS).

The AI-specific audit pain: opacity, systems that change over time,
emergent capabilities, algorithmic and human bias. The EU AI Act and
US state laws push fairness and accountability.

A governance framework: an AI governance board with legal,
compliance, and SME representation, defined roles, lifecycle-wide
policies. Review cadences mix technical and non-technical reviews,
transparency standards, team training.

Data governance covers the lifecycle (collect through archive),
logging, residency, monitoring, retention, and data lineage (source
citation, origin documentation, cataloging) for traceability. Model
Cards standardize model documentation and support audits.

## Security bits

Threat detection, vulnerability management, infrastructure
protection, encryption at rest and in transit with proper key
management.

Data quality means completeness, accuracy, timeliness, consistency.
The privacy tech: masking, obfuscation, tokenization. Least-privilege
access control with MFA and logging.

Monitoring production AI tracks accuracy, precision, recall, F1, and
latency, plus infrastructure (CPU, GPU, network) and bias and
fairness.

The GenAI Security Scoping Matrix classifies apps by ownership: Scope
1 is a consumer app (ChatGPT), 2 an enterprise app with GenAI
features, 3 pre-trained models (Bedrock base), 4 fine-tuned, 5
self-trained from scratch. More ownership, more security
responsibility.

## MLOps

DevOps extended to ML: models get versioned, deployed, monitored, and
retrained systematically.

The principles: version control (data, code, models), automation of
all stages, CI, CD, continuous retraining, continuous monitoring.
Pipelines run data, build and test, deployment, and monitoring,
backed by data, code, and model repositories.
