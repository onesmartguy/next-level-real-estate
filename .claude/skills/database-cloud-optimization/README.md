# database-cloud-optimization

> Database query optimization, cloud cost optimization, and scalability improvements

**Version:** 1.2.0
**Category:** performance
**Author:** Seth Hobson

## Overview

### What This Plugin Does

Database query optimization, cloud cost optimization, and scalability improvements

### Primary Use Cases

- Database Optimization workflows
- Cloud Cost workflows
- Query Tuning workflows
- Scalability workflows

### Who Should Use This

- Developers working with performance systems
- Teams requiring database cloud optimization capabilities
- Projects leveraging 4 specialized agents for task automation

## Quick Start

### Installation

1. Install the plugin in Claude Code:
```bash
# Add to your .claude-plugin/marketplace.json or install via Claude Code CLI
```

2. Verify installation:
```bash
# List available agents
claude agents list | grep database-cloud-optimization
```

### Basic Usage

Invoke the primary agent:
```bash
# Using the backend-architect agent
@backend-architect <your request>
```

Or use the command interface:
```bash
/database-cloud-optimization:cost-optimize <arguments>
```

## Agents Reference

This plugin provides **4 specialized agents**:

### backend-architect

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Expert backend architect specializing in scalable API design, microservices architecture, and distributed systems. Masters REST/GraphQL/gRPC APIs, event-driven architectures, service mesh patterns, and modern backend frameworks. Handles service boundary definition, inter-service communication, resilience patterns, and observability. Use PROACTIVELY when creating new backend services or APIs.

**When to Use Proactively:**
- Expert backend architect specializing in scalable API design, microservices architecture, and distributed systems
- When you need specialized backend architect expertise

**Example Invocation:**
```bash
@backend-architect <specific task or question>
```

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

### database-optimizer

**Model:** haiku - Fast execution and deterministic tasks

**Purpose:** Expert database optimizer specializing in modern performance tuning, query optimization, and scalable architectures. Masters advanced indexing, N+1 resolution, multi-tier caching, partitioning strategies, and cloud database optimization. Handles complex query analysis, migration strategies, and performance monitoring. Use PROACTIVELY for database optimization, performance issues, or scalability challenges.

**When to Use Proactively:**
- Expert database optimizer specializing in modern performance tuning, query optimization, and scalable architectures
- When you need specialized database optimizer expertise

**Example Invocation:**
```bash
@database-optimizer <specific task or question>
```

### cloud-architect

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Expert cloud architect specializing in AWS/Azure/GCP multi-cloud infrastructure design, advanced IaC (Terraform/OpenTofu/CDK), FinOps cost optimization, and modern architectural patterns. Masters serverless, microservices, security, compliance, and disaster recovery. Use PROACTIVELY for cloud architecture, cost optimization, migration planning, or multi-cloud strategies.

**When to Use Proactively:**
- Expert cloud architect specializing in AWS/Azure/GCP multi-cloud infrastructure design, advanced IaC (Terraform/OpenTofu/CDK), FinOps cost optimization, and modern architectural patterns
- When you need specialized cloud architect expertise

**Example Invocation:**
```bash
@cloud-architect <specific task or question>
```

## Commands Reference

This plugin provides **1 slash commands**:

### /database-cloud-optimization:cost-optimize

**Description:** 

**Usage:**
```bash
/database-cloud-optimization:cost-optimize [options]
```

## Complete Workflow Examples

### Example 1: Basic Workflow

1. Initialize with command:
```bash
/database-cloud-optimization:cost-optimize
```

2. Work with agent:
```bash
@backend-architect implement the feature
```

3. Review and iterate

### Example 2: Advanced Workflow

Multi-agent coordination:

1. Architecture planning: `@backend-architect`
2. Implementation: `@database-architect`
3. Review and refinement

## Plugin Relationships

### Similar Plugins


### Differences from Similar Plugins

The `database-cloud-optimization` plugin focuses specifically on database query optimization, cloud cost optimization, and scalability improvements, while similar plugins may have broader or different specializations.

### Works Well With


### Integration Patterns

- **Sequential workflows:** Chain multiple agents for complex tasks
- **Parallel execution:** Run independent agents simultaneously
- **Context sharing:** Maintain state across agent interactions

## Best Practices

### Do's

- Use `@backend-architect` for primary tasks in this domain
- Follow the plugin's specialized patterns for performance
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

**Plugin:** database-cloud-optimization v1.2.0
**Last Updated:** 1.2.0
**Agents:** 4 | **Skills:** 0 | **Commands:** 1
