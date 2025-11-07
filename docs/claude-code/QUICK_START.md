# Quick Start Guide - Claude Code for Next Level Real Estate

Get up and running with ElevenLabs Conversational AI + Twilio integration in under 30 minutes.

## Prerequisites

- [ ] Claude Desktop installed
- [ ] ElevenLabs account with API key
- [ ] Twilio account (for call testing)
- [ ] Node.js 18+ installed
- [ ] Git repository cloned

## Step 1: Set Up MCP Server (10 minutes)

### Install Dependencies

```bash
cd /home/onesmartguy/projects/next-level-real-estate/mcp-servers/mcp-elevenlabs-server
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_TIMEOUT=60000
LOG_LEVEL=info
```

### Build Server

```bash
npm run build
```

### Test Server

```bash
npm start
```

You should see:
```
[Server] ElevenLabs MCP Server starting...
[Server] Running health checks...
[Server] ElevenLabs: ✓ healthy
[Server] ElevenLabs MCP Server running
```

Press Ctrl+C to stop.

## Step 2: Configure Claude Desktop (5 minutes)

### Find Config File

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Add MCP Server

Create or edit the file:

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

**Important:** Use the full absolute path to `server.js`

### Restart Claude Desktop

Completely quit and relaunch Claude Desktop for changes to take effect.

## Step 3: Verify Installation (5 minutes)

### Test MCP Server Connection

In Claude Code, type:

```
> Check if the MCP elevenlabs server is running
```

Expected response:
```
✓ MCP server 'elevenlabs' is connected
✓ 9 tools available
```

### Test Subagent

```
> Use the elevenlabs-agent-manager to list available voices
```

The subagent should activate and list ElevenLabs voices.

### Test Skills

```
> What skills are available for ElevenLabs?
```

Expected response should list:
- agent-tuning
- twilio-testing
- agent-debugging

## Step 4: Create Your First Agent (10 minutes)

### Create Agent

```
> Use the agent manager to create a simple test agent:
> - Name: "My First Agent"
> - Purpose: Test conversational AI
> - Use a professional voice
> - Keep it simple for now
```

The subagent will:
1. Help you select a voice
2. Create a basic system prompt
3. Configure the agent
4. Create it via MCP tools

### Test Agent

```
> Start a test conversation with the agent we just created
```

Provide test context:
```json
{
  "leadData": {
    "name": "Test Lead",
    "phone": "+1234567890"
  }
}
```

### Review Results

```
> Show me the conversation transcript and metrics
```

## Common Issues & Solutions

### Issue: MCP Server Not Connecting

**Solution 1:** Verify path in config
```bash
# Check the file exists
ls /home/onesmartguy/projects/next-level-real-estate/mcp-servers/mcp-elevenlabs-server/dist/server.js
```

**Solution 2:** Check build
```bash
cd mcp-servers/mcp-elevenlabs-server
npm run build
```

**Solution 3:** Test manually
```bash
npm start
# Should show "Server running" without errors
```

### Issue: API Key Invalid

**Solution:** Verify key in ElevenLabs dashboard
1. Go to elevenlabs.io
2. Login → Profile → API Key
3. Copy fresh key
4. Update `.env` and Claude Desktop config
5. Restart Claude Desktop

### Issue: Tools Not Appearing

**Solution 1:** Check logs
```bash
# Look for errors
tail -f mcp-servers/mcp-elevenlabs-server/logs/server.log
```

**Solution 2:** Restart Claude Desktop
- Completely quit (not just close window)
- Relaunch

**Solution 3:** Verify config syntax
```bash
# Validate JSON syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
```

### Issue: Subagent Not Activating

**Solution:** Explicitly invoke it
```
> Use the elevenlabs-agent-manager subagent
```

Or mention trigger keywords:
- "ElevenLabs"
- "conversational AI"
- "voice agent"
- "outbound calls"

## Next Steps

### Learn the Basics

1. **Read Best Practices** (30 min)
   - [BEST_PRACTICES.md](./BEST_PRACTICES.md)
   - Focus on "Working with Subagents" section

2. **Follow a Workflow** (1 hour)
   - [WORKFLOWS.md](./WORKFLOWS.md)
   - Try "Creating a New Agent" workflow

3. **Understand MCP Tools** (30 min)
   - [MCP_SERVER_GUIDE.md](./MCP_SERVER_GUIDE.md)
   - Review tool reference

### Create Your First Production Agent

Follow this checklist:

- [ ] Define agent purpose and success criteria
- [ ] Research best practices for your use case
- [ ] Select optimal voice (test 3-5 options)
- [ ] Engineer detailed system prompt
- [ ] Create agent with TCPA compliance enabled
- [ ] Run comprehensive tests (5+ scenarios)
- [ ] Analyze transcripts for improvements
- [ ] Deploy to production with monitoring
- [ ] Set up weekly optimization reviews

