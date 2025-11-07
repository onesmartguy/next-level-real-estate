# ai-voice-audio

> ElevenLabs voice cloning, text-to-speech with natural expression, sound effects, and audio production workflows

**Version:** 1.2.3
**Category:** ai-ml
**Author:** Seth Hobson

## Overview

### What This Plugin Does

ElevenLabs voice cloning, text-to-speech with natural expression, sound effects, and audio production workflows

### Primary Use Cases

- Elevenlabs workflows
- Voice Cloning workflows
- Text To Speech workflows
- Audio workflows
- Ai Voice workflows

### Who Should Use This

- Developers working with ai-ml systems
- Teams requiring ai voice audio capabilities
- Projects leveraging 3 specialized agents for task automation

## Quick Start

### Installation

1. Install the plugin in Claude Code:
```bash
# Add to your .claude-plugin/marketplace.json or install via Claude Code CLI
```

2. Verify installation:
```bash
# List available agents
claude agents list | grep ai-voice-audio
```

### Basic Usage

Invoke the primary agent:
```bash
# Using the elevenlabs-pro agent
@elevenlabs-pro <your request>
```

Or use the command interface:
```bash
/ai-voice-audio:voice-clone <arguments>
```

## Agents Reference

This plugin provides **3 specialized agents**:

### elevenlabs-pro

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Expert in ElevenLabs AI services including text-to-speech, voice cloning, speech-to-text, sound effects, and conversational AI agents with human-like naturalness techniques. Use PROACTIVELY when generating voices, cloning voices, creating sound effects, or building conversational AI with natural-sounding speech.

**When to Use Proactively:**
- Expert in ElevenLabs AI services including text-to-speech, voice cloning, speech-to-text, sound effects, and conversational AI agents with human-like naturalness techniques
- When you need specialized elevenlabs pro expertise

**Example Invocation:**
```bash
@elevenlabs-pro <specific task or question>
```

### voice-design-specialist

**Model:** haiku - Fast execution and deterministic tasks

**Purpose:** Voice characteristic analysis, cloning optimization, prompt engineering for natural voices, and sound effect design. Use PROACTIVELY when designing custom voices, optimizing voice clones, or creating unique audio identities.

**When to Use Proactively:**
- Voice characteristic analysis, cloning optimization, prompt engineering for natural voices, and sound effect design
- When you need specialized voice design specialist expertise

**Example Invocation:**
```bash
@voice-design-specialist <specific task or question>
```

### audio-producer

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Orchestrates complete audio production workflows from voice generation to sound effects, editing, mixing, and final delivery with professional quality. Use PROACTIVELY when producing podcasts, audiobooks, video voiceovers, or multi-track audio content.

**When to Use Proactively:**
- Orchestrates complete audio production workflows from voice generation to sound effects, editing, mixing, and final delivery with professional quality
- When you need specialized audio producer expertise

**Example Invocation:**
```bash
@audio-producer <specific task or question>
```

## Skills Reference

This plugin includes **4 progressive disclosure skills** for advanced patterns:

### audio-editing-automation

**Description:** FFmpeg audio processing, batch editing, normalization, mixing, and automated audio production workflows. Use when processing audio at scale, automating editing tasks, or building audio pipelines.

**Activation Triggers:**
FFmpeg audio processing, batch editing, normalization, mixing, and automated audio production workflows. Use when processing audio at scale, automating editing tasks, or building audio pipelines.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

### text-to-speech-optimization

**Description:** Advanced text-to-speech optimization with expressional tone guides, natural speech patterns, prosody control, and human-like conversation techniques to create authentic-sounding AI voices. Use when generating natural speech, creating engaging content, or producing professional voiceovers.

**Activation Triggers:**
Advanced text-to-speech optimization with expressional tone guides, natural speech patterns, prosody control, and human-like conversation techniques to create authentic-sounding AI voices. Use when generating natural speech, creating engaging content, or producing professional voiceovers.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

### sound-effect-sourcing

**Description:** Sound effect sourcing from Adobe Audition, Freesound, ElevenLabs text-to-sound-effects, and audio library management for professional productions. Use when adding sound effects, building audio libraries, or creating immersive soundscapes.

**Activation Triggers:**
Sound effect sourcing from Adobe Audition, Freesound, ElevenLabs text-to-sound-effects, and audio library management for professional productions. Use when adding sound effects, building audio libraries, or creating immersive soundscapes.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

