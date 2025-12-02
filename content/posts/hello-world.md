---
title: "Hello World"
date: "2023-10-27"
description: "Welcome to my new personal website built with Next.js and Tailwind CSS."
tags: ["nextjs", "personal", "webdev"]
---

# Welcome to My Digital Garden

This is the first post on my new personal website. I built this using **Next.js 15**, **Tailwind CSS**, and **Framer Motion**. It features a custom "Neural Architect" theme inspired by terminal aesthetics.

## Features Showcase

### 1. Syntax Highlighting
Here is a code snippet showing how I fetch GitHub data, styled with `rehype-pretty-code`:

```typescript
export async function getGitHubContributions() {
  const res = await fetch(
    `https://github-contributions-api.jogruber.de/v4/bahaa?y=last`
  );
  return res.json();
}
```

### 2. Smart Citations
I can cite papers or resources easily. For example, the original Transformer paper [1] revolutionized NLP. I can also cite multiple sources at once [1, 2].

### 3. Image Handling
Images are automatically optimized and styled.

![Cellular Automata](/images/posts/hello-world/spm.png)

### 4. Typography
- **Bold** and *Italic* text
- [Links](https://nextjs.org) with custom hover effects
- Lists and blockquotes:

> "The best way to predict the future is to invent it."
> — Alan Kay

## References
[1] Vaswani, A., et al. (2017). Attention Is All You Need.
[2] Devlin, J., et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding.
