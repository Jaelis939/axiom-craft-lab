# Foundation Forge

MASTER PROJECT: Build My Own Foundation AI Model From Scratch

You are the lead AI researcher, ML engineer, distributed-systems engineer, backend engineer, frontend engineer, DevOps engineer, data engineer, and QA engineer for this project.

I want to create my own AI foundation model from scratch.

Do NOT simply wrap an existing model such as GPT, Claude, Gemini, Llama, Mistral, Qwen, DeepSeek, or another third-party LLM and call it my own model.

The core model, tokenizer, training pipeline, inference system, evaluation system, memory architecture, tool system, and application infrastructure must be designed and implemented as my own project.

The goal is to eventually create a highly capable general-purpose AI assistant comparable in architecture and product capability to modern frontier assistants, while starting with a realistically trainable model and providing a path toward scaling.

Do not pretend that a small local computer can train a frontier-scale model. Design the system so that it can start locally and later scale to cloud GPU clusters.

1. CORE REQUIREMENT

Build the project as a real AI research platform rather than a demo.

The system must have:

Custom tokenizer

Custom model implementation

Transformer-based architecture

Configurable model sizes

Pretraining pipeline

Continued-pretraining pipeline

Supervised fine-tuning

Preference optimization

Instruction tuning

Evaluation framework

Inference engine

Streaming generation

Conversation management

Long-context support

Retrieval system

Memory system

Tool calling

Code execution architecture

Web-search integration architecture

Agent framework

Safety system

Observability

Experiment tracking

Dataset management

Checkpoint management

Distributed-training support

Quantization

Model export

API server

Web application

Automated testing

Everything must be modular.

Do not create one enormous file.

Use clean interfaces and separate packages.

2. IMPORTANT DEVELOPMENT PHILOSOPHY

Do not claim something works unless it has actually been tested.

For every major feature:

Implement it.

Create a test.

Run the test.

Fix failures.

Run the test again.

Document the result.

Never use fake implementations such as:

TODO
Coming soon
Mock AI response
Pretend model
Fake inference
Hardcoded answer
Placeholder tokenizer
Simulated training


unless explicitly placed inside a clearly separated prototype/test environment.

The final architecture must contain real implementations.

If a feature cannot realistically run on the available hardware, implement the scalable architecture and provide a local-development mode.

3. TECHNOLOGY STACK

Use a professional ML stack.

Preferred technologies:

Backend / ML:

Python

PyTorch

CUDA support

Hugging Face-compatible dataset/tokenization interfaces where useful

NumPy

FastAPI

Pydantic

asyncio

Frontend:

TypeScript

React

Vite

Tailwind CSS

modern component architecture

Infrastructure:

Docker

Docker Compose

PostgreSQL

Redis where appropriate

object storage abstraction

experiment/checkpoint storage

Testing:

pytest

frontend unit tests

integration tests

end-to-end tests

load tests

Do not unnecessarily add dependencies.

Every dependency must have a reason.

4. PROJECT ARCHITECTURE

Create a monorepo similar to a serious AI research organization.

Use a structure similar to:

my-ai/
│
├── apps/
│   ├── web/
│   ├── api/
│   └── playground/
│
├── model/
│   ├── architecture/
│   ├── attention/
│   ├── embeddings/
│   ├── normalization/
│   ├── layers/
│   ├── config/
│   └── model.py
│
├── tokenizer/
│
├── training/
│   ├── pretraining/
│   ├── finetuning/
│   ├── sft/
│   ├── preference/
│   ├── distributed/
│   ├── checkpointing/
│   └── schedulers/
│
├── data/
│   ├── ingestion/
│   ├── cleaning/
│   ├── filtering/
│   ├── deduplication/
│   ├── tokenization/
│   └── datasets/
│
├── inference/
│   ├── engine/
│   ├── batching/
│   ├── kv_cache/
│   ├── sampling/
│   └── streaming/
│
├── evaluation/
│   ├── benchmarks/
│   ├── reasoning/
│   ├── coding/
│   ├── math/
│   ├── knowledge/
│   ├── instruction/
│   └── safety/
│
├── memory/
│   ├── conversation/
│   ├── semantic/
│   ├── episodic/
│   └── retrieval/
│
├── tools/
│   ├── registry/
│   ├── web/
│   ├── calculator/
│   ├── code/
│   └── filesystem/
│
├── agents/
│
├── safety/
│
├── scripts/
│
├── configs/
│
├── tests/
│
├── docs/
│
├── docker/
│
└── README.md


