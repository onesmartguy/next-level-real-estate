# customer-sales-automation

> Customer support workflow automation, sales pipeline management, email campaigns, and CRM integration

**Version:** 1.2.0
**Category:** business
**Author:** Seth Hobson

## Overview

### What This Plugin Does

Customer support workflow automation, sales pipeline management, email campaigns, and CRM integration

### Primary Use Cases

- Customer Support workflows
- Sales workflows
- Crm workflows
- Email Campaigns workflows
- Automation workflows

### Who Should Use This

- Developers working with business systems
- Teams requiring customer sales automation capabilities
- Projects leveraging 2 specialized agents for task automation

## Quick Start

### Installation

1. Install the plugin in Claude Code:
```bash
# Add to your .claude-plugin/marketplace.json or install via Claude Code CLI
```

2. Verify installation:
```bash
# List available agents
claude agents list | grep customer-sales-automation
```

### Basic Usage

Invoke the primary agent:
```bash
# Using the customer-support agent
@customer-support <your request>
```

## Agents Reference

This plugin provides **2 specialized agents**:

### customer-support

**Model:** haiku - Fast execution and deterministic tasks

**Purpose:** Elite AI-powered customer support specialist mastering conversational AI, automated ticketing, sentiment analysis, and omnichannel support experiences. Integrates modern support tools, chatbot platforms, and CX optimization with 2024/2025 best practices. Use PROACTIVELY for comprehensive customer experience management.

**When to Use Proactively:**
- Elite AI-powered customer support specialist mastering conversational AI, automated ticketing, sentiment analysis, and omnichannel support experiences
- When you need specialized customer support expertise

**Example Invocation:**
```bash
@customer-support <specific task or question>
```

### sales-automator

**Model:** haiku - Fast execution and deterministic tasks

**Purpose:** Draft cold emails, follow-ups, and proposal templates. Creates pricing pages, case studies, and sales scripts. Use PROACTIVELY for sales outreach or lead nurturing.

**When to Use Proactively:**
- Draft cold emails, follow-ups, and proposal templates
- When you need specialized sales automator expertise

**Example Invocation:**
```bash
@sales-automator <specific task or question>
```

## Complete Workflow Examples

### Example 1: Basic Workflow

1. Engage the agent:
```bash
@customer-support start new project
```

2. Follow agent guidance for implementation

### Example 2: Advanced Workflow

Multi-agent coordination:

1. Architecture planning: `@customer-support`
2. Implementation: `@sales-automator`
3. Review and refinement

## Plugin Relationships

### Similar Plugins


### Differences from Similar Plugins

The `customer-sales-automation` plugin focuses specifically on customer support workflow automation, sales pipeline management, email campaigns, and crm integration, while similar plugins may have broader or different specializations.

### Works Well With


### Integration Patterns

- **Sequential workflows:** Chain multiple agents for complex tasks
- **Parallel execution:** Run independent agents simultaneously
- **Context sharing:** Maintain state across agent interactions

## Best Practices

### Do's

- Use `@customer-support` for primary tasks in this domain
- Follow the plugin's specialized patterns for business
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


## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/wshobson/agents) for guidelines.

## License

MIT

## Support

- **Issues:** [GitHub Issues](https://github.com/wshobson/agents/issues)
- **Discussions:** [GitHub Discussions](https://github.com/wshobson/agents/discussions)
- **Documentation:** [Full Documentation](https://github.com/wshobson/agents)

---

**Plugin:** customer-sales-automation v1.2.0
**Last Updated:** 1.2.0
**Agents:** 2 | **Skills:** 0 | **Commands:** 0
