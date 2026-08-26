---
title: "Machine Learning Fundamentals"
date: 2026-02-07
description: "AIF-C01 notes: ML vs DL vs GenAI, neural networks and transformers, data types, and supervised, unsupervised, semi- and self-supervised learning."
draft: false
---

## The layers again, precisely

- AI: the umbrella. Intelligent systems doing perception, reasoning, learning, problem solving, decisions. Rule-based expert systems (1970s MYCIN) are AI but not ML.
- ML: machines learn from data to predict, no explicitly programmed rules. Regression and classification live here.
- Deep learning: neural networks (nodes in layers, connections adjusting as data flows through). Handles complex patterns: computer vision, NLP. Needs lots of data and GPUs. Intuition: each layer learns a pattern (edges → curves → digits).
- GenAI: deep learning subset built on foundation models. Transformers process whole sentences at once with self-attention, weighting which words matter (GPT = Generative Pretrained Transformer; BERT reads both directions).
- Multimodal models mix input and output types (text + image + audio in, video out).

## Glossary the exam likes

GPT (text/code generation), BERT (bidirectional text), RNN (sequential data: time series, speech), ResNet (deep CNN for images/faces), SVM (classification/regression), WaveNet (audio synthesis), GAN (synthetic data generation, data augmentation), XGBoost (gradient boosting).

## Training data

- Garbage in, garbage out: data is the most critical stage.
- Labeled (features + known outputs) → supervised learning. Unlabeled → unsupervised.
- Structured: tabular rows/columns, time series. Unstructured: free text, images.

## Supervised learning

- Learns a mapping from labeled examples to predict outputs for new inputs.
- Regression: predict a continuous number (house price, stock, temperature).
- Classification: predict a category. Binary (spam or not), multiclass (mammal/bird/reptile), multi-label (a movie tagged action AND comedy). k-NN is the flagship algorithm.
- Dataset split: ~80% training, ~10% validation (hyperparameter tuning), ~10% test (final evaluation).
- Feature engineering: use domain knowledge to extract/select/transform features (birthdate → age, price per square foot). Big lever for structured data; for text and images it's TF-IDF, embeddings, CNN features.

## Unsupervised learning

- Find structure in unlabeled data; humans name the groups afterward.
- Clustering (K-means): customer segmentation.
- Association rule learning (Apriori): market basket analysis, bread goes with butter.
- Anomaly detection (Isolation Forest): fraud flagging.

## The in-betweens

- Semi-supervised: small labeled set + large unlabeled set; model pseudo-labels the rest, then retrains.
- Self-supervised: model invents pretext tasks from unlabeled data (predict the masked word, predict the next part) to learn representations, then tackles downstream tasks. How BERT and GPT got made.

Reinforcement learning got its own post → [RL and RLHF](/notes/artificial-intelligence/aws-certified-ai-practitioner/reinforcement-learning-and-rlhf/).
