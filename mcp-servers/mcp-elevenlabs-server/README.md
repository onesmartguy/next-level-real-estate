# MCP ElevenLabs Server

Model Context Protocol (MCP) server that wraps the ElevenLabs Conversational AI API for **Next Level Real Estate** platform. This server provides tools for creating AI agents, managing outbound calls, and integrating conversational AI into real estate workflows.

## Features

### Conversational AI Agent Management
- **Create agents** with custom voices, greetings, and conversation strategies
- **Configure agents** with system prompts, knowledge bases, and TCPA compliance
- **Update agents** to continuously improve based on call feedback
- **List and retrieve** agent details with performance metrics

### Outbound Call Management
- **Start conversations** with dynamic context injection (lead data, property info, strategy rules)
- **Monitor conversations** in real-time with status tracking
- **Retrieve transcripts** with sentiment analysis and buyer motivation insights
- **Analyze call patterns** to optimize conversion rates

### Voice Management
- **Browse 5000+ voices** across 31 languages
- **Filter by category**, language, and voice characteristics
- **Preview voices** before selecting for agents

## Technology Stack

- **MCP SDK**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- **ElevenLabs SDK**: [@elevenlabs/elevenlabs-js](https://github.com/elevenlabs/elevenlabs-js)
- **TypeScript**: Type-safe implementation
- **Zod**: Runtime configuration validation

## Installation

### 1. Install dependencies

```bash
cd mcp-servers/mcp-elevenlabs-server
npm install
```

### 2. Configure environment

Copy the example environment file and add your ElevenLabs API key:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_TIMEOUT=60000
LOG_LEVEL=info
```

### 3. Build the server

```bash
npm run build
```

## Usage

### Running the server

```bash
npm start
```

### Development mode (with watch)

```bash
npm run dev
```

### Integration with Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "elevenlabs": {
      "command": "node",
      "args": [
        "/home/onesmartguy/projects/next-level-real-estate/mcp-servers/mcp-elevenlabs-server/dist/server.js"
      ],
      "env": {
        "ELEVENLABS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### Agent Management

#### `elevenlabs_create_agent`
Create a new conversational AI agent for outbound calling.

**Parameters**:
- `name` (required): Agent name
- `voiceId` (required): ElevenLabs voice ID
- `greeting` (required): Initial greeting message
- `systemPrompt` (required): System instructions for agent behavior
- `modelId`: Model to use (default: `eleven_flash_v2_5` for 75ms latency)
- `conversationGoal`: Primary goal of the conversation
- `interruptionSensitivity`: Turn-taking sensitivity (`low`, `medium`, `high`)
- `language`: Primary language (default: `en`)
- `autoDetectLanguage`: Auto-detect and switch languages (default: `true`)
- `knowledgeBase`: Array of knowledge base document IDs for RAG
- `tcpaCompliance`: Enable TCPA compliance checks (default: `true`)
- `recordingConsent`: Require recording consent (default: `true`)

**Example**:
```typescript
{
  "name": "Real Estate Wholesale Lead Qualifier",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "greeting": "Hi, this is Sarah from Next Level Real Estate. How are you today?",
  "systemPrompt": "You are a professional real estate wholesaler calling motivated sellers...",
  "conversationGoal": "Qualify lead and schedule property viewing",
  "interruptionSensitivity": "high",
  "tcpaCompliance": true
}
```

#### `elevenlabs_get_agent`
Get detailed configuration and metrics for a specific agent.

#### `elevenlabs_list_agents`
List all agents with performance metrics.

#### `elevenlabs_update_agent`
Update agent configuration.

### Conversation Management

#### `elevenlabs_start_conversation`
Start an outbound call with dynamic context injection.

**Parameters**:
- `agentId` (required): ID of the agent to use
- `leadData`: Lead information (name, phone, email, motivation)
- `propertyInfo`: Property details (address, value, condition)
- `strategyRules`: Real estate strategy rules (wholesale criteria, ARV)
- `maxDuration`: Maximum call duration in seconds (default: 300)
- `recordConversation`: Record for transcript (default: `true`)

**Example**:
```typescript
{
  "agentId": "agent_abc123",
  "leadData": {
    "name": "John Smith",
    "phone": "+1234567890",
    "motivation": "probate",
    "timeline": "urgent"
  },
  "propertyInfo": {
    "address": "123 Main St, Austin, TX",
    "estimatedValue": 250000,
    "condition": "needs_repairs"
  },
  "strategyRules": {
    "minEquity": 0.2,
    "targetARV": 300000
  }
}
```

#### `elevenlabs_get_conversation`
Retrieve conversation details, transcript, and sentiment analysis.

#### `elevenlabs_list_conversations`
List all conversations with aggregate metrics.

### Voice Management

#### `elevenlabs_list_voices`
List available voices with filtering.

**Parameters**:
- `category`: Filter by category (e.g., `professional`, `conversational`)
- `language`: Filter by language code (e.g., `en`, `es`)
- `availableForTts`: Only show TTS-capable voices (default: `true`)

#### `elevenlabs_get_voice`
Get detailed information about a specific voice.

## Architecture

This MCP server follows the **proven patterns** from the `mcp-comic-strip-studio` reference implementation:

### Client Abstraction
- Testable client interface with dependency injection
- Health checks on startup
- Configurable timeouts and retry logic

### Tool Organization
- Category-based organization (conversation/, voices/, audio/)
- Single responsibility per tool
- Consistent error handling

### Error Handling
- Two-level error catching (tool + server)
- User-friendly error messages
- Comprehensive logging to stderr

### Type Safety
- TypeScript interfaces for all data structures
- Zod validation for runtime configuration
- Type-safe client abstraction

## Real Estate Use Cases

### 1. Lead Qualification (5-Minute Rule)
```typescript
// Create agent for rapid lead response
const agent = await elevenlabs_create_agent({
  name: "5-Minute Response Agent",
  voiceId: "professional_voice_id",
  greeting: "Hi, I saw you just inquired about selling your property...",
  systemPrompt: "Qualify lead within 2 minutes. Ask about: motivation, timeline, property condition, equity.",
  conversationGoal: "Schedule property viewing within 48 hours",
  tcpaCompliance: true
})

// Start call immediately on lead webhook
await elevenlabs_start_conversation({
  agentId: agent.agentId,
  leadData: webhookData,
  maxDuration: 180  // 3 minutes max
})
```

### 2. Market Research Calls
```typescript
const agent = await elevenlabs_create_agent({
  name: "Market Intelligence Agent",
  systemPrompt: "Conduct market research on property values, recent sales, and seller motivations...",
  knowledgeBase: ["market_trends.pdf", "comparable_sales.csv"],
  conversationGoal: "Gather intel on neighborhood trends"
})
```

### 3. Follow-Up Campaign
```typescript
// Update agent based on successful call patterns
await elevenlabs_update_agent(agentId, {
  systemPrompt: "Updated based on top-performing transcripts...",
  knowledgeBase: ["successful_objection_handling.md"]
})
```

## Best Practices

### TCPA Compliance (2025 Regulations)
- **Always enable** `tcpaCompliance: true` and `recordingConsent: true`
- Verify consent before making automated calls
- Check national DNC registry
- Maintain audit trail of all calls

### Conversation Optimization
- **Start with Flash 2.5** model for 75ms latency
- **Use high interruption sensitivity** for natural turn-taking
- **Inject context dynamically** at call start for personalization
- **Analyze transcripts** to improve knowledge base continuously

### Knowledge Base Management
- **Feed successful call transcripts** back to knowledge base
- **A/B test** different system prompts and greetings
- **Track sentiment** to identify what resonates with leads
- **Update agents weekly** based on performance metrics

## Troubleshooting

### Health check fails
- Verify `ELEVENLABS_API_KEY` is correct
- Check network connectivity to ElevenLabs API
- Ensure API key has necessary permissions

### Call quality issues
- Reduce `responseLatency` for faster responses
- Increase `interruptionSensitivity` for better turn-taking
- Test different voices with preview URLs
- Review system prompt for clarity

### Agent not working
- Check agent status with `elevenlabs_get_agent`
- Verify voice ID is valid and available for TTS
- Review conversation logs for errors
- Test with minimal configuration first

## Development

### Project Structure
```
mcp-elevenlabs-server/
├── src/
│   ├── server.ts              # Main server entry point
│   ├── types/                 # TypeScript type definitions
│   ├── clients/               # ElevenLabs client abstraction
│   ├── tools/                 # Tool implementations
│   │   ├── conversation/      # Agent and conversation tools
│   │   └── voices/            # Voice management tools
│   └── utils/                 # Configuration and utilities
├── package.json
├── tsconfig.json
└── README.md
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
npm run format
```

## License

MIT

## Related Documentation

- [ElevenLabs Conversational AI Docs](https://elevenlabs.io/docs/conversational-ai/overview)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Next Level Real Estate CLAUDE.md](../../CLAUDE.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review ElevenLabs API documentation
3. Open an issue in the project repository
