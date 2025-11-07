# database-design

> Database architecture, schema design, and SQL optimization for production systems

**Version:** 1.2.0
**Category:** database
**Author:** Seth Hobson

## Overview

### What This Plugin Does

Database architecture, schema design, and SQL optimization for production systems

### Primary Use Cases

- Database Design workflows
- Schema workflows
- Sql workflows
- Data Modeling workflows

### Who Should Use This

- Developers working with database systems
- Teams requiring database design capabilities
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
claude agents list | grep database-design
```

### Basic Usage

Invoke the primary agent:
```bash
# Using the database-architect agent
@database-architect <your request>
```

## Agents Reference

This plugin provides **2 specialized agents**:

### database-architect

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Expert database architect specializing in data layer design from scratch, technology selection, schema modeling, and scalable database architectures. Masters SQL/NoSQL/TimeSeries database selection, normalization strategies, migration planning, and performance-first design. Handles both greenfield architectures and re-architecture of existing systems. Use PROACTIVELY for database architecture, technology selection, or data modeling decisions.

**When to Use Proactively:**
- Expert database architect specializing in data layer design from scratch, technology selection, schema modeling, and scalable database architectures
- When you need specialized database architect expertise

**Example Invocation:**
```bash
@database-architect <specific task or question>
```

### sql-pro

**Model:** haiku - Fast execution and deterministic tasks

**Purpose:** Master modern SQL with cloud-native databases, OLTP/OLAP optimization, and advanced query techniques. Expert in performance tuning, data modeling, and hybrid analytical systems. Use PROACTIVELY for database optimization or complex analysis.

**When to Use Proactively:**
- Master modern SQL with cloud-native databases, OLTP/OLAP optimization, and advanced query techniques
- When you need specialized sql pro expertise

**Example Invocation:**
```bash
@sql-pro <specific task or question>
```

## Complete Workflow Examples

### Example 1: Basic Workflow

1. Engage the agent:
```bash
@database-architect start new project
```

2. Follow agent guidance for implementation

### Example 2: Advanced Workflow

Multi-agent coordination:

1. Architecture planning: `@database-architect`
2. Implementation: `@sql-pro`
3. Review and refinement

## Plugin Relationships

### Similar Plugins


### Differences from Similar Plugins

The `database-design` plugin focuses specifically on database architecture, schema design, and sql optimization for production systems, while similar plugins may have broader or different specializations.

### Works Well With


### Integration Patterns

- **Sequential workflows:** Chain multiple agents for complex tasks
- **Parallel execution:** Run independent agents simultaneously
- **Context sharing:** Maintain state across agent interactions

## Best Practices

### Do's

- Use `@database-architect` for primary tasks in this domain
- Follow the plugin's specialized patterns for database
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

**Plugin:** database-design v1.2.0
**Last Updated:** 1.2.0
**Agents:** 2 | **Skills:** 0 | **Commands:** 0
