# cicd-automation

> CI/CD pipeline configuration for .NET/Node.js/Python, GitHub Actions/GitLab CI/Azure DevOps workflow setup, Docker builds, and automated deployment pipeline orchestration

**Version:** 1.2.2
**Category:** infrastructure
**Author:** Seth Hobson

## Overview

### What This Plugin Does

CI/CD pipeline configuration for .NET/Node.js/Python, GitHub Actions/GitLab CI/Azure DevOps workflow setup, Docker builds, and automated deployment pipeline orchestration

### Primary Use Cases

- Ci Cd workflows
- Automation workflows
- Pipeline workflows
- Github Actions workflows
- Gitlab Ci workflows

### Who Should Use This

- Developers working with infrastructure systems
- Teams requiring cicd automation capabilities
- Projects leveraging 5 specialized agents for task automation

## Quick Start

### Installation

1. Install the plugin in Claude Code:
```bash
# Add to your .claude-plugin/marketplace.json or install via Claude Code CLI
```

2. Verify installation:
```bash
# List available agents
claude agents list | grep cicd-automation
```

### Basic Usage

Invoke the primary agent:
```bash
# Using the terraform-specialist agent
@terraform-specialist <your request>
```

Or use the command interface:
```bash
/cicd-automation:workflow-automate <arguments>
```

## Agents Reference

This plugin provides **5 specialized agents**:

### terraform-specialist

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Expert Terraform/OpenTofu specialist mastering advanced IaC automation, state management, and enterprise infrastructure patterns. Handles complex module design, multi-cloud deployments, GitOps workflows, policy as code, and CI/CD integration. Covers migration strategies, security best practices, and modern IaC ecosystems. Use PROACTIVELY for advanced IaC, state management, or infrastructure automation.

**When to Use Proactively:**
- Expert Terraform/OpenTofu specialist mastering advanced IaC automation, state management, and enterprise infrastructure patterns
- When you need specialized terraform specialist expertise

**Example Invocation:**
```bash
@terraform-specialist <specific task or question>
```

### kubernetes-architect

**Model:** sonnet - Complex reasoning and architecture decisions

**Purpose:** Expert Kubernetes architect specializing in cloud-native infrastructure, advanced GitOps workflows (ArgoCD/Flux), and enterprise container orchestration. Masters EKS/AKS/GKE, service mesh (Istio/Linkerd), progressive delivery, multi-tenancy, and platform engineering. Handles security, observability, cost optimization, and developer experience. Use PROACTIVELY for K8s architecture, GitOps implementation, or cloud-native platform design.

**When to Use Proactively:**
- Expert Kubernetes architect specializing in cloud-native infrastructure, advanced GitOps workflows (ArgoCD/Flux), and enterprise container orchestration
- When you need specialized kubernetes architect expertise

