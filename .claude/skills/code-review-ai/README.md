# code-review-ai

> AI-powered architectural review and code quality analysis

**Version:** 1.2.0
**Category:** quality
**Author:** Seth Hobson

## Overview

### What This Plugin Does

AI-powered architectural review and code quality analysis

### Primary Use Cases

- Code Review workflows
- Architecture workflows
- Ai Analysis workflows
- Quality workflows

### Who Should Use This

- Developers working with quality systems
- Teams requiring code review ai capabilities
- Projects leveraging 1 specialized agents for task automation

## Quick Start

### Installation

1. Install the plugin in Claude Code:
```bash
# Add to your .claude-plugin/marketplace.json or install via Claude Code CLI
```

2. Verify installation:
```bash
# List available agents
claude agents list | grep code-review-ai
```

### Basic Usage

Invoke the primary agent:
```bash
# Using the architect-review agent
@architect-review <your request>
```

Or use the command interface:
```bash
/code-review-ai:ai-review <arguments>
```

## Agents Reference

This plugin provides **1 specialized agents**:

### architect-review

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Master software architect specializing in modern architecture patterns, clean architecture, microservices, event-driven systems, and DDD. Reviews system designs and code changes for architectural integrity, scalability, and maintainability. Use PROACTIVELY for architectural decisions.

**When to Use Proactively:**
- Master software architect specializing in modern architecture patterns, clean architecture, microservices, event-driven systems, and DDD
- When you need specialized architect review expertise

**Example Invocation:**
```bash
@architect-review <specific task or question>
```

## Commands Reference

This plugin provides **1 slash commands**:

### /code-review-ai:ai-review

**Description:** 

**Usage:**
```bash
/code-review-ai:ai-review [options]
```

## Complete Workflow Examples

### Example 1: Basic Workflow

1. Initialize with command:
```bash
/code-review-ai:ai-review
```

2. Work with agent:
```bash
@architect-review implement the feature
```

3. Review and iterate

### Example 2: Advanced Workflow


## Plugin Relationships

### Similar Plugins


### Differences from Similar Plugins

The `code-review-ai` plugin focuses specifically on ai-powered architectural review and code quality analysis, while similar plugins may have broader or different specializations.

### Works Well With


### Integration Patterns

- **Sequential workflows:** Chain multiple agents for complex tasks
- **Parallel execution:** Run independent agents simultaneously
- **Context sharing:** Maintain state across agent interactions

## Best Practices

### Do's

- Use `@architect-review` for primary tasks in this domain
- Follow the plugin's specialized patterns for quality
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

**Plugin:** code-review-ai v1.2.0
**Last Updated:** 1.2.0
**Agents:** 1 | **Skills:** 0 | **Commands:** 1
