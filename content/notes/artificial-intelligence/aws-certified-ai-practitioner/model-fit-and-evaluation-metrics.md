---
title: "Model fit and evaluation metrics"
date: 2026-02-09
description: "AIF-C01 notes: overfitting vs underfitting, bias and variance, confusion matrix math, AUC-ROC, regression metrics, and inference types."
draft: false
---

## Fit, bias, variance

Overfitting: great on training data, bad on new data. The causes: a
small unrepresentative dataset, training too long on one sample set,
a model too complex (it learns the noise). The fixes: more data,
early stopping, data augmentation, adjusted hyperparameters,
ensembling.

Underfitting: bad even on training data. The model is too simple or
the features too poor.

Bias is the error between predictions and truth from wrong modeling
choices. High bias means underfitting (a linear model on non-linear
data); reduce it with a more complex model and more features.

Variance is how much performance shifts when trained on different
similar data. High variance means overfitting; reduce it with feature
selection and repeated train/test splitting.

The target: low bias, low variance. Balanced.

## Classification metrics (confusion matrix)

```text
                    Predicted positive   Predicted negative
Actually positive          TP                   FN
Actually negative          FP                   TN
```

- **Precision** = TP / (TP + FP). Reach for it when false positives
  are costly.
- **Recall** = TP / (TP + FN). When false negatives are costly.
- **F1**: the harmonic mean of precision and recall. Balance,
  especially on imbalanced data.
- **Accuracy** = (TP + TN) / all. Only meaningful on balanced
  datasets.
- **AUC-ROC**: plots true positive rate vs false positive rate across
  thresholds. 1.0 is perfect, 0.5 is a coin flip. Used to compare
  models and pick a threshold.

## Regression metrics

MAE, MAPE, and RMSE measure prediction error (an RMSE of 5 means
predictions are off by about 5 on average).

R² measures explained variance (0.8 means 80% of the outcome
variation is explained by the features). Close to 1 is good.

## Inferencing

Real time: decisions as data arrives, speed over perfect accuracy
(chatbots). Batch: analyze a big dataset at once, accuracy over
speed.

Edge: a small language model on a weak local device gives low latency
and works offline. A full LLM on a remote server gives more power but
needs connectivity and carries higher latency.