**Example Invocation:**
```bash
@kubernetes-architect <specific task or question>
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

### deployment-engineer

**Model:** haiku - Fast execution and deterministic tasks

**Purpose:** Expert deployment engineer specializing in modern CI/CD pipelines, GitOps workflows, and advanced deployment automation. Masters GitHub Actions, ArgoCD/Flux, progressive delivery, container security, and platform engineering. Handles zero-downtime deployments, security scanning, and developer experience optimization. Use PROACTIVELY for CI/CD design, GitOps implementation, or deployment automation.

**When to Use Proactively:**
- Expert deployment engineer specializing in modern CI/CD pipelines, GitOps workflows, and advanced deployment automation
- When you need specialized deployment engineer expertise

**Example Invocation:**
```bash
@deployment-engineer <specific task or question>
```

### devops-troubleshooter

**Model:** haiku - Fast execution and deterministic tasks

**Purpose:** Expert DevOps troubleshooter specializing in rapid incident response, advanced debugging, and modern observability. Masters log analysis, distributed tracing, Kubernetes debugging, performance optimization, and root cause analysis. Handles production outages, system reliability, and preventive monitoring. Use PROACTIVELY for debugging, incident response, or system troubleshooting.

**When to Use Proactively:**
- Expert DevOps troubleshooter specializing in rapid incident response, advanced debugging, and modern observability
- When you need specialized devops troubleshooter expertise

**Example Invocation:**
```bash
@devops-troubleshooter <specific task or question>
```

## Skills Reference

This plugin includes **5 progressive disclosure skills** for advanced patterns:

### gitlab-ci-patterns

**Description:** Build GitLab CI/CD pipelines with multi-stage workflows, caching, and distributed runners for scalable automation. Use when implementing GitLab CI/CD, optimizing pipeline performance, or setting up automated testing and deployment.

**Activation Triggers:**
Build GitLab CI/CD pipelines with multi-stage workflows, caching, and distributed runners for scalable automation. Use when implementing GitLab CI/CD, optimizing pipeline performance, or setting up automated testing and deployment.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

### secrets-management

**Description:** Implement secure secrets management for CI/CD pipelines using Vault, AWS Secrets Manager, or native platform solutions. Use when handling sensitive credentials, rotating secrets, or securing CI/CD environments.

**Activation Triggers:**
Implement secure secrets management for CI/CD pipelines using Vault, AWS Secrets Manager, or native platform solutions. Use when handling sensitive credentials, rotating secrets, or securing CI/CD environments.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

### deployment-pipeline-design

**Description:** Design multi-stage CI/CD pipelines with approval gates, security checks, and deployment orchestration. Use when architecting deployment workflows, setting up continuous delivery, or implementing GitOps practices.

**Activation Triggers:**
Design multi-stage CI/CD pipelines with approval gates, security checks, and deployment orchestration. Use when architecting deployment workflows, setting up continuous delivery, or implementing GitOps practices.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

### dotnet-cicd-patterns

**Description:** Implement CI/CD for .NET applications with GitHub Actions, Azure DevOps, Docker, Kubernetes deployments, automated testing, and release pipelines. Use when setting up continuous integration and deployment for .NET projects.

**Activation Triggers:**
Implement CI/CD for .NET applications with GitHub Actions, Azure DevOps, Docker, Kubernetes deployments, automated testing, and release pipelines. Use when setting up continuous integration and deployment for .NET projects.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

### github-actions-templates

**Description:** Create production-ready GitHub Actions workflows for automated testing, building, and deploying applications. Use when setting up CI/CD with GitHub Actions, automating development workflows, or creating reusable workflow templates.

**Activation Triggers:**
Create production-ready GitHub Actions workflows for automated testing, building, and deploying applications. Use when setting up CI/CD with GitHub Actions, automating development workflows, or creating reusable workflow templates.

**Key Techniques:**
- Progressive disclosure of knowledge
- On-demand pattern loading
- Context-aware skill activation

## Commands Reference

This plugin provides **1 slash commands**:

### /cicd-automation:workflow-automate

**Description:** 

**Usage:**
```bash
/cicd-automation:workflow-automate [options]
```

## Complete Workflow Examples

### Example 1: Basic Workflow

1. Initialize with command:
```bash
/cicd-automation:workflow-automate
```

2. Work with agent:
```bash
@terraform-specialist implement the feature
```

3. Review and iterate

### Example 2: Advanced Workflow

Multi-agent coordination:

1. Architecture planning: `@terraform-specialist`
2. Implementation: `@kubernetes-architect`
3. Review and refinement

## Plugin Relationships

### Similar Plugins

- `kubernetes-operations` - Related infrastructure plugin
- `cloud-infrastructure` - Related infrastructure plugin

### Differences from Similar Plugins

The `cicd-automation` plugin focuses specifically on ci/cd pipeline configuration for .net/node.js/python, github actions/gitlab ci/azure devops workflow setup, docker builds, and automated deployment pipeline orchestration, while similar plugins may have broader or different specializations.

### Works Well With


### Integration Patterns

- **Sequential workflows:** Chain multiple agents for complex tasks
- **Parallel execution:** Run independent agents simultaneously
- **Context sharing:** Maintain state across agent interactions

## Best Practices

### Do's

- Use `@terraform-specialist` for primary tasks in this domain
- Follow the plugin's specialized patterns for infrastructure
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

- **gitlab-ci-patterns:** Advanced patterns for power users
- **secrets-management:** Advanced patterns for power users

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

**Plugin:** cicd-automation v1.2.2
**Last Updated:** 1.2.2
**Agents:** 5 | **Skills:** 5 | **Commands:** 1
