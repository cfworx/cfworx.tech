---
title: "Bedrock: RAG, agents, and features"
date: 2026-02-04
description: "AIF-C01 notes on Bedrock features: RAG and vector databases, embeddings, guardrails, agents, CloudWatch integration, pricing, and Amazon Nova."
draft: false
---

Follows
[GenAI and foundation models](/notes/artificial-intelligence/aws-certified-ai-practitioner/generative-ai-and-foundation-models/).

## Core token concepts

Tokenization turns raw text into tokens, word-based or subword
(subwords handle long words).

The context window is how many tokens the model can consider at once.
Bigger means more coherence, and more memory and compute. It's the
first thing to compare between models.

Embeddings turn text, images, and audio into high-dimensional vectors
capturing semantic meaning, syntax, and sentiment. Words with related
meanings get similar vectors (dog and puppy cluster; houses lands far
away). Embeddings power semantic search and RAG.

## RAG and Knowledge Bases

Retrieval-Augmented Generation lets the FM pull from data outside its
training set at query time. Bedrock Knowledge Bases handle the
plumbing: your documents get chunked, run through an embedding model,
and stored in a vector database.

The query flow: user question, search the vector DB for relevant
chunks, augment the prompt with the retrieved text, and the FM
answers with facts it never trained on.

The vector DB options on AWS: OpenSearch Service (kNN search at
scale), Aurora PostgreSQL (relational), Neptune Analytics (GraphRAG),
S3 Vectors (cheap and durable).

Data sources: S3, Confluence, SharePoint, Salesforce, web pages. The
classic uses: support chatbots over product docs, legal research,
medical Q&A.

## Guardrails

Guardrails sit between users and the FM: block topics, filter harmful
content, redact PII, reduce hallucinations. Multiple guardrails per
app, with monitoring of violating inputs.

## Agents

Agents carry out multi-step tasks in order, passing state between
steps (chain of thought).

They're configured with action groups: APIs defined by OpenAPI
schemas plus Lambda functions the agent may call. They can also hit
Knowledge Bases mid-task.

An example flow: the user asks for a recommendation, the agent calls
getRecentPurchases, then getRecommendedPurchases, checks the return
policy KB, and composes the final answer.

## Monitoring and pricing

Model invocation logging goes to CloudWatch Logs and S3 (text,
images, embeddings), searchable with Logs Insights. CloudWatch
metrics like ContentFilteredCount prove guardrails are firing; alarm
on them.

The pricing modes: on-demand per token (base models only), batch (up
to a 50% discount, results to S3), provisioned throughput (reserve
capacity per month, required for fine-tuned and custom models).

The cost levers: token counts in and out are the main driver, and
smaller models are cheaper. Temperature, Top K, and Top P do *not*
affect price.

The cheapest-first improvement order: prompt engineering, then RAG,
then instruction-based fine-tuning, then domain adaptation
fine-tuning.

## Amazon Nova

AWS's own FM family in Bedrock. Understanding: Premier (most capable,
the distillation teacher), Pro (balanced), Lite (cheap multimodal),
Micro (text only, lowest latency).

Creative: Canvas (image), Reel (video). Speech: Sonic.

The Nova 2 generation adds up to 1M-token context and better
reasoning: 2 Lite, 2 Sonic (speech to speech), 2 Multimodal
Embeddings, 2 Omni.