Adjust the architecture when necessary, but maintain strong separation of concerns.

5. CUSTOM TOKENIZER

Create the tokenizer ourselves.

Do not simply assume an existing tokenizer is our final tokenizer.

Implement:

vocabulary construction

normalization

pre-tokenization

special tokens

encoding

decoding

batch encoding

padding

truncation

vocabulary statistics

tokenizer serialization

tokenizer loading

tokenizer tests

The tokenizer must support:

English

programming languages

numbers

punctuation

URLs

Unicode

multilingual text

Create tooling to train the tokenizer from our own permitted training corpus.

Generate tokenizer statistics.

6. MODEL ARCHITECTURE

Create a configurable decoder-only language model.

The architecture should support:

token embeddings

positional encoding

attention

causal masking

MLP blocks

normalization

residual connections

output projection

configurable depth

configurable hidden dimension

configurable number of attention heads

configurable context length

configurable vocabulary size

Use modern architectural techniques where appropriate, but keep them configurable.

Implement:

ModelConfig
Attention
MLP
TransformerBlock
Transformer
LanguageModel


The model must support multiple sizes.

For example:

Tiny
Small
Medium
Large
XL


The exact dimensions must be configurable through YAML/JSON configuration.

7. ATTENTION SYSTEM

Implement efficient causal self-attention.

Support:

causal attention

attention masking

KV caching

batched inference

variable sequence lengths

memory-efficient attention

optional optimized attention backends

Design the code so future implementations such as FlashAttention can be plugged in without rewriting the entire model.

8. CONTEXT LENGTH

Design the architecture for scalable context length.

The configuration should allow:

4K
8K
16K
32K
64K
128K+


Do not claim that extremely long context automatically works efficiently.

Benchmark memory consumption and latency at every supported context length.

9. TRAINING SYSTEM

Build a complete training engine.

It must support:

gradient accumulation

mixed precision

gradient clipping

learning-rate schedules

warmup

weight decay

checkpointing

resume training

validation

logging

experiment IDs

random seeds

deterministic modes where possible

automatic checkpoint rotation

early stopping

distributed training

Training configuration must be externalized.

Example:

model:
  hidden_size:
  num_layers:
  num_heads:
  vocab_size:
  max_sequence_length:

training:
  batch_size:
  gradient_accumulation:
  learning_rate:
  warmup_steps:
  max_steps:
  weight_decay:
  precision:

checkpoint:
  interval:
  directory:


10. HARDWARE-AWARE TRAINING

This is extremely important.

Automatically detect:

CPU

RAM

GPU

GPU VRAM

CUDA version

available disk space

CUDA capability

number of GPUs

Create a hardware profile.

Based on the detected hardware, automatically recommend:

model size

batch size

gradient accumulation

precision

context length

expected memory usage

training mode

The system must NEVER pretend that unsupported hardware can train a huge model.

Provide:

Local mode
Single GPU mode
Multi-GPU mode
Distributed cluster mode


11. DISTRIBUTED TRAINING

Prepare the project for scaling.

Support architecture for:

DistributedDataParallel

Fully Sharded Data Parallel

tensor parallelism where appropriate

pipeline parallelism where appropriate

distributed checkpointing

Do not implement fake distributed training.

If distributed functionality requires multiple GPUs, clearly detect this and provide a valid single-GPU fallback.

12. DATA PIPELINE

Create a complete dataset pipeline.

Pipeline:

Raw data
↓
Ingestion
↓
Validation
↓
Cleaning
↓
Language detection
↓
Quality filtering
↓
PII/privacy filtering
↓
Deduplication
↓
Toxicity/safety filtering
↓
Document segmentation
↓
Tokenization
↓
Packing
↓
Training shards


Support:

JSONL

JSON

TXT

Parquet

compressed datasets

streaming datasets

Create dataset manifests containing:

dataset name

version

source

license

language

token count

document count

creation timestamp

processing version

Only use legally obtained/permitted training data.

Do not build a system intended to bypass website restrictions or acquire copyrighted/private datasets illegally.

13. DATA QUALITY

Build automatic dataset analysis.

Calculate:

token counts

duplicate ratios

language distribution

document length distribution

code percentage

malformed-document percentage

quality scores

unsafe-content statistics

Create reports.

14. PRETRAINING

Create the full next-token prediction pipeline.

Training objective:

P(token_t | token_1 ... token_t-1)


Implement:

