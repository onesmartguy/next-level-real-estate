# database-migrations

> Database migration automation with Entity Framework Core, Alembic, Flyway, observability, and cross-database migration strategies

**Version:** 1.2.1
**Category:** database
**Author:** Seth Hobson

## Overview

### What This Plugin Does

Database migration automation with Entity Framework Core, Alembic, Flyway, observability, and cross-database migration strategies

### Primary Use Cases

- Migrations workflows
- Database Operations workflows
- Postgres workflows
- Mysql workflows
- Mongodb workflows

### Who Should Use This

- Developers working with database systems
- Teams requiring database migrations capabilities
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
claude agents list | grep database-migrations
```

### Basic Usage

Invoke the primary agent:
```bash
# Using the database-admin agent
@database-admin <your request>
```

Or use the command interface:
```bash
/database-migrations:migration-observability <arguments>
```

## Agents Reference

This plugin provides **2 specialized agents**:

### database-admin

**Model:** haiku - Fast execution and deterministic tasks

**Purpose:** Expert database administrator specializing in modern cloud databases, automation, and reliability engineering. Masters AWS/Azure/GCP database services, Infrastructure as Code, high availability, disaster recovery, performance optimization, and compliance. Handles multi-cloud strategies, container databases, and cost optimization. Use PROACTIVELY for database architecture, operations, or reliability engineering.

**When to Use Proactively:**
- Expert database administrator specializing in modern cloud databases, automation, and reliability engineering
- When you need specialized database admin expertise

**Example Invocation:**
```bash
@database-admin <specific task or question>
```

### database-optimizer

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Expert database optimizer specializing in modern performance tuning, query optimization, and scalable architectures. Masters advanced indexing, N+1 resolution, multi-tier caching, partitioning strategies, and cloud database optimization. Handles complex query analysis, migration strategies, and performance monitoring. Use PROACTIVELY for database optimization, performance issues, or scalability challenges.

**When to Use Proactively:**
- Expert database optimizer specializing in modern performance tuning, query optimization, and scalable architectures
- When you need specialized database optimizer expertise

**Example Invocation:**
```bash
@database-optimizer <specific task or question>
```

## Skills Reference

This plugin includes **1 progressive disclosure skills** for advanced patterns:

### dotnet-ef-migrations

**Description:** Master Entity Framework Core migrations with code-first approach, migration strategies, data seeding, rollback procedures, and production deployment patterns. Use when managing database schema changes in .NET applications.

**Activation Triggers:**
Master Entity Framework Core migrations with code-first approach, migration strategies, data seeding, rollback procedures, and production deployment patterns. Use when managing database schema changes in .NET applications.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

## Commands Reference

This plugin provides **2 slash commands**:

### /database-migrations:migration-observability

**Description:** Migration monitoring, CDC, and observability infrastructure

**Usage:**
```bash
/database-migrations:migration-observability [options]
```

### /database-migrations:sql-migrations

**Description:** SQL database migrations with zero-downtime strategies for PostgreSQL, MySQL, SQL Server

**Usage:**
```bash
/database-migrations:sql-migrations [options]
```

## Complete Workflow Examples

### Example 1: Basic Workflow

1. Initialize with command:
```bash
/database-migrations:migration-observability
```

2. Work with agent:
```bash
@database-admin implement the feature
```

3. Review and iterate

### Example 2: Advanced Workflow

Multi-agent coordination:

1. Architecture planning: `@database-admin`
2. Implementation: `@database-optimizer`
3. Review and refinement

## Plugin Relationships

### Similar Plugins


### Differences from Similar Plugins

The `database-migrations` plugin focuses specifically on database migration automation with entity framework core, alembic, flyway, observability, and cross-database migration strategies, while similar plugins may have broader or different specializations.

### Works Well With


### Integration Patterns

- **Sequential workflows:** Chain multiple agents for complex tasks
- **Parallel execution:** Run independent agents simultaneously
- **Context sharing:** Maintain state across agent interactions

## Best Practices

### Do's

- Use `@database-admin` for primary tasks in this domain
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

## Advanced Topics

### Power User Features

- **dotnet-ef-migrations:** Advanced patterns for power users

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

**Plugin:** database-migrations v1.2.1
**Last Updated:** 1.2.1
**Agents:** 2 | **Skills:** 1 | **Commands:** 2
