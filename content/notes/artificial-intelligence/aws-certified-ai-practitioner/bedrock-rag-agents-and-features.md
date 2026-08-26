---
title: "Bedrock: RAG, Agents, and Features"
date: 2026-02-04
description: "AIF-C01 notes on Bedrock features: RAG and vector databases, embeddings, guardrails, agents, CloudWatch integration, pricing, and Amazon Nova."
draft: false
---

Follows [GenAI and foundation models](/notes/artificial-intelligence/aws-certified-ai-practitioner/generative-ai-and-foundation-models/).

## Core token concepts

- Tokenization: raw text → tokens (word-based or subword; subwords handle long words).
- Context window: how many tokens the model can consider at once. Bigger = more coherence, more memory and compute. First thing to compare between models.
- Embeddings: turn text/images/audio into high-dimensional vectors capturing semantic meaning, syntax, sentiment. Words with related meanings get similar vectors (dog and puppy cluster; houses lands far away). Embeddings power semantic search and RAG.

## RAG and Knowledge Bases

- Retrieval-Augmented Generation: let the FM pull from data outside its training set at query time. Bedrock Knowledge Bases handle the plumbing: your documents get chunked, run through an embedding model, and stored in a vector database.
- Query flow: user question → search the vector DB for relevant chunks → augment the prompt with the retrieved text → FM answers with facts it never trained on.
- Vector DB options on AWS: OpenSearch Service (kNN search at scale), Aurora PostgreSQL (relational), Neptune Analytics (GraphRAG), S3 Vectors (cheap and durable).
- Data sources: S3, Confluence, SharePoint, Salesforce, web pages.
- Classic uses: support chatbots over product docs, legal research, medical Q&A.

## Guardrails

- Sit between users and the FM: block topics, filter harmful content, redact PII, reduce hallucinations. Multiple guardrails per app, with monitoring of violating inputs.

## Agents

- Carry out multi-step tasks in order, passing state between steps (chain of thought).
- Configured with action groups: APIs defined by OpenAPI schemas plus Lambda functions the agent may call. Can also hit Knowledge Bases mid-task.
- Example flow: user asks for a recommendation → agent calls getRecentPurchases → getRecommendedPurchases → checks the return policy KB → composes the final answer.

## Monitoring and pricing

- Model invocation logging → CloudWatch Logs and S3 (text, images, embeddings), searchable with Logs Insights.
- CloudWatch metrics, e.g. ContentFilteredCount proves guardrails are firing; alarm on them.
- Pricing modes: on-demand per token (base models only), batch (up to 50% discount, results to S3), provisioned throughput (reserve capacity per month, required for fine-tuned/custom models).
- Cost levers: token counts in and out are the main driver; smaller models are cheaper; temperature/Top K/Top P do NOT affect price.
- Cheapest-first improvement order: prompt engineering → RAG → instruction-based fine-tuning → domain adaptation fine-tuning.

## Amazon Nova

- AWS's own FM family in Bedrock. Understanding: Premier (most capable, distillation teacher), Pro (balanced), Lite (cheap multimodal), Micro (text only, lowest latency). Creative: Canvas (image), Reel (video). Speech: Sonic.
- Nova 2 generation adds up to 1M-token context and better reasoning: 2 Lite, 2 Sonic (speech to speech), 2 Multimodal Embeddings, 2 Omni.
