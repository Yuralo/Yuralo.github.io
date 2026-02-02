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
![MHA|80%](MHA.svg)

Eventhough the architecture have changed a little bit for optimization purposes and many varations  have been introduced (GQA, MLA, DSA ...) still they all are some few tweaks away from original.

Almost all of the performance gained by LLMs are because of this part that's why we are going to focus on it solely, meaning we will be training and inspecting Attention-only models ranging from 1, 2, 3 and 8 layers in the first few experiments and then migrate to analyze a model like gpt2. 

**_NOTE:_** We are not using MLPs here because they famously make models hard to interpret due to their tendency to create distributed representations.

## One-Layer Transformer
Starting we are training our model on **openwebtext** dataset, using a One-Layer attention only transformer

using the following paramters:

```python 
enc = tiktoken.get_encoding("gpt2")
d_model = 768
n_heads = 12
d_head = 64 
vocab_size = enc.n_vocab
batch_size = 32
context_len = 128
lr = 3e-4
epochs = 40_000
eval_iters = 50
```
Training a single layer with 12 heads and a context of 128 tokens.

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

we can describe attention model as a residual stream which get branched and on that branch some filters are applied, then we add the result back onto the stream
also we consider each head as its own filter and each layer as a group of filters each learning its own representation.

considering this we can also say the function of each head in attention only model is specific which means the function of a head doesn't change.
![One Layer attention|50%](onelayer.png)

**_NOTE:_** we have to emphasize on this point because when adding MLP layer a phenomenon called **polysemanticity** occur this means a single neuron fires for multiple and often unrelated features at the same time for example cat and car which makes interpretation difficult.


### Mathematical analysis

Here what that looks like mathmatically:
$$
x_0 = W_E \times t \\
\text{(one-hot vector $t$ picks out a row from $W_E$)} \\[0.5em]
x_1 = x_0 + h_a(x_0) + h_b(x_0) + \dots \\
\text{(each head adds to residual stream)} \\[0.5em]
\text{logits} = W_U \times x_1 \\[0.5em]
\text{logits} = W_U \times (x_0 + h_a(x_0) + h_b(x_0) + \dots) \\
= W_U \times (W_E \times t + h_a(W_E \times t) + h_b(W_E \times t) + \dots) \\
= W_U \times W_E \times t + W_U \times h_a(W_E \times t) + W_U \times h_b(W_E \times t) + \dots
$$

Here we recognize two paths:
### **Path 1**: The Direct Residual Path (Bigram): 

$$ W_U \times W_E \times t $$

This emebedding and unembedding path which only learns a bigram representation
meaning it only uses the current position. Can't look at previous words!
and exactly what a zero layer model would learn

**_NOTE:_** embedding is the process of converting the discrete tokens to a continuous vector representations.

### **Path 2**: The Attention Head Paths:

This is where context enters. and where the model starts to pay attention to even more tokens eariler in the context, and where the model learns complex represntations.

We grouped the whole layer as a path but we can also think of each head as a path of its own.

for each head:
$$
W_U \times h_i(W_E \times t)
$$

An attention head formula is defined by four matrices:
1. $$W_{Q}^{i}$$: The Query matrix.
2. $$W_{K}^{i}$$: The Key matrix
3. $$W_{V}^{i}$$: The Value matrix
4. $$W_{O}^{i}$$: The Output(or Porjection) matrix

$$
h_i(X) = \text{softmax}\left(\frac{(XW_Q^i)(XW_K^i)^T}{\sqrt{d_k}}\right) (XW_V^i W_O^i)
$$

## Circuit decomposition

### 1. The QK Circuit (The "Where" Path)
Shows how the attention pattern determines which tokens the head looks at, meaning it filters and ranks the context (Each head has a different criteria based on which it ranks the context)


To find this, we look inside the $\text{softmax}$ at the term that determines the attention scores. Let $x_{\text{dest}}$ be the vector at the current position (the query) and $x_{\text{src}}$ be the vector at a previous position (the key). The raw score (logit) before softmax is:

$$
\text{score} = \frac{(x_{\text{dest}} W_Q^i) \cdot (x_{\text{src}} W_K^i)^T}{\sqrt{d_k}}
$$

Expanding $x$ into its token embeddings $W_E t$:

$$
\text{score} = \frac{(W_E t_{\text{dest}}) W_Q^i (W_K^i)^T (W_E t_{\text{src}})^T}{\sqrt{d_k}}
$$

We can group the weight matrices in the middle to find the QK Circuit:

$$
\text{QK Circuit} = W_E^T (W_Q^i (W_K^i)^T) W_E
$$

and in the model this looks like:

```python
@torch.no_grad()
def extract_qk_matrix(
    model: OneLayerTransformer,
    head_idx: int
) -> torch.Tensor:
    W_E = model.W_E.weight.T  # [d_model, V]
    W_Q = model.W_Q.weight  # [h*d_head, d_model]
    W_K = model.W_K.weight

    start = head_idx * d_head
    end = (head_idx + 1) * d_head
    
    W_Q_i = W_Q[start:end, :].T
    W_K_i = W_K[start:end, :].T
    QK = W_E.T @ W_Q_i @ W_K_i.T @ W_E
    return QK
```
### 2. OV Circuit (The "What" Path) 
Transforms each attended token into contributions to the residual stream meaning it pushes the information based on the ranking by the QK cirucit

Both means: If QK says “B is most important token in the context” OV says “looking at B like this increases the chance of token X next.”


If we ignore the attention pattern $A$ for a moment and look at how a single vector $x$ at a source position is transformed into a contribution to the logits at the destination, we see this chain of linear transformations:

$$
x \xrightarrow{W_V} \text{value} \xrightarrow{W_O} \text{head output} \xrightarrow{W_U} \text{logits}
$$

By substituting $x = W_E t$, the end-to-end linear map is:

$$
\text{OV Circuit} = W_U W_O^i W_V^i W_E
$$

```python
@torch.no_grad()
def extract_ov_matrix(
    model: OneLayerTransformer,
    head_idx: int
) -> torch.Tensor:
    W_E_T = model.W_E.weight.T      # [d_model, V]
    W_U   = model.W_U.weight        # [V, d_model]

    W_V = model.W_V.weight          # [h*d_head, d_model]
    start = head_idx * d_head
    end = (head_idx + 1) * d_head
    W_V_i = W_V[start:end, :]       # [d_head, d_model]

    W_O = model.W_O.weight          # [d_model, h*d_head]
    W_O_i = W_O[:, start:end]       # [d_model, d_head]
    OV = W_U @ (W_O_i @ (W_V_i @ W_E_T))
    return OV
```

Now that we have layed the ground we can start with the analysis:

sample output:
```txt
The reality of life is vernacular or a large component by the woman.

The following the first that was no evidence in terms a “to-be.”

A couple of thousand, which will have more for the personal security for a lot of this the situation and the murder (or), a real person known to be in the past, but “histice the world.”

The next round are all the states in the case, no credit from the world’
```
We can see from a sample output the model is outputing something that is not really understandable but we can also observer that the model is learning the structure of a language.

![QK circuit|100%](QK circuit.png)

We can already see the copying mechanism here, observing the token 'E' we can see it boosting the previous token 'E'.

![Attention scores|100%](exp1-attention.png)
Examining the 4th, 5th and 7th heads here we can observe that those heads are doing an indication of copying and forming an early stage of what is called induction heads.

## Two-Layers Transformer
<hr/>
Github repo:
<GitHubRepo owner="yuralo" repo="Mechanistic-Interpretability" />
