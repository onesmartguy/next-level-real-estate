# api-scaffolding

> REST and GraphQL API scaffolding, Firebase Cloud Functions, framework selection, backend architecture, and API generation

**Version:** 1.2.3
**Category:** api
**Author:** Seth Hobson

## Overview

### What This Plugin Does

REST and GraphQL API scaffolding, Firebase Cloud Functions, framework selection, backend architecture, and API generation

### Primary Use Cases

- Api workflows
- Rest workflows
- Graphql workflows
- Fastapi workflows
- Django workflows

### Who Should Use This

- Developers working with api systems
- Teams requiring api scaffolding capabilities
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
claude agents list | grep api-scaffolding
```

### Basic Usage

Invoke the primary agent:
```bash
# Using the backend-architect agent
@backend-architect <your request>
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

### fastapi-pro

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Build high-performance async APIs with FastAPI, SQLAlchemy 2.0, and Pydantic V2. Master microservices, WebSockets, and modern Python async patterns. Use PROACTIVELY for FastAPI development, async optimization, or API architecture.

**When to Use Proactively:**
- Build high-performance async APIs with FastAPI, SQLAlchemy 2
- When you need specialized fastapi pro expertise

**Example Invocation:**
```bash
@fastapi-pro <specific task or question>
```

### django-pro

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Master Django 5.x with async views, DRF, Celery, and Django Channels. Build scalable web applications with proper architecture, testing, and deployment. Use PROACTIVELY for Django development, ORM optimization, or complex Django patterns.

**When to Use Proactively:**
- Master Django 5
- When you need specialized django pro expertise

**Example Invocation:**
```bash
@django-pro <specific task or question>
```

### graphql-architect

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Master modern GraphQL with federation, performance optimization, and enterprise security. Build scalable schemas, implement advanced caching, and design real-time systems. Use PROACTIVELY for GraphQL architecture or performance optimization.

**When to Use Proactively:**
- Master modern GraphQL with federation, performance optimization, and enterprise security
- When you need specialized graphql architect expertise

**Example Invocation:**
```bash
@graphql-architect <specific task or question>
```

## Skills Reference

This plugin includes **3 progressive disclosure skills** for advanced patterns:

### firebase-functions-templates

**Description:** Create production-ready Firebase Cloud Functions with TypeScript, Express integration, HTTP endpoints, background triggers, and scheduled functions. Use when building serverless APIs with Firebase or setting up Cloud Functions projects.

**Activation Triggers:**
Create production-ready Firebase Cloud Functions with TypeScript, Express integration, HTTP endpoints, background triggers, and scheduled functions. Use when building serverless APIs with Firebase or setting up Cloud Functions projects.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

### fastapi-templates

**Description:** Create production-ready FastAPI projects with async patterns, dependency injection, and comprehensive error handling. Use when building new FastAPI applications or setting up backend API projects.

**Activation Triggers:**
Create production-ready FastAPI projects with async patterns, dependency injection, and comprehensive error handling. Use when building new FastAPI applications or setting up backend API projects.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

### dotnet-minimal-api-templates

**Description:** Create production-ready ASP.NET Core Minimal API projects with async patterns, dependency injection, and comprehensive error handling. Use when building new .NET API applications or setting up backend API projects with .NET 8+.

**Activation Triggers:**
Create production-ready ASP.NET Core Minimal API projects with async patterns, dependency injection, and comprehensive error handling. Use when building new .NET API applications or setting up backend API projects with .NET 8+.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

## Complete Workflow Examples

### Example 1: Basic Workflow

1. Engage the agent:
```bash
@backend-architect start new project
```

2. Follow agent guidance for implementation

### Example 2: Advanced Workflow

Multi-agent coordination:

1. Architecture planning: `@backend-architect`
2. Implementation: `@fastapi-pro`
3. Review and refinement

## Plugin Relationships

### Similar Plugins


### Differences from Similar Plugins

The `api-scaffolding` plugin focuses specifically on rest and graphql api scaffolding, firebase cloud functions, framework selection, backend architecture, and api generation, while similar plugins may have broader or different specializations.

### Works Well With


### Integration Patterns

- **Sequential workflows:** Chain multiple agents for complex tasks
- **Parallel execution:** Run independent agents simultaneously
- **Context sharing:** Maintain state across agent interactions

## Best Practices

### Do's

- Use `@backend-architect` for primary tasks in this domain
- Follow the plugin's specialized patterns for api
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

- **firebase-functions-templates:** Advanced patterns for power users
- **fastapi-templates:** Advanced patterns for power users

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

**Plugin:** api-scaffolding v1.2.3
**Last Updated:** 1.2.3
**Agents:** 4 | **Skills:** 3 | **Commands:** 0
