---
title: "Hello World"
date: "2023-10-27"
description: "Welcome to my new personal website built with Next.js and Tailwind CSS."
tags: ["nextjs", "personal", "webdev"]
public: false
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

### 4. C/C++ Code Execution (WebAssembly)
You can run C code directly in the browser! Here's the source:

```c
#include <stdio.h>

int main() {
    printf("Hello from WebAssembly!\n");
    printf("This C code is running in your browser!\n");
    
    int numbers[5] = {1, 2, 3, 4, 5};
    int sum = 0;
    
    for (int i = 0; i < 5; i++) {
        sum += numbers[i];
    }
    
    printf("Sum of [1,2,3,4,5] = %d\n", sum);
    
    return 0;
}
```


### 5. LaTeX Math Equations
I can now write beautiful mathematical equations using LaTeX! Here are some examples:

**Inline math**: The famous equation $E = mc^2$ by Einstein, or the Pythagorean theorem $a^2 + b^2 = c^2$.

**Block equations**: Here's the quadratic formula:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

And here's a more complex example showing matrix multiplication:

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
e & f \\
g & h
\end{bmatrix}
=
\begin{bmatrix}
ae + bg & af + bh \\
ce + dg & cf + dh
\end{bmatrix}
$$

You can also write integrals, summations, and more:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

### 6. Typography
- **Bold** and *Italic* text
- [Links](https://nextjs.org) with custom hover effects
- Lists and blockquotes:

> "The best way to predict the future is to invent it."
> — Alan Kay

## References
[1] Vaswani, A., et al. (2017). Attention Is All You Need.
[2] Devlin, J., et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding.
