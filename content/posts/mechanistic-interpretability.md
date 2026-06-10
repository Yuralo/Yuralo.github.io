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
    "5": 'Radford, et al., "Language Models are Unsupervised Multitask Learners", OpenAI, 2019.'
    "6": 'Wang, et al., "Interpretability in the Wild: a guide to understanding induction heads in GPT-2 small", 2022.'
    "7": 'Elhage, et al., "Toy Models of Superposition", Transformer Circuits Thread, 2022.'
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

But here is the catch: copying is **not** the same as induction, and our one-layer model is about to walk straight into a wall.

### Where one layer breaks

Let's give the model an exam. We feed it a sequence that repeats a clear pattern and ask it to continue:

```txt
A B C X D E F   A B C X D E F   A B C X D E
```

The next token should obviously be `F`. A human grabs it instantly: we have seen `... D E F` twice already, we are sitting right after `D E`, so `F` comes next. Here is what our one-layer model thinks instead:

<table>
<thead>
<tr><th>Rank</th><th>Token</th><th>Probability</th></tr>
</thead>
<tbody>
<tr><td>0</td><td>B</td><td>2.80%</td></tr>
<tr><td>1</td><td>D</td><td>2.79%</td></tr>
<tr><td>2</td><td>J</td><td>2.58%</td></tr>
<tr><td>3</td><td>R</td><td>2.25%</td></tr>
<tr><td>4</td><td>AN</td><td>2.02%</td></tr>
<tr><td>...</td><td>...</td><td>...</td></tr>
<tr><td>25</td><td>F</td><td>0.70%</td></tr>
</tbody>
</table>

`F` is hiding all the way down at rank **25** with a measly `0.70%`. Notice the model isn't clueless, it is piling its mass on single capital letters (`B`, `D`, `J`, `R` ...), so it has clearly learned *"a letter probably comes next"*. It just completely fails to grab the actual pattern.

Maybe that pattern was too hard? Let's make it embarrassingly easy, a pure periodic repetition:

```txt
A B C D A B C D A B C D A B C D
A B C
```

The continuation is just `D`. And still:

<table>
<thead>
<tr><th>Rank</th><th>Token</th><th>Probability</th></tr>
</thead>
<tbody>
<tr><td>0</td><td>C</td><td>1.54%</td></tr>
<tr><td>1</td><td>er</td><td>1.51%</td></tr>
<tr><td>2</td><td>ä</td><td>1.50%</td></tr>
<tr><td>3</td><td>L</td><td>1.43%</td></tr>
<tr><td>...</td><td>...</td><td>...</td></tr>
<tr><td>10</td><td>D</td><td>1.15%</td></tr>
</tbody>
</table>

`D` lands at rank **10**. The model has a vague feeling that *something* is repeating, but it cannot commit to it.

**_NOTE:_** the token weirdness you see (`AN`, `er`, `ä` ...) is just the BPE tokenizer talking, single letters are rare tokens so the model smears probability over visually similar fragments.

So why does a head that *provably* copies still fail to predict? The answer lives in the OV circuit. Remember a head computes:

$$
\text{Attn}(x_t) = \sum_{s<t} \alpha_{t,s}\, V(x_s)
$$

The QK circuit can make $\alpha_{t,s}$ large whenever $x_t = x_s$, so it reliably finds *where the same token appeared before*. But once it lands on that position $s$, the OV circuit writes back a representation of $x_s$ itself, the very token it just matched. It is shouting *"I have seen this token!"*, not *"here is the token that came right after it"*.

To do induction you need to match position $s$ and then copy from position $s+1$. Formally you need to learn the map $\text{match}(x_s) \rightarrow x_{s+1}$. A single head can wander around the token-identity space **or** shift by one position, but it cannot chain both inside one matrix multiply.

> One layer can ask **"where have I seen this before?"** — it just has no second step to answer **"...and what came next?"**

And this is not a bug we can train away with more epochs. It is structural. So let's give the model the one thing it is missing: depth.

## Two-Layers Transformer

Adding a second attention layer changes the whole game, because now a head in layer 2 can *read what a head in layer 1 wrote* into the residual stream. That single fact is the entire trick:

- **Layer 1** behaves like a *previous-token head*: it writes a token-identity-aligned signal into the stream, essentially tagging each position with *"the token before me was X"*.
- **Layer 2** becomes the *induction head*: it attends using that tag, and its OV circuit shifts the match forward by one position, landing on the **successor** token.

That is the `match → shift` composition the single layer could never express, now split cleanly across two layers.

{/* 📸 FIGURE — replace with a clean two-layer mechanism diagram. Suggested: residual stream drawn left→right, Layer 1 head drawing an arrow from token to "previous token" tag, Layer 2 head reading that tag and pointing one position forward to the successor. Hand-drawn (Whiteboard) or matplotlib both fit the existing style. */}
![Two-layer induction mechanism: layer 1 tags the previous token, layer 2 reads that tag and shifts one step forward to predict the successor|85%](twolayer-mechanism.svg)

