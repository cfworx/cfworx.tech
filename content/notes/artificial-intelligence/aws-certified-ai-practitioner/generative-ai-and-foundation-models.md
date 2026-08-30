---
title: "Generative AI and foundation models"
date: 2026-02-03
description: "AIF-C01 notes: foundation models, LLMs and next-token probability, diffusion models, plus Bedrock fine-tuning, distillation, and model evaluation."
draft: false
---

## GenAI basics

Generative AI is a subset of deep learning that generates new data
resembling its training data: text, images, audio, code, video.

A Foundation Model (FM) is trained broadly on huge unlabeled
datasets, then adapted to many tasks (generation, summarization,
extraction, chat, Q&A). Training one costs tens of millions of
dollars.

The vendors: OpenAI, Meta, Amazon, Google, Anthropic. Some are open
source (Meta's Llama, Google BERT), some commercial.

An LLM is an FM for coherent human-like text: billions of parameters,
trained on books, articles, and web text.

How text generation works: the model produces a list of candidate
next words with probabilities, and an algorithm picks one (with some
randomness). That's why the same prompt gives different answers.
Non-deterministic by design.

Image generation uses diffusion models (Stable Diffusion, for one).
Training adds noise to pictures step by step (forward diffusion);
generation runs it backward, denoising from static into a picture
matching the prompt. There are also text-from-image and
image-from-image variants.

## Amazon Bedrock

The AWS service for building GenAI apps: fully managed, pay per use,
one unified API across many FMs.

Bedrock gives you a private copy of the FM; your data never trains
the base model.

Choosing a base model balances capability, customization options,
model size, inference options, licensing, context window, latency,
and cost. Multimodal models take and emit mixed input and output
types.

Amazon Titan is AWS's own FM family (text, image, multimodal).
Smaller models cost less.

## Customizing a model

- **Supervised fine-tuning**: further train on labeled
  prompt/completion pairs for a specific domain. The cheaper of the
  two.
- **Reinforcement fine-tuning**: the model iterates against a reward
  function scoring its responses (Lambda code for objective tasks, a
  judge model for subjective ones). Higher cost.
- **Distillation**: a big teacher model transfers knowledge to a
  small student model, up to 75% cheaper with some accuracy loss. The
  efficiency play.

Fine-tuning changes the model weights, needs correctly formatted
training data in S3, and not every model supports it. Running a
fine-tuned model costs more: on-demand per token, or provisioned
throughput billed monthly.

The use cases: persona chatbots, fresher data than the base model
saw, exclusive internal data, targeted classification.

## Evaluating models

Automatic evaluation uses built-in task types (summarization, Q&A,
classification, open-ended generation) and benchmark datasets, with a
judge model scoring the output. Human evaluation has your employees
or SMEs grade outputs (thumbs, rankings).

Benchmark datasets are curated question sets that also expose bias
quickly. You can build your own.

The metrics:

- **ROUGE**: summarization and translation, n-gram overlap with a
  reference.
- **BLEU**: translation quality, precision with a brevity penalty.
- **BERTScore**: semantic similarity via embedding comparison.
- **Perplexity**: how well the model predicts next tokens. Lower is
  better.

Business metrics matter too: user satisfaction, average revenue per
user, conversion rate, cross-domain performance, efficiency.

Continues with
[RAG, agents, and Bedrock features](/notes/artificial-intelligence/aws-certified-ai-practitioner/bedrock-rag-agents-and-features/).