### elevenlabs-voice-cloning

**Description:** ElevenLabs voice cloning techniques, audio quality requirements, recording best practices, and training data optimization for professional-quality voice clones. Use when creating custom voices, cloning voices, or optimizing voice clone quality.

**Activation Triggers:**
ElevenLabs voice cloning techniques, audio quality requirements, recording best practices, and training data optimization for professional-quality voice clones. Use when creating custom voices, cloning voices, or optimizing voice clone quality.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

## Commands Reference

This plugin provides **2 slash commands**:

### /ai-voice-audio:voice-clone

**Description:** Clone a voice using ElevenLabs with professional audio samples and optimal settings for natural, high-quality results

**Usage:**
```bash
/ai-voice-audio:voice-clone [options]
```

### /ai-voice-audio:audio-produce

**Description:** Produce professional audio content with AI voices, sound effects, music, and mixing for podcasts, audiobooks, or voiceovers

**Usage:**
```bash
/ai-voice-audio:audio-produce [options]
```

## Complete Workflow Examples

### Example 1: Basic Workflow

1. Initialize with command:
```bash
/ai-voice-audio:voice-clone
```

2. Work with agent:
```bash
@elevenlabs-pro implement the feature
```

3. Review and iterate

### Example 2: Advanced Workflow

Multi-agent coordination:

1. Architecture planning: `@elevenlabs-pro`
2. Implementation: `@voice-design-specialist`
3. Review and refinement

## Plugin Relationships

### Similar Plugins


### Differences from Similar Plugins

The `ai-voice-audio` plugin focuses specifically on elevenlabs voice cloning, text-to-speech with natural expression, sound effects, and audio production workflows, while similar plugins may have broader or different specializations.

### Works Well With


### Integration Patterns

- **Sequential workflows:** Chain multiple agents for complex tasks
- **Parallel execution:** Run independent agents simultaneously
- **Context sharing:** Maintain state across agent interactions

## Best Practices

### Do's

- Use `@elevenlabs-pro` for primary tasks in this domain
- Follow the plugin's specialized patterns for ai-ml
- Leverage progressive disclosure skills for advanced features
- Combine with complementary plugins for full-stack workflows

### Don'ts

- Don't use this plugin for tasks outside its domain
- Avoid mixing incompatible plugin patterns
- Don't skip the recommended workflow steps

### Common Pitfalls

1. **Over-complexity:** Start simple, add features incrementally
2. **Wrong agent:** Use the right agent for the task
3. **Missing context:** Provide sufficient background information

### Optimization Tips

- Use progressive disclosure to load only needed knowledge
- Cache agent responses when appropriate

## Troubleshooting

### Common Issues

**Issue:** Agent not responding as expected

**Solution:**
- Verify plugin installation
- Check agent name spelling
- Provide more context in your request

**Issue:** Skill not activating

**Solution:**
- Ensure trigger criteria match your use case
- Explicitly mention the skill in your request

### Error Messages


| Error | Cause | Solution |
|-------|-------|----------|
| Agent not found | Plugin not installed | Verify installation |
| Skill unavailable | Path mismatch | Check skill directory structure |
| Command failed | Missing dependencies | Review prerequisites |

### Debugging Techniques

1. **Verbose mode:** Request detailed explanations from agents
2. **Step-by-step:** Break complex tasks into smaller steps
3. **Isolation:** Test agents individually before combining

## Advanced Topics

### Power User Features

- **audio-editing-automation:** Advanced patterns for power users
- **text-to-speech-optimization:** Advanced patterns for power users

### Customization Options

- Adapt agent instructions for your workflow
- Extend skills with custom patterns
- Configure progressive disclosure depth

### Performance Tuning

- Use Haiku agents for speed-critical paths
- Batch similar operations
- Optimize context window usage


## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/wshobson/agents) for guidelines.

## License

MIT

## Support

- **Issues:** [GitHub Issues](https://github.com/wshobson/agents/issues)
- **Discussions:** [GitHub Discussions](https://github.com/wshobson/agents/discussions)
- **Documentation:** [Full Documentation](https://github.com/wshobson/agents)

---

**Plugin:** ai-voice-audio v1.2.3
**Last Updated:** 1.2.3
**Agents:** 3 | **Skills:** 4 | **Commands:** 2
