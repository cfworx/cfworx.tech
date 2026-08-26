---
title: "Model Fit and Evaluation Metrics"
date: 2026-02-09
description: "AIF-C01 notes: overfitting vs underfitting, bias and variance, confusion matrix math, AUC-ROC, regression metrics, and inference types."
draft: false
---

## Fit, bias, variance

- Overfitting: great on training data, bad on new data. Causes: small unrepresentative dataset, training too long on one sample set, model too complex (learns the noise). Fixes: more data, early stopping, data augmentation, adjust hyperparameters, ensembling.
- Underfitting: bad even on training data. Model too simple or features too poor.
- Bias = error between predictions and truth from wrong modeling choices. High bias = underfitting (linear model on non-linear data). Reduce with a more complex model, more features.
- Variance = how much performance shifts when trained on different similar data. High variance = overfitting. Reduce with feature selection and repeated train/test splitting.
- Target: low bias, low variance = balanced.

## Classification metrics (confusion matrix)

| | Predicted positive | Predicted negative |
|---|---|---|
| Actually positive | TP | FN |
| Actually negative | FP | TN |

- Precision = TP / (TP + FP). Reach for it when false positives are costly.
- Recall = TP / (TP + FN). When false negatives are costly.
- F1 = harmonic mean of precision and recall. Balance, especially on imbalanced data.
- Accuracy = (TP + TN) / all. Only meaningful on balanced datasets.
- AUC-ROC: plots true positive rate vs false positive rate across thresholds; 1.0 = perfect, 0.5 = coin flip. Used to compare models and pick a threshold.

## Regression metrics

- MAE, MAPE, RMSE measure prediction error (RMSE of 5 = predictions off by about 5 on average).
- R² measures explained variance (0.8 = 80% of outcome variation explained by the features). Close to 1 = good.

## Inferencing

- Real time: decisions as data arrives, speed over perfect accuracy (chatbots).
- Batch: analyze a big dataset at once, accuracy over speed.
- Edge: small language model on a weak local device = low latency, works offline. Full LLM on a remote server = more power, needs connectivity, higher latency.