teacher forcing

cross entropy loss

token-level loss

perplexity

validation loss

training curves

Save:

model checkpoints

optimizer state

scheduler state

RNG state

tokenizer

configuration

training metadata

A training run must be fully resumable.

15. SUPERVISED FINE-TUNING

Create an SFT pipeline.

Support conversational datasets:

{
  "messages": [
    {
      "role": "system",
      "content": "..."
    },
    {
      "role": "user",
      "content": "..."
    },
    {
      "role": "assistant",
      "content": "..."
    }
  ]
}


Implement:

chat formatting

response masking

loss masking

sequence packing

validation

checkpointing

16. PREFERENCE OPTIMIZATION

Create a preference-training framework.

Support modern preference-learning approaches through modular interfaces.

The architecture should be able to support:

preference pairs

chosen/rejected responses

reward modeling

DPO-style training

other preference optimization methods later

Do not hardcode the entire system around one algorithm.

17. REASONING

Build an evaluation and training framework for reasoning.

Test:

mathematics

logic

multi-step reasoning

coding

debugging

planning

instruction following

Do not simply force the model to output hidden reasoning.

The evaluation system should measure whether the final answer is correct.

18. CODING CAPABILITY

Create coding benchmarks covering:

Python

JavaScript

TypeScript

HTML

CSS

SQL

Bash

C/C++

Java

Rust

Measure:

syntax correctness

execution correctness

unit-test success

compilation

bug fixing

code explanation

code generation

Use sandboxed execution for evaluation.

Never execute arbitrary generated code directly on the host system.

19. INFERENCE ENGINE

Create our own inference service.

Features:

model loading

tokenizer loading

prompt processing

token generation

streaming

temperature

top-p

top-k

repetition penalty

stop sequences

maximum tokens

deterministic mode

batching

KV cache

API example:

POST /v1/chat/completions
POST /v1/completions
GET  /v1/models


Make the API compatible with a familiar OpenAI-style request structure where useful, but the underlying model must remain ours.

20. MEMORY

Build a real memory system.

Separate:

Short-term memory

Current conversation.

Long-term memory

Important user preferences/facts explicitly permitted to be remembered.

Semantic memory

Embeddings + retrieval.

Episodic memory

Past interactions/events.

Create:

MemoryStore
MemoryRetriever
MemoryRanker
MemoryWriter
MemoryPolicy


The AI must not automatically store sensitive information without an appropriate policy.

21. RETRIEVAL / RAG

Build a retrieval system.

Pipeline:

Documents
↓
Chunking
↓
Embeddings
↓
Vector index
↓
Retrieval
↓
Reranking
↓
Context construction
↓
Model


Make the embedding and reranking components replaceable.

22. TOOL CALLING

Create a tool registry.

Each tool should define:

name
description
input schema
output schema
permissions
timeout
risk level


Implement examples such as:

calculator

date/time

file reading

controlled code execution

retrieval

web search abstraction

The model should decide when tools are needed.

Tools must have permission boundaries.

23. AGENT SYSTEM

Create an agent framework separate from the core language model.

Architecture:

User
↓
Model
↓
Planner
↓
Tool selection
↓
Tool execution
↓
Observation
↓
Model
↓
Final answer


Support:

multi-step tasks

tool loops

timeouts

maximum iterations

state

error recovery

cancellation

Do not make agents an inseparable part of the model.

24. SAFETY ARCHITECTURE

Create safety layers around the model.

Include:

input classification

output classification

policy engine

tool permission system

sandboxing

rate limiting

abuse detection

prompt-injection defenses

sensitive-data protection

Safety should not be implemented only as a system prompt.

25. EVALUATION PLATFORM

Create an evaluation dashboard.

Track:

Model
Version
Checkpoint
Dataset
Benchmark
Score
Latency
Tokens/sec
Memory
Cost


Benchmark:

general knowledge

reasoning

mathematics

coding

instruction following

multilingual ability

long context

hallucination

tool use

safety

Every model version should receive an evaluation report.

26. MODEL COMPARISON

Create a comparison framework.

Allow:

Model A
Model B
Model C


to be evaluated on identical datasets.

Display:

accuracy

perplexity

latency

throughput

context length

memory usage

benchmark scores

Do not make misleading claims such as “better than Claude” unless actual reproducible benchmark data supports the claim.

27. QUANTIZATION

Implement an architecture for:

FP32

FP16

BF16

INT8

INT4

where supported.

Measure:

model size

