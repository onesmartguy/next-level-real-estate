---
description: Clone a voice using ElevenLabs with professional audio samples and optimal settings for natural, high-quality results
---

Create a professional voice clone using ElevenLabs.

## Requirements

1. **Audio Samples** (3+ files recommended):
   - Clean, no background noise
   - Varied emotions and styles
   - 60s minimum (3 hours optimal)
   - Record in target language

2. **Recording Quality**:
   - Acoustically-treated room
   - Professional microphone
   - 2 fists distance from mic
   - Consistent technique

## Workflow

1. Prepare audio samples (review quality)
2. Use `mcp__elevenlabs__voice_clone` tool
3. Provide descriptive name and description
4. Test clone with sample text
5. Refine if needed (re-record samples)

## Usage

```javascript
await mcp__elevenlabs__voice_clone({
  name: "Professional Narrator",
  files: ["sample1.mp3", "sample2.mp3", "sample3.mp3"],
  description: "Warm, authoritative voice for educational content"
})
```

Provide guidance on:
- Optimal recording techniques
- Sample diversity (emotions, paces, styles)
- Quality verification
- Testing and refinement
