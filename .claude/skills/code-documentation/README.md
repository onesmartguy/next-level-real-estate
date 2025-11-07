# code-documentation

> Documentation generation, code explanation, and technical writing with automated doc generation and tutorial creation

**Version:** 1.2.0
**Category:** documentation
**Author:** Seth Hobson

## Overview

### What This Plugin Does

Documentation generation, code explanation, and technical writing with automated doc generation and tutorial creation

### Primary Use Cases

- Documentation workflows
- Code Explanation workflows
- Technical Writing workflows
- Tutorials workflows

### Who Should Use This

- Developers working with documentation systems
- Teams requiring code documentation capabilities
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
claude agents list | grep code-documentation
```

### Basic Usage

Invoke the primary agent:
```bash
# Using the code-reviewer agent
@code-reviewer <your request>
```

Or use the command interface:
```bash
/code-documentation:doc-generate <arguments>
```

## Agents Reference

This plugin provides **3 specialized agents**:

### code-reviewer

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Elite code review expert specializing in modern AI-powered code analysis, security vulnerabilities, performance optimization, and production reliability. Masters static analysis tools, security scanning, and configuration review with 2024/2025 best practices. Use PROACTIVELY for code quality assurance.

**When to Use Proactively:**
- Elite code review expert specializing in modern AI-powered code analysis, security vulnerabilities, performance optimization, and production reliability
- When you need specialized code reviewer expertise

**Example Invocation:**
```bash
@code-reviewer <specific task or question>
```

### docs-architect

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Creates comprehensive technical documentation from existing codebases. Analyzes architecture, design patterns, and implementation details to produce long-form technical manuals and ebooks. Use PROACTIVELY for system documentation, architecture guides, or technical deep-dives.

**When to Use Proactively:**
- Creates comprehensive technical documentation from existing codebases
- When you need specialized docs architect expertise

**Example Invocation:**
```bash
@docs-architect <specific task or question>
```

### tutorial-engineer

**Model:** haiku - Fast execution and deterministic tasks

**Purpose:** Creates step-by-step tutorials and educational content from code. Transforms complex concepts into progressive learning experiences with hands-on examples. Use PROACTIVELY for onboarding guides, feature tutorials, or concept explanations.

**When to Use Proactively:**
- Creates step-by-step tutorials and educational content from code
- When you need specialized tutorial engineer expertise

**Example Invocation:**
```bash
@tutorial-engineer <specific task or question>
```

## Commands Reference

This plugin provides **2 slash commands**:

### /code-documentation:doc-generate

**Description:** 

**Usage:**
```bash
/code-documentation:doc-generate [options]
```

### /code-documentation:code-explain

**Description:** 

**Usage:**
```bash
/code-documentation:code-explain [options]
```

## Complete Workflow Examples

### Example 1: Basic Workflow

1. Initialize with command:
```bash
/code-documentation:doc-generate
```

2. Work with agent:
```bash
@code-reviewer implement the feature
```

3. Review and iterate

### Example 2: Advanced Workflow

Multi-agent coordination:

1. Architecture planning: `@code-reviewer`
2. Implementation: `@docs-architect`
3. Review and refinement

## Plugin Relationships

### Similar Plugins


### Differences from Similar Plugins

The `code-documentation` plugin focuses specifically on documentation generation, code explanation, and technical writing with automated doc generation and tutorial creation, while similar plugins may have broader or different specializations.

### Works Well With


### Integration Patterns

- **Sequential workflows:** Chain multiple agents for complex tasks
- **Parallel execution:** Run independent agents simultaneously
- **Context sharing:** Maintain state across agent interactions

## Best Practices

### Do's

- Use `@code-reviewer` for primary tasks in this domain
- Follow the plugin's specialized patterns for documentation
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

**Plugin:** code-documentation v1.2.0
**Last Updated:** 1.2.0
**Agents:** 3 | **Skills:** 0 | **Commands:** 2