inference speed

VRAM

quality degradation

28. MODEL EXPORT

Support exporting trained checkpoints into a clean model format.

Store:

config
tokenizer
weights
generation configuration
model metadata
training metadata


Include model versioning.

Example:

my-model-0.1
my-model-0.2
my-model-1.0


29. CHAT APPLICATION

Create a polished ChatGPT-style interface for our model.

Dark premium interface.

Features:

conversations

new chat

rename chat

delete chat

search conversations

markdown

syntax highlighting

code blocks

copy button

regenerate

edit message

stop generation

streaming responses

model selector

temperature controls

context indicator

token usage

file upload

tool status

memory controls

settings

The interface should feel like a serious AI product rather than a prototype.

30. DEVELOPER API

Create API documentation.

Support:

Authentication
Models
Chat
Completions
Streaming
Embeddings
Tool calling
Files
Usage
Errors


Generate OpenAPI documentation.

31. OBSERVABILITY

Track:

request latency

tokens generated

tokens/sec

GPU utilization

VRAM usage

errors

model version

tool calls

retrieval latency

queue latency

Never log private user content unnecessarily.

32. TESTING

Create extensive automated tests.

Minimum categories:

Tokenizer tests
Model tests
Attention tests
Training tests
Dataset tests
Inference tests
API tests
Memory tests
RAG tests
Tool tests
Agent tests
Safety tests
Frontend tests
Integration tests
Performance tests


Create tiny deterministic models/datasets for CI.

CI must not require an expensive GPU.

33. BENCHMARKING

Create scripts such as:

benchmark_inference.py
benchmark_memory.py
benchmark_training.py
benchmark_context.py
benchmark_tokenizer.py
benchmark_throughput.py


Produce machine-readable results.

34. EXPERIMENT MANAGEMENT

Every training experiment should have a unique ID.

Store:

experiment/
├── config
├── logs
├── metrics
├── checkpoints
├── evaluation
└── metadata


Allow experiments to be reproduced.

35. CONFIGURATION

Never hardcode important parameters.

Create configuration files for:

model
tokenizer
training
dataset
inference
evaluation
hardware
memory
tools
safety
server
frontend


36. LOCAL DEVELOPMENT

The entire project must have a local-development mode.

Create commands similar to:

setup
train-tokenizer
prepare-data
train
evaluate
serve
chat
test
benchmark


The exact commands can differ depending on implementation.

Provide one-command startup where possible.

37. SMALL MODEL FIRST

This is critical.

Do NOT start by attempting to train an enormous model.

First create a tiny model capable of training on a very small dataset.

Verify:

Tokenizer works
↓
Dataset works
↓
Model works
↓
Loss decreases
↓
Checkpoint works
↓
Resume works
↓
Inference works
↓
Evaluation works


Then scale.

Create a progression such as:

Tiny research model
↓
Small model
↓
Medium model
↓
Large model
↓
Distributed model


The exact parameter counts should depend on available hardware and training budget.

38. OVERFITTING TEST

Include a tiny overfitting test.

Give the model a tiny dataset.

Train until it can memorize the dataset.

Verify that the loss decreases substantially.

If this fails, diagnose the model/training pipeline before proceeding.

39. DATASET REPRODUCIBILITY

Every dataset-processing operation must be versioned.

If:

dataset_v1


becomes:

dataset_v2


record exactly what changed.

40. ERROR HANDLING

Every service needs proper errors.

Never silently fail.

Return useful messages containing:

error type

cause

component

suggested fix

Do not expose secrets.

41. SECRETS

Never hardcode:

API keys

passwords

database credentials

private tokens

Use environment variables.

Create:

.env.example


but never commit actual secrets.

42. DOCUMENTATION

Create excellent documentation.

Include:

README
Architecture
Installation
Hardware requirements
Dataset preparation
Tokenizer training
Pretraining
Fine-tuning
Evaluation
Inference
API
Frontend
Deployment
Troubleshooting
Scaling
Research notes


Explain why important architectural decisions were made.

43. DEVELOPMENT ROADMAP

Build the project in phases.

Phase 1 — Foundation

Repository
architecture
configuration
environment
testing
logging

Phase 2 — Tokenizer

Tokenizer implementation
training
encoding
decoding
tests

Phase 3 — Tiny Model

Model architecture
attention
transformer blocks
forward pass
loss

Phase 4 — Training

Dataset
dataloader
optimizer
scheduler
checkpointing
validation

Phase 5 — Inference

