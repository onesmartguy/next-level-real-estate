# Claude Code Integration for Next Level Real Estate

Complete guide to using Claude Code with ElevenLabs Conversational AI and Twilio Voice API for the Next Level Real Estate platform.

## 📚 Documentation Index

- **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Best practices for subagents, skills, MCP servers, testing, and optimization
- **[WORKFLOWS.md](./WORKFLOWS.md)** - Step-by-step workflows for common tasks
- **[MCP_SERVER_GUIDE.md](./MCP_SERVER_GUIDE.md)** - Deep dive into MCP server architecture and usage

## 🚀 Quick Start

### 1. Install MCP Server

```bash
cd mcp-servers/mcp-elevenlabs-server
npm install
npm run build
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your ELEVENLABS_API_KEY
```

### 3. Add to Claude Desktop

Edit your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "elevenlabs": {
      "command": "node",
      "args": [
        "/home/onesmartguy/projects/next-level-real-estate/mcp-servers/mcp-elevenlabs-server/dist/server.js"
      ],
      "env": {
        "ELEVENLABS_API_KEY": "your_key_here"
      }
    }
  }
}
```

### 4. Restart Claude Desktop

The `elevenlabs-agent-manager` subagent will now be available automatically.

## 🤖 Available Tools

### Subagent

**elevenlabs-agent-manager**
- Expert in ElevenLabs + Twilio integration
- Handles agent tuning, testing, and debugging
- Automatically invoked for conversational AI tasks

### Skills

**agent-tuning**
- Voice selection and optimization
- System prompt engineering
- A/B testing strategies
- Performance analysis

**twilio-testing**
- Outbound call testing
- Audio quality validation
- Webhook configuration
- Metrics collection

**agent-debugging**
- Troubleshooting agent issues
- Transcript analysis
- Error diagnosis
- Performance optimization

### MCP Tools (9 total)

- `elevenlabs_create_agent` - Create conversational agents
- `elevenlabs_get_agent` - Retrieve agent details
- `elevenlabs_list_agents` - List all agents
- `elevenlabs_update_agent` - Update agent config
- `elevenlabs_start_conversation` - Initiate outbound calls
- `elevenlabs_get_conversation` - Get call transcripts
- `elevenlabs_list_conversations` - Analyze call patterns
- `elevenlabs_list_voices` - Browse 5000+ voices
- `elevenlabs_get_voice` - Get voice details

## 💡 Common Use Cases

### Create a New Agent

```
> Use the agent manager to create a wholesale lead qualification agent that:
> - Qualifies motivated sellers in under 3 minutes
> - Uses a professional female voice
> - Maintains TCPA compliance
> - Schedules viewings for qualified leads
```

### Test Outbound Calls

```
> Test agent_abc123 with these scenarios:
> 1. Motivated seller (probate) - urgent timeline
> 2. Investor selling rental - no rush
> 3. Foreclosure situation - 30 days to close
>
> Measure: connect rate, audio quality, sentiment, qualification rate
```

### Debug Agent Issues

```
> Use agent-debugging to diagnose why conversation_xyz123 had poor audio quality

> What's causing the high latency in agent_abc123?
```

### Optimize Performance

```
> Analyze agent_abc123 performance over the last week

> What can we optimize to improve the qualification rate?
```

## 📖 Detailed Guides

### Best Practices

See [BEST_PRACTICES.md](./BEST_PRACTICES.md) for:
- Working with subagents effectively
- Using skills for specialized tasks
- MCP server integration patterns
- Testing and quality assurance
- Performance optimization
- Security and TCPA compliance
- Team collaboration workflows

### Workflows

See [WORKFLOWS.md](./WORKFLOWS.md) for step-by-step instructions:
1. Creating a new agent
2. Testing outbound calls
3. Debugging agent issues
4. Optimizing agent performance
5. A/B testing agents
6. Setting up Twilio integration
7. Analyzing call transcripts
8. Updating agent knowledge base

### MCP Server

See [MCP_SERVER_GUIDE.md](./MCP_SERVER_GUIDE.md) for:
- Architecture and design patterns
- Tool reference
- Integration examples
- Troubleshooting guide
- Advanced usage

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Claude Code                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │         elevenlabs-agent-manager (Subagent)        │  │
│  │                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │  │
│  │  │  agent-  │  │ twilio-  │  │    agent-      │  │  │
│  │  │  tuning  │  │ testing  │  │   debugging    │  │  │
│  │  │ (Skill)  │  │ (Skill)  │  │    (Skill)     │  │  │
│  │  └──────────┘  └──────────┘  └────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ Uses MCP tools
                   ▼
         ┌─────────────────────┐
         │ mcp-elevenlabs-     │
         │      server         │
         │  (9 tools)          │
         └──────────┬──────────┘
                    │
           ┌────────┴─────────┐
           │                  │
           ▼                  ▼
    ┌─────────────┐    ┌──────────┐
    │ ElevenLabs  │    │  Twilio  │
    │     API     │    │   API    │
    └─────────────┘    └──────────┘
```

## 🎯 Key Features

### Automatic Subagent Invocation

