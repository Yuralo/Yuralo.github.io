---
title: "Hello World"
date: "2023-10-27"
description: "Welcome to my new personal website built with Next.js and Tailwind CSS."
tags: ["nextjs", "personal", "webdev"]
public: true
---

# Welcome to My Digital Garden

This is the first post on my new personal website. I built this using **Next.js 15**, **Tailwind CSS**, and **Framer Motion**. It features a custom "Neural Architect" theme inspired by terminal aesthetics.

## Features Showcase

### 1. Syntax Highlighting & Copy Code
Here is a code snippet showing how I fetch GitHub data, styled with `rehype-pretty-code`. **Hover over any code block to see the copy button!**

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

### 3. Enhanced Image Viewer
Images now have a beautiful zoom feature! Click any image to view it in fullscreen. Press Escape or click outside to close.

**Full width image (default):**
![Cellular Automata](spm.png)

**Smaller images - use size hints in alt text:**
![Cellular Automata|50%](spm.png)

![Cellular Automata|width:75%](spm.png)

You can also use keywords: `small` (50%), `medium` (75%), or `large` (100%):
![Cellular Automata|small](spm.png)

**Features:**
- Click to zoom in fullscreen
- Press Escape to close
- Smooth animations
- Image captions supported
- Control image size with `|50%`, `|width:75%`, `|small`, `|medium`, or `|large` in alt text
- No borders - clean, modern look
- Full width by default

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

### 6. Typography & Reading Experience
- **Bold** and *Italic* text
- [Links](https://nextjs.org) with custom hover effects
- Lists and blockquotes:

> "The best way to predict the future is to invent it."
> — Alan Kay

**New Reading Features:**
- **Reading Time**: See estimated reading time at the top of each post
- **Reading Progress**: Watch the progress bar at the top as you scroll
- **Focus Mode**: Click the focus button (bottom right) to hide distractions
- **Share Buttons**: Share posts on Twitter, LinkedIn, or copy the link
- **Related Posts**: Discover similar content at the end of each post
- **Anchor Links**: All headings are linkable - try clicking a heading in the table of contents!

### 7. GitHub Repository Links
You can embed beautiful GitHub repository cards directly in blog posts! Here's an example:

<GitHubRepo owner="yuralo" repo="Mechanistic-Interpretability" />

The component automatically fetches repository information including stars, forks, language, and topics. Click the card to visit the repository on GitHub!

## References
[1] Vaswani, A., et al. (2017). Attention Is All You Need.
[2] Devlin, J., et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding.