Generation
sampling
KV cache
streaming

Phase 6 — Evaluation

Benchmarks
metrics
reports

Phase 7 — SFT

Instruction datasets
chat formatting
fine-tuning

Phase 8 — Preference Optimization

Preference datasets
optimization
evaluation

Phase 9 — RAG

Embeddings
retrieval
reranking
context construction

Phase 10 — Memory

Conversation memory
long-term memory
semantic memory

Phase 11 — Tools

Tool registry
permissions
execution
validation

Phase 12 — Agents

Planning
tool loops
state
error recovery

Phase 13 — API

Production API
authentication
streaming
rate limiting

Phase 14 — Web Application

Premium AI chat interface

Phase 15 — Scaling

Multi-GPU
distributed training
optimized inference

Phase 16 — Research

Architecture experiments
data experiments
training experiments
evaluation improvements

44. AUTOMATIC HARDWARE PROFILE

When the project starts, run hardware detection.

Show:

CPU:
RAM:
GPU:
VRAM:
CUDA:
Disk:
Recommended model:
Recommended precision:
Recommended batch size:
Recommended context:


If the hardware is insufficient for a requested experiment, explain why and automatically recommend a smaller configuration.

45. RESEARCH MODE

Create a research framework allowing me to experiment with:

attention mechanisms

positional encoding

normalization

activation functions

optimizers

learning-rate schedules

context lengths

tokenizer configurations

data mixtures

training strategies

Every experiment must be reproducible.

46. NO FAKE FRONTIER CLAIMS

This project should be ambitious but scientifically honest.

Do not say:

“Claude-level”

“GPT-level”

“Frontier-level”

unless the evaluation data actually supports such a statement.

Instead report measurable results.

Example:

Parameters:
Training tokens:
Context:
Benchmark:
Score:
Hardware:
Training time:
Inference speed:


47. AUTOMATED PROJECT AUDITOR

Create a command:

audit


It should inspect the entire repository and detect:

unfinished features

TODOs

placeholder implementations

broken imports

failing tests

missing documentation

dead code

incorrect configuration

dependency issues

security issues

performance problems

Generate:

PROJECT AUDIT REPORT


with:

Critical
High
Medium
Low


priorities.

48. SELF-VERIFICATION

After implementing every phase:

Run tests.

Run integration tests.

Start the relevant services.

Test real inference.

Inspect logs.

Benchmark the feature.

Fix discovered problems.

Repeat until stable.

Do not merely tell me:

“Implemented successfully.”

Show what was actually verified.

49. IMPLEMENTATION RULE

Work directly on the repository.

Do not only give me theoretical explanations.

When a phase is requested, actually implement it.

If you encounter an architectural problem, fix the architecture rather than creating a workaround that damages the project.

Preserve existing functionality when adding new features.

Never rewrite working components unnecessarily.

50. FIRST OBJECTIVE

Start by inspecting the current environment.

Determine:

operating system

Python version

CUDA availability

GPU

GPU VRAM

CPU

RAM

available disk

installed ML libraries

Then create the complete repository architecture.

After that:

Implement the configuration system.

Implement logging.

Implement the testing framework.

Implement the tokenizer.

Implement the smallest possible working transformer.

Create a tiny synthetic dataset.

Train the tiny model.

Verify that the loss decreases.

Save a checkpoint.

Load the checkpoint.

Generate text from it.

Create an automated test proving the complete pipeline works.

Only after this pipeline is verified should you begin scaling the model.

51. FINAL GOAL

The final system should become my own AI platform consisting of:

CUSTOM TOKENIZER
        ↓
CUSTOM FOUNDATION MODEL
        ↓
PRETRAINING
        ↓
INSTRUCTION TUNING
        ↓
PREFERENCE OPTIMIZATION
        ↓
INFERENCE ENGINE
        ↓
MEMORY
        ↓
RAG
        ↓
TOOLS
        ↓
AGENTS
        ↓
API
        ↓
WEB APPLICATION
        ↓
EVALUATION + OBSERVABILITY


Everything should be modular, testable, reproducible, scalable, and designed so that a tiny research model can eventually evolve into a much larger distributed model.

Do not stop at creating a UI.

Do not create a fake AI wrapper.

Do not use an existing LLM as the hidden brain.

Build the actual foundation-model infrastructure.

Begin with Phase 1 and continue systematically.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://axiom-craft-lab.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41135bbf-cdc3-4f36-a702-481d0826a850).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