We train with almost the same recipe, just a touch longer:

```python
d_model     = 768
n_heads     = 12
d_head      = 64
context_len = 128
batch_size  = 32
lr          = 3e-4
epochs      = 50_000   # OpenWebText, trained on Apple Silicon (MPS)
```

And the model itself is just our one-layer block, stacked, with every block adding back onto the residual stream:

```python
class TwoLayerTransformer(nn.Module):
    """Same primitives as the one-layer model, but two attention blocks
    stacked on the residual stream. Full implementation in the repo."""
    def __init__(self, vocab_size, d_model, n_heads, d_head, context_len):
        super().__init__()
        self.W_E   = nn.Embedding(vocab_size, d_model)
        self.W_pos = nn.Embedding(context_len, d_model)
        self.blocks = nn.ModuleList([
            AttentionBlock(d_model, n_heads, d_head),  # layer 1 -> previous-token head
            AttentionBlock(d_model, n_heads, d_head),  # layer 2 -> induction head
        ])
        self.W_U = nn.Linear(d_model, vocab_size)

    def forward(self, x):
        T = x.size(-1)
        x = self.W_E(x) + self.W_pos(torch.arange(T, device=x.device))
        for block in self.blocks:
            x = x + block(x)        # each block writes back to the residual stream
        return self.W_U(x)
```

Now we hand this two-layer model the *exact* same two exams. First the easy periodic one (target `D`):

<table>
<thead>
<tr><th>Rank</th><th>Token</th><th>Probability</th></tr>
</thead>
<tbody>
<tr><td>0</td><td>D</td><td>41.64%</td></tr>
<tr><td>1</td><td>E</td><td>1.65%</td></tr>
<tr><td>2</td><td>d</td><td>1.22%</td></tr>
<tr><td>3</td><td>ERN</td><td>1.17%</td></tr>
</tbody>
</table>

`D` rockets from rank 10 all the way to **rank 0 at 41.64%**. And on the harder `A B C X D E F` pattern (target `F`):

<table>
<thead>
<tr><th>Rank</th><th>Token</th><th>Probability</th></tr>
</thead>
<tbody>
<tr><td>0</td><td>F</td><td>82.92%</td></tr>
<tr><td>1</td><td>ph</td><td>0.70%</td></tr>
<tr><td>2</td><td>S</td><td>0.39%</td></tr>
<tr><td>3</td><td>M</td><td>0.38%</td></tr>
</tbody>
</table>

`F` goes from `0.70%` buried at rank 25 to a confident **82.92%** at rank 0. Same data, same tokenizer, one extra layer, an entirely different model.

> This is not "a few percentage points of accuracy". It is a *qualitative* switch, the model went from *"some letter comes next"* to genuine in-context pattern matching.

### Reading the heads

Numbers are satisfying, but we promised to actually *reverse-engineer* this, so let's look at what the heads are doing. We measure each head's **attention impact**, how much it actually moves the prediction, across the sequence:

{/* 📊 FIGURE — two side-by-side bar charts (Layer 2, Head 2 and Head 3). x-axis = token position in the repeated sequence, y-axis = attention impact / contribution. Highlight the spiking bars in a different color (the paper uses orange). Export from your analysis notebook at ~the same width as the QK circuit image. */}
![Attention impact of Layer 2 heads 2 and 3 — head 2 ramps up across a repeat, head 3 spikes at the start of a pattern|100%](heads-2-3-impact.png)

Two roles already jump out. Head 2 ramps its impact up the *longer* a pattern has been running, it is tracking *"we are currently inside a repeat"*. Head 3 instead spikes right at the **start** of a pattern, it is detecting *where* a repeated block begins. Put together, that is exactly the bookkeeping induction needs.

Pushing further into heads 4, 5 and 6:

{/* 📊 FIGURE — three side-by-side bar charts (Layer 2, Heads 4, 5, 6), same format as the previous one. Head 6 should visibly have the tallest highlighted bars. */}
![Attention impact of Layer 2 heads 4, 5 and 6 — the induction behaviour sharpens, with head 6 doing most of the work|100%](heads-4-5-6-impact.png)

The same ability gets sharper across these heads, and head **6** is plainly doing the heavy lifting, by far the largest impact on the model's pattern matching.

And if we drop down to the raw attention maps for heads 5 and 6, the smoking gun shows up:

{/* 🔥 FIGURE — attention heatmaps for Layer 2 Head 5 and Head 6 (queries on y, keys on x). The key visual is the bright OFF-diagonal stripe (not the main diagonal). Same colormap/style as your existing QK circuit.png so the post stays visually consistent. */}
![Attention maps for Layer 2 heads 5 and 6 — the bright off-diagonal stripe is the induction signature|100%](heads-5-6-attention.png)