### Set Up Twilio Integration

For outbound calling:

- [ ] Create Twilio account
- [ ] Purchase/verify phone number
- [ ] Configure webhook endpoints
- [ ] Set up ngrok for local testing
- [ ] Execute end-to-end test call
- [ ] Validate TCPA compliance
- [ ] Deploy to production

See [WORKFLOWS.md - Setting Up Twilio Integration](./WORKFLOWS.md#workflow-6-setting-up-twilio-integration)

## Useful Commands

### Agent Management

```
# Create agent
> Create a [purpose] agent for [use case]

# List agents
> Show me all ElevenLabs agents

# Get agent details
> Show details for agent_[id]

# Update agent
> Update agent_[id] with [changes]
```

### Testing

```
# Test call
> Test agent_[id] with [scenario]

# Check audio quality
> Measure audio quality for conversation_[id]

# Validate TCPA compliance
> Check TCPA compliance for agent_[id]
```

### Debugging

```
# Diagnose issue
> Debug conversation_[id] - what went wrong?

# Check configuration
> Verify agent_[id] configuration

# Analyze performance
> Show performance metrics for agent_[id]
```

### Optimization

```
# Performance analysis
> Analyze agent_[id] over the last [period]

# A/B test
> Create variant of agent_[id] with [change]

# Update knowledge base
> Add [document] to agent_[id] knowledge base
```

## Getting Help

### In Claude Code

The `elevenlabs-agent-manager` subagent can help with:
- Configuration issues
- Best practices questions
- Debugging assistance
- Optimization guidance

Just describe your issue naturally:
```
> I'm having trouble with audio quality on my agent

> What's the best way to handle objections?

> How do I improve my qualification rate?
```

### Documentation

- **Quick questions**: This guide
- **How-to guides**: [WORKFLOWS.md](./WORKFLOWS.md)
- **Deep dives**: [BEST_PRACTICES.md](./BEST_PRACTICES.md)
- **Technical details**: [MCP_SERVER_GUIDE.md](./MCP_SERVER_GUIDE.md)

### External Resources

- [ElevenLabs Docs](https://elevenlabs.io/docs/conversational-ai/overview)
- [Twilio Voice API](https://www.twilio.com/docs/voice/api)
- [Claude Code Docs](https://code.claude.com/docs)

## Success Checklist

You're ready for production when:

- [x] MCP server running and healthy
- [x] Claude Desktop configured correctly
- [x] Created and tested first agent
- [x] Comfortable with basic commands
- [ ] Read BEST_PRACTICES.md
- [ ] Followed at least one WORKFLOW
- [ ] Understand TCPA compliance requirements
- [ ] Set up monitoring and metrics
- [ ] Trained team on basics

## Pro Tips

### 1. Use the Subagent Extensively

Let the `elevenlabs-agent-manager` do the heavy lifting:
```
> Create, test, and deploy a lead qualification agent
```

Instead of multiple manual steps.

### 2. Start Simple, Then Optimize

```
# Week 1: Basic agent
> Create a simple greeting agent

# Week 2: Add intelligence
> Update with lead qualification logic

# Week 3: Optimize
> A/B test greeting variations

# Week 4: Scale
> Deploy to production with monitoring
```

### 3. Leverage Skills

Skills provide specialized expertise:
```
> Use agent-tuning to optimize my system prompt

> Use twilio-testing to validate call quality

> Use agent-debugging to troubleshoot issues
```

### 4. Test Early, Test Often

Don't wait to test:
```
# After every change
> Test the updated agent

# Before deploying
> Run comprehensive test suite

# In production
> Monitor metrics daily
```

### 5. Document Everything

Keep track of:
- Agent configurations
- Test results
- Performance metrics
- Optimization decisions
- Lessons learned

Use the agent manager to help:
```
> Document this agent configuration

> Generate a test report

> Create a troubleshooting guide
```

## What's Next?

### Immediate (Today)
1. ✅ Complete this quick start
2. Create your first agent
3. Run a test call
4. Review the transcript

### Short Term (This Week)
1. Read BEST_PRACTICES.md
2. Follow "Creating a New Agent" workflow
3. Set up Twilio integration
4. Deploy first production agent

### Medium Term (This Month)
1. Create 3-5 specialized agents
2. Implement A/B testing
3. Build knowledge bases
4. Optimize based on data

### Long Term (This Quarter)
1. Full production deployment
2. Continuous optimization loop
3. Team training complete
4. Advanced features (multi-language, sentiment adaptation)

---

**Need Help?** Use Claude Code with the elevenlabs-agent-manager:
```
> I'm stuck on [specific issue] - can you help?
```

**Ready to dive deeper?** See [README.md](./README.md) for the full documentation index.

**Last Updated:** 2025-01-07
