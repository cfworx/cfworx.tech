---
title: "AWS Managed AI Services"
date: 2026-02-11
description: "AIF-C01 service tour: Comprehend, Transcribe, Polly, Rekognition, Lex, Personalize, Textract, Kendra, A2I, the medical variants, and AI chips."
draft: false
---

Pre-trained ML services: no model building, token-based pricing, multi-AZ redundancy, specialized hardware behind the scenes. The exam wants you matching use case → service.

| Service | One-liner |
|---|---|
| Comprehend | NLP: language detection, key phrases, entities, sentiment, topic grouping |
| Translate | language translation at scale |
| Transcribe | speech to text (ASR), PII redaction, automatic language ID |
| Polly | text to lifelike speech |
| Rekognition | objects, people, text, scenes in images/video; face analysis and search |
| Lex | chatbots with voice and text (intents + slots, invokes Lambda) |
| Personalize | real-time recommendations, the amazon.com engine |
| Textract | extract text, handwriting, forms, tables from scanned docs |
| Kendra | ML-powered document search with natural language answers |
| Mechanical Turk | crowdsourced humans for simple tasks (labeling 10M images at $0.10 each) |
| A2I (Augmented AI) | human review of low-confidence ML predictions |

## Details worth keeping

- Comprehend custom classification: your own document categories, trained from tagged samples in S3; real-time (single doc) or async batch. Custom entity recognition does the same for your business-specific terms (policy numbers, escalation phrases). Plain NER extracts the generic entities (people, places, dates).
- Transcribe accuracy boosters: custom vocabularies (specific words: brand names, acronyms, with pronunciation hints) + custom language models (domain context, trained on your text). Use both for best results. Also does voice-based toxicity detection (tone + text cues).
- Polly extras: lexicons (expand AWS → "Amazon Web Services"), SSML markup for pronunciation and pauses, several voice engines, speech marks for lip sync and word highlighting.
- Rekognition custom labels: teach it your logo or products with a few hundred labeled images. Content moderation integrates with A2I to cut human review to 1-5% of volume; custom moderation adaptors tune it with your labeled images.
- Personalize recipes: pre-built algorithms per use case: USER_PERSONALIZATION, PERSONALIZED_RANKING, POPULAR_ITEMS (Trending-Now), RELATED_ITEMS (Similar-Items), PERSONALIZED_ACTIONS (Next-Best-Action), USER_SEGMENTATION. Recipes = recommendations.
- Kendra learns from user feedback (incremental learning) and allows manual result tuning.
- A2I flow: high-confidence predictions return straight to the app; low-confidence go to human reviewers (your staff, AWS contractors, or Mechanical Turk); reviewed data feeds back into training.

## Healthcare variants (HIPAA territory)

- Transcribe Medical: medical speech to text (drug names, procedures), real-time or batch.
- Comprehend Medical: pulls info from unstructured clinical text, detects PHI (DetectPHI API); pair with Transcribe to analyze spoken narratives.
- HealthScribe: clinical notes straight from patient-clinician conversations: transcripts, speaker roles, extracted terms.

## AWS hardware for AI

- GPU instance families: P and G series.
- Trainium: AWS training chip (Trn1 = 16 accelerators, ~50% training cost cut).
- Inferentia: AWS inference chip (Inf1/Inf2, up to 4x throughput at ~70% lower cost).
- Trn/Inf also carry the lowest environmental footprint pitch.
