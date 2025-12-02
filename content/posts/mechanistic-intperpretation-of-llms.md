---
title: "Mechanistic Interpretation of LLMs"
date: "2025-12-02"
description: "Welcome to my new personal website built with Next.js and Tailwind CSS."
tags: ["Python", "LLMs", "Mechanistic Interpretation"]
---

In here I would like to talk about a topic that is not usually talked about, the topic is basically how so number actually learn to do all those abilites my friends here talked about meaning how numbers and embedding after some kind of mathmatical operations are actually learning so really tough concepts like in-context learning and CoT in my opinion this not really appreciated in-context learning literally means that the model is learning to learn !!!


observing model capabilities that are suggestive of introspection. For instance, prior work has shown that models have some ability to estimate their own knowledge 
[1, 2, 3] , predict their own behavior 
[4, 5] , identify their learned propensities 
[6, 7] , and recognize their own outputs 
[8, 4]  

## A Mathematical Framework for Transformer Circuits


they explored various models some small attention only models
they showed that: 

**In zero layer transformers** the models learns a bigram statistics 
and the bigram table could be accessed directly from weights meaning the embedding itself is normally a bigram

**One layer attention-only transformers** are an ensemble of bigram and “skip-trigram” 
Note: [this is not true since we can show an example that disapprove that the model could express some things (xor for example) this and also the model could express things even skip quadgrams cannot solve (basically because of the soft-max non-linearity)](https://www.lesswrong.com/posts/b5HNYh9ne5vEkX5ag/one-layer-transformers-aren-t-equivalent-to-a-set-of-skip)

**Two layer attention-only transformers** can implement much more complex algorithms using compositions of attention heads, something like a very general in-context learning 


why are we removing the mlp here ?
well due to the phenomenon of superposition, since MLP layer Neurons are typically unexplainable  [Black](https://www.alignmentforum.org/posts/eDicGjD9yte6FLSie/interpreting-neural-networks-through-the-polytope-lens) [et al.](https://www.alignmentforum.org/posts/eDicGjD9yte6FLSie/interpreting-neural-networks-through-the-polytope-lens)
what do we mean by superposition: **multiple distinct features in the same set of parameters**,
meaning a neuron **stores multiple different features at once.**
and hence it is shown that models are storing many more features than it has neurons
....
.....

before going into more details we need to emphases how models LLMs usually works specifically from the point of the residual stream

we have basically the embedding layer first and then each layer perform its own transformation and then we add those to our residual stream ........... (go on how it works)

![[Unknown.png]]

explain here also the 2 paths of QK & OV

![[2-paths.png]]


in the one-layer example we can see early signs of in-context learning:
Which is copying or using similar words (even contextually)


meaning the attention heads dedicate enormous fraction of their capacity to copying 
and we can see the model learning a skip Tri-gram
copying is really interesting behavior since in it shows in long context the token can map the same vector to itself  

![[2123.png]]
![[Screenshot 2025-11-15 at 6.14.21 PM.png]]

![[Screenshot 2025-11-15 at 6.15.44 PM.png]]
  
meaning something quite far in the context can now influence the next token inside the context itself which is what we call copying 

I have to emphases that here we aren't really running the model we are just literally reading weights 

**Two layer attention-only transformers**
![[Screenshot 2025-11-16 at 5.30.54 PM.png]]
using Eigenvalue analysis we can see that 10 heads are being used for copying

![[Screenshot 2025-11-16 at 5.28.25 PM.png]]
also in lambd and nbsp case we can also see that it is somewhat learning to correct or proceed correctly in complex let's say languages (or special cases)

![[Screenshot 2025-11-16 at 8.34.40 PM.png]]

![[Screenshot 2025-11-16 at 8.36.25 PM.png]]
![[Screenshot 2025-11-16 at 8.38.42 PM]]

Here we can find a glimmer of in-context learning and nail it down 



From now on we will be moving to a much more complex models than a simple 1 or 2 layers attention only models and 
### In-context Learning and Induction Heads by anthropic

in-context learning the ability to predict later tokens from earlier ones gets better, it can increasingly be used in interesting ways (such as specifying tasks, giving instructions, translations, or asking the model to match a pattern) that suggest it can usefully be thought of as a phenomenon of its own.

tokens later in the context are easier to predict than tokens earlier in the context 
As the context gets longer, loss goes down


Introducing induction head a circuit of neurons inside the attention heads in different layers that when working together can for the most part explain copying, patter completion or more generally in-context learning 

They work by searching the context for previous instances of the present token, attend to the token which would come next if the pattern repeated, and increase its probability.
we also argue here that induction heads are implementing an algorithm and not memorizing fixed table of n-grams statistics (like the model is not learning this comes after this no)
The rule `[A][B] … [A] → [B]`,  `[A*][B*] … [A] → [B]` where applies regardless of what `A` and `B` are

`A*` is not exactly the same token as `A` but similar in some embedding space, and also `B` is not exactly the same token as `B*`

Also we can show that in attention only models the in-context go on a phase change meaning the model is experiencing an Aha moment

 ![[Screenshot 2025-11-17 at 6.32.41 PM.png]]

Ok now the Behavior that are being learned to form the in-context learning

1- copying 

so to show it exactly by repeating the same sentence in the context and see how the model is attending to previous examples to copy from 

![[Screenshot 2025-11-17 at 6.42.09 PM.png]]

2- Translation

It's a well-known result that language models can translate between languages
and we can see that induction heads can also do translation

![[Screenshot 2025-11-17 at 7.30.29 PM.png]]

3- Pattern matching 

so making some pattern we can also show that when predicting the model is attending to similar things for example generating data of this patter:

- (month) (animal): 0
- (month) (fruit): 1
- (color) (animal): 2
- (color) (fruit): 3

![[spm.png]]





abilites it learned:
Detecting dates, identity 
Detecting writing styles
Additions 
IN-context learning 
Chain of thoughts

code generation:
it knows the keywords
and able to 


Notes
*Examples of these abilities are diverse, ranging from multi-step arithmetic and unscrambling words to more complex tasks like understanding social situations or implied meanings.[9, 10] This phenomenon has been likened to phase transitions in physics, where a quantitative change in a system parameter (e.g., temperature) leads to a sudden, qualitative change in the system's state (e.g., water turning to ice).[4, 8, 11]*


*How does Chain of Thought Think? Mechanistic Interpretability of Chain-of-Thought Reasoning with Sparse Autoencoding - arXiv*

A. Case Study 1: "Grokking" as the Archetype for Mechanistic Prediction

"Grokking" is perhaps the most important case study for understanding the relationship between MI and emergence.

***1. The Behavioral Observation** Grokking, first observed in small models trained on synthetic tasks like modular arithmetic, is a perfect analog for an emergent ability.[21, 30, 31] During training, the model first memorizes the training data, achieving high training accuracy but near-random test accuracy. Then, long after the training loss has converged (i.e., the model appears to have "finished" learning), the test accuracy suddenly and unpredictably jumps from 0% to 100%.[21, 31] This is a clear, sharp, and unpredictable behavioral leap.*

*The generalizing circuit, which correctly implements modular addition using a complex "Fourier multiplication" algorithm (mapping numbers to sines/cosines on a circle), is formed slowly and gradually during the entire training process.[30, 31]*