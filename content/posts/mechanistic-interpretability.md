---
title: "Mechanistic Interpretability"
date: "2025-12-02"
description: "Observing model weights and trying to understand what they are learning"
tags: ["Python", "LLMs", "Mechanistic Interpretability"]
public: true
citations:
    "1": 'Lindsey, et al., "On the Biology of a Large Language Model", Transformer Circuits, 2025.'
    "2": 'Elhage, et al., "A Mathematical Framework for Transformer Circuits", Transformer Circuits Thread, 2021.'
    "3": 'Olsson, et al., "In-context Learning and Induction Heads", Transformer Circuits Thread, 2022.'
---

## What is Mechanistic Interpretability and why do we care ?
Neural Networks are just an advanced mapping from input to output in other words it is a way to find the approximate function that will produce the correct output based on the input.

As we know functions may have many paramters and understanding those paramters is not usually intuitive
and the same thing for nuerons in neural networks.

The process of reverse-engineering the functionality of those parameters is called Mechanistic Interpretability.

Here we are going to talk about the interpretability of Attention based Large Langauge Models but it is worth noting that this field goes beyond that.

It's critically useful to understand how a model is working for showing:

- Is the model generalizing or just memorizing?
- Are its internal objectives aligned with its intended goals?

For example, Anthropic found that a model can explicitly misstate its own reasoning process, describing its approach in a way that doesn't reflect what it's actually doing.[1]

> By reverse-engineering what works in existing networks, we can distill principles for next-generation designs

In this post we are trying to reproduce the results of 2 main papers by Anthropic[2, 3]

## Transformers & Attention

If you haven't been living under a rock you probably have heard about **Transformers**