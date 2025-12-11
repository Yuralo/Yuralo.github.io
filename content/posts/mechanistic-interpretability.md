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
    "4": 'Vaswani, Ashish, et al. "Attention is all you need." Advances in neural information processing systems 30 (2017).'
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

If you haven't been living under a rock you probably have heard about **Transformers**[4], in which they introduced the *Multi head attention* (MHA) the most important part today.
![MHA|80%](MHA.webp)

Eventhough the architecture have changed a little bit for optimization purposes and many varations  have been introduced (GQA, MLA, DSA ...) still they all are some few tweaks away from original.

Almost all of the performance gained by LLMs are because of this part that's why we are going to focus on it solely, meaning we will be training and inspecting Attention-only models ranging from 1, 2, 3 and 8 layers.

**_NOTE:_** We are not using MLPs here because they famously make models hard to interpret due to their tendency to create distributed representations

## One-Layer Transformer

```python
class OneLayerTransformer(nn.Module):
    def __init__(self, vocab_size: int, d_model: int, n_heads: int, d_head: int, context_len: int):
        super().__init__()
        self.vocab_size = vocab_size
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_head = d_head 
        self.context_len = context_len
        # Embedding
        self.W_E = nn.Embedding(self.vocab_size, self.d_model)
        self.W_pos = nn.Embedding(context_len, d_model)
        self.W_Q = nn.Linear(self.d_model, self.n_heads * self.d_head, bias=False)
        self.W_K = nn.Linear(self.d_model, self.n_heads * self.d_head, bias=False)
        self.W_V = nn.Linear(self.d_model, self.n_heads * self.d_head, bias=False)
        self.W_O = nn.Linear(self.n_heads * self.d_head, self.d_model, bias=False)
        # Unembedding
        self.W_U = nn.Linear(self.d_model, self.vocab_size)

    def forward(self, x: torch.Tensor, return_all: bool = False) -> torch.Tensor:
        device = x.device
        d_head, n_heads = self.d_head, self.n_heads
        B, T = x.shape
        pos = torch.arange(T, device=device)
        x = self.W_E(x) + self.W_pos(pos)
        
        residual = x 
        # B, T, C
        q = self.W_Q(x) # (B, T, n_heads * d_head)
        k = self.W_K(x)  
        v = self.W_V(x)

        # To parallelize acros heads and batches
        q = q.view(B, T, n_heads, d_head).transpose(1, 2)
        v = v.view(B, T, n_heads, d_head).transpose(1, 2)
        k = k.view(B, T, n_heads, d_head).transpose(1, 2)
                                # B, T, n_heads, d_head -> B, T, n_heads, d_head
        scores = torch.matmul(q, k.transpose(-2, -1)) / d_head ** 0.5 # [B, n_heads, T, d_head] @ [B, n_heads, d_head, T] = B, n_heads, T, T
        mask = torch.triu(torch.ones(T, T, device=device, dtype=torch.bool), diagonal=1)
        scores = scores.masked_fill(mask, float('-inf'))
        # 4. Softmax
        pattern = F.softmax(scores, dim=-1)

        z = torch.matmul(pattern, v) # [B, n_heads, T, d_head]
        z = z.transpose(1, 2).contiguous().view(B, T, -1)
        attn_out = self.W_O(z)

        hidden_state = attn_out + residual
        logits = self.W_U(hidden_state)
        if return_all:
            return logits, scores, pattern, v, z, hidden_state
        return logits 

```
