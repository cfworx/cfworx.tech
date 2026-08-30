---
title: "Machine learning fundamentals"
date: 2026-02-07
description: "AIF-C01 notes: ML vs DL vs GenAI, neural networks and transformers, data types, and supervised, unsupervised, semi- and self-supervised learning."
draft: false
---

## The layers again, precisely

AI is the umbrella: intelligent systems doing perception, reasoning,
learning, problem solving, decisions. Rule-based expert systems
(1970s MYCIN) are AI but not ML.

ML is machines learning from data to predict, with no explicitly
programmed rules. Regression and classification live here.

Deep learning is neural networks: nodes in layers, connections
adjusting as data flows through. It handles complex patterns
(computer vision, NLP) and needs lots of data and GPUs. The
intuition: each layer learns a pattern (edges, then curves, then
digits).

GenAI is the deep learning subset built on foundation models.
Transformers process whole sentences at once with self-attention,
weighting which words matter (GPT = Generative Pretrained
Transformer; BERT reads both directions).

Multimodal models mix input and output types: text + image + audio
in, video out.

## Glossary the exam likes

GPT (text and code generation), BERT (bidirectional text), RNN
(sequential data: time series, speech), ResNet (a deep CNN for images
and faces), SVM (classification and regression), WaveNet (audio
synthesis), GAN (synthetic data generation, data augmentation),
XGBoost (gradient boosting).

## Training data

Garbage in, garbage out: data is the most critical stage.

Labeled data (features plus known outputs) feeds supervised learning;
unlabeled feeds unsupervised. Structured means tabular rows and
columns or time series; unstructured means free text and images.

## Supervised learning

Learns a mapping from labeled examples to predict outputs for new
inputs.

Regression predicts a continuous number (house price, stock,
temperature). Classification predicts a category: binary (spam or
not), multiclass (mammal, bird, reptile), multi-label (a movie tagged
action *and* comedy). k-NN is the flagship algorithm.

The dataset split: about 80% training, 10% validation (hyperparameter
tuning), 10% test (final evaluation).

Feature engineering uses domain knowledge to extract, select, and
transform features (birthdate becomes age, price per square foot).
It's a big lever for structured data; for text and images it's
TF-IDF, embeddings, CNN features.

## Unsupervised learning

Find structure in unlabeled data; humans name the groups afterward.

Clustering (K-means) does customer segmentation. Association rule
learning (Apriori) does market basket analysis: bread goes with
butter. Anomaly detection (Isolation Forest) does fraud flagging.

## The in-betweens

Semi-supervised: a small labeled set plus a large unlabeled set; the
model pseudo-labels the rest, then retrains.

Self-supervised: the model invents pretext tasks from unlabeled data
(predict the masked word, predict the next part) to learn
representations, then tackles downstream tasks. This is how BERT and
GPT got made.

Reinforcement learning got its own post:
[RL and RLHF](/notes/artificial-intelligence/aws-certified-ai-practitioner/reinforcement-learning-and-rlhf/).