That bright **off-diagonal stripe** is the fingerprint of an induction head: instead of attending to itself (the main diagonal), each position reaches back to where the pattern last repeated, a fixed offset $\Delta$ away.

### Quantifying induction

Eyeballing heatmaps is fun, but we want a *number*. For layer $\ell$ and head $i$, the attention weights are:

$$
A_{i,jk}^{(\ell)} = \frac{\exp\!\left(S_{i,jk}^{(\ell)}/\sqrt{d_h}\right)}{\sum_{m=1}^{j}\exp\!\left(S_{i,jm}^{(\ell)}/\sqrt{d_h}\right)}
$$

where $S_{i,jk}^{(\ell)} = \mathbf{q}_{i,j}^{(\ell)\top}\mathbf{k}_{i,k}^{(\ell)}$ is the query–key score and the sum runs only up to $j$ (causal masking).

Raw attention can lie to us though, a head might attend hard to a position that carries almost no information. So we weight every attended position by the norm of its value vector:

$$
\hat{A}_{i,jk}^{(\ell)} = A_{i,jk}^{(\ell)} \cdot \lVert \mathbf{v}_{i,k}^{(\ell)} \rVert_2
$$

Then we define an **induction score** that simply measures how much of that value-weighted attention lands on the off-diagonal stripe $k = j - \Delta$:

$$
\mathcal{I}_i^{(\ell)} = \frac{1}{T-\Delta}\sum_{j=\Delta+1}^{T}\hat{A}_{i,\,j,\,j-\Delta}^{(\ell)}
$$

Any head whose score crosses a threshold $\tau$ (we set it at the 95th percentile of attention mass under a null model) gets flagged as an induction head. In code that whole idea is barely a few lines:

```python
@torch.no_grad()
def induction_score(pattern, values, delta):
    # pattern: [n_heads, T, T] attention weights for one layer
    # values:  [n_heads, T, d_head] value vectors for that layer
    v_norms  = values.norm(dim=-1)                  # [n_heads, T]
    weighted = pattern * v_norms.unsqueeze(-2)      # value-weight every attended pos
    # average the off-diagonal stripe k = j - delta
    stripe = weighted.diagonal(offset=-delta, dim1=-2, dim2=-1)
    return stripe.mean(dim=-1)                       # one score per head
```

## Scaling up: GPT-2

Toy models are perfect for *understanding*, but the obvious question is whether any of this survives in a real model that was never built to be interpreted. So we run the same analysis on GPT-2 [5].

{/* 🔥 FIGURE — attention heatmaps for two GPT-2 Layer-1 heads (the paper uses heads 5 and 10). One should show a previous-token pattern (just-below-diagonal), the other the induction off-diagonal stripe. Same heatmap styling as the toy-model maps above. */}
![GPT-2, Layer 1 heads 5 and 10 — the same previous-token + induction pair we built by hand, now found in a real model|100%](gpt2-layer1-heads-5-10.png)

And there they are. In Layer 1, heads 5 and 10 show the exact two roles we assembled by hand: a previous-token head and an induction head, the same pair Wang et al. pulled out when they reverse-engineered induction in GPT-2 [6]. The mechanism we grew inside a 2-layer attention-only toy is the *same* mechanism a full language model discovered on its own.

> The circuit we described isn't an artifact of our simplified setup, it is a fundamental piece of how transformers learn to use their context.

## So what did depth actually buy us?

The picture is clean and a little surprising. Induction heads simply **do not exist** in the one-layer model, and they appear **reliably** the moment we add a second layer. It is not a smooth ramp in accuracy, it is a switch being flipped.

A single layer just does not have the computational depth to compose the QK and OV circuits into two-step reasoning. The QK circuit can detect token identity, and the OV circuit can copy token features, but without a second layer to *chain* these operations, the model can never pull off the *"find where this token appeared, then predict what came after it"* maneuver that induction demands.

This lines up beautifully with Olsson et al. [3], who found that induction heads form during training at a sharp **phase transition**, the very moment the loss curve takes a sudden dip. Our experiments add a structural angle to that story: the transition isn't only an accident of training dynamics, it is *forced* by depth. You cannot build an induction head shallower than two layers, no matter how long you train.

### Where to go next

A few threads we would love to pull on:

- Watch this transition unfold *during training* rather than across fixed depths, and check whether it coincides with the loss drop.
- See whether the critical threshold for induction shifts with sequence length or vocabulary size.
- Bring MLPs back into the picture and study how induction interacts with **polysemanticity** [7], the messy, distributed representations we deliberately avoided here.

<hr/>

All the code, the toy models, and the GPT-2 analysis live here:

<GitHubRepo owner="yuralo" repo="Mechanistic-Interpretability" />