Claude Code automatically invokes the `elevenlabs-agent-manager` when you:
- Mention ElevenLabs or conversational AI
- Work with voice agents
- Test or debug calls
- Optimize agent performance

### Specialized Skills

Each skill provides focused expertise:
- **agent-tuning**: Configuration and optimization
- **twilio-testing**: Call testing and validation
- **agent-debugging**: Troubleshooting and diagnosis

### Comprehensive MCP Integration

9 tools covering the full agent lifecycle:
1. Agent creation and management
2. Voice selection and preview
3. Conversation initiation
4. Transcript analysis
5. Performance metrics

## 📊 Success Metrics

Track these key metrics for all agents:

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Connect Rate | >80% | <70% |
| Avg Response Latency | <150ms | >250ms |
| Audio Quality Score | >0.9 | <0.7 |
| Positive Sentiment | >70% | <60% |
| Qualification Rate | >50% | <40% |
| Cost per Qualified Lead | <$5 | >$8 |

## 🔒 Security & Compliance

### TCPA 2025 Requirements

All agents enforce:
- ✅ Written consent verification
- ✅ National DNC registry check
- ✅ Recording disclosure
- ✅ Opt-out handling
- ✅ Audit trail maintenance

### Data Protection

- API keys in environment variables
- PII masking in logs
- 3-year retention for compliance
- Secure webhook endpoints

## 🛠️ Troubleshooting

### MCP Server Not Working

```bash
# Check server status
cd mcp-servers/mcp-elevenlabs-server
npm start

# Verify environment
echo $ELEVENLABS_API_KEY

# Check logs
tail -f logs/server.log
```

### Agent Not Responding

```
> Use agent-debugging to check agent_abc123 configuration

> Verify voice ID and model are valid
```

### Poor Call Quality

```
> Use agent-debugging to analyze conversation_xyz123

> Measure audio quality metrics and identify issues
```

## 📝 Contributing

### Adding New Functionality

1. **New MCP Tool**: Add to `mcp-servers/mcp-elevenlabs-server/src/tools/`
2. **New Skill**: Create in `.claude/skills/[skill-name]/`
3. **Update Documentation**: Keep guides current

### Code Review Checklist

- [ ] Follows established patterns
- [ ] Includes error handling
- [ ] Has comprehensive tests
- [ ] Updated documentation
- [ ] Validated TCPA compliance

## 🔗 Resources

### Internal Documentation
- [Project CLAUDE.md](../../CLAUDE.md)
- [MCP Server README](../../mcp-servers/mcp-elevenlabs-server/README.md)
- [Agent Registry](../../agents/registry.md)

### External Resources
- [ElevenLabs Conversational AI Docs](https://elevenlabs.io/docs/conversational-ai/overview)
- [Twilio Voice API Docs](https://www.twilio.com/docs/voice/api)
- [Claude Code Documentation](https://code.claude.com/docs)
- [MCP Protocol Spec](https://github.com/modelcontextprotocol/specification)
- [TCPA Compliance Guide](https://www.fcc.gov/general/telemarketing-and-robocalls)

## 🎓 Learning Path

### Week 1: Fundamentals
- [ ] Read BEST_PRACTICES.md
- [ ] Complete MCP server setup
- [ ] Create your first agent
- [ ] Execute test call

### Week 2: Testing & Quality
- [ ] Follow WORKFLOWS.md for testing
- [ ] Learn debugging techniques
- [ ] Analyze call transcripts
- [ ] Optimize agent performance

### Week 3: Advanced Topics
- [ ] Implement A/B testing
- [ ] Build custom knowledge bases
- [ ] Create specialized agents
- [ ] Set up production monitoring

### Week 4: Production Operations
- [ ] Deploy agents to production
- [ ] Configure alerting
- [ ] Train support team
- [ ] Establish optimization cadence

## 💬 Getting Help

### In Claude Code

```
> I need help with [specific issue]

> Show me examples of [specific task]

> What's the best practice for [scenario]?
```

The `elevenlabs-agent-manager` subagent will assist with all ElevenLabs and Twilio related questions.

### Team Resources

- **Slack**: #elevenlabs-integration
- **Wiki**: [ElevenLabs Integration Guide](wiki.example.com)
- **On-Call**: elevenlabs-oncall@example.com

## 📈 Roadmap

### Q1 2025
- [x] MCP server implementation
- [x] Core subagent and skills
- [x] Documentation suite
- [ ] Production deployment
- [ ] Team training complete

### Q2 2025
- [ ] Advanced A/B testing framework
- [ ] Auto-optimization based on feedback
- [ ] Multi-language support
- [ ] Enhanced analytics dashboard

### Q3 2025
- [ ] Custom voice cloning
- [ ] Dynamic knowledge base updates
- [ ] Sentiment-driven adaptation
- [ ] Cost optimization framework

## 📄 License

Internal use only - Next Level Real Estate

---

**Last Updated:** 2025-01-07
**Version:** 1.0.0
**Maintainer:** Next Level Real Estate Development Team

For questions or issues, contact the development team or use Claude Code with the elevenlabs-agent-manager subagent for immediate assistance.
