---
name: claude-project-setup
description: "Use when starting a new project, initializing a repository for Claude Code, or when the user asks to configure CLAUDE.md, rules, commands, skills, or agents for a project."
tags: ["setup", "claude-code", "project-init"]
---

# Claude Project Setup

## Overview

This skill fetches the project setup guide from Notion and applies it to configure a new Claude Code project. The guide lives in Notion so it stays up-to-date across all projects without local file duplication. This ensures every project you create follows the official Claude Code best practices and organizational standards.

## When to Use

Use this skill when:
- **Starting a new project or repo from scratch** and need to establish Claude Code structure
- **User asks to "set up Claude"** or "configure this project for Claude Code"
- **User asks about CLAUDE.md, rules, commands, skills, or agents** structure or organization
- **User wants guidance on organizing** a Claude Code project
- **Initializing a repository** and need to establish configuration files and conventions
- **Setting up best practices** for a multi-agent or team-based project

## How It Works

1. **Fetch the guide from Notion** (always fresh):
   - Use the MCP tool `mcp__claude_ai_Notion__notion-fetch` with ID: `34187201f6958042af22fd647d8e0409`
   - **Important**: Always fetch fresh — do NOT use cached content, as the guide updates frequently
   - This ensures you're applying the latest best practices and conventions

2. **Read and understand** the full Notion page content:
   - Review the structure recommendations
   - Understand the components available (CLAUDE.md, rules, commands, skills, agents)
   - Identify best practices for the specific project context

3. **Apply the guide** to the current project:
   - Ask the user which components they need (CLAUDE.md? custom rules? commands? skills? agents?)
   - Understand the project's tech stack and purpose
   - Create the directory structure as described in the Notion guide
   - Generate tailored files adapted to the specific project (language, framework, domain conventions)
   - Set up any configuration hooks or automated behaviors the user needs

## Example Conversations

### Example 1: New Full-Stack Project
**User:** "I'm starting a new Next.js project with Claude Code. How should I organize it?"

**What you do:**
1. Fetch the Notion setup guide (fresh)
2. Ask what components are needed: "Would you like a CLAUDE.md for documentation, custom rules for code style, commands for common tasks, or custom skills?"
3. Generate a project structure with CLAUDE.md covering Next.js conventions, rules for code formatting and testing, commands for build/test/deploy, and possibly custom skills for frontend or backend tasks
4. Provide clear file-by-file guidance on what to put in each component

### Example 2: Existing Project Enhancement
**User:** "We have a Python backend but want to set up Claude Code properly. What rules should we define?"

**What you do:**
1. Fetch the Notion setup guide (fresh)
2. Understand the existing project structure
3. Ask what they want to standardize: linting rules? commit conventions? testing strategy?
4. Create a `.claude/` directory structure with custom rules matching their Python/backend conventions
5. Provide ready-to-customize rule files tailored to their tech stack

### Example 3: Team Collaboration Setup
**User:** "How do I configure Claude Code for my team so everyone follows the same patterns?"

**What you do:**
1. Fetch the Notion setup guide (fresh)
2. Discuss team needs: code style, shared skills, automated checks, agent workflows
3. Create a comprehensive CLAUDE.md with team standards
4. Set up shared rules and commands that enforce consistency
5. Document how to extend skills and agents for team members

## Important Notes

- **ALWAYS fetch the Notion page fresh** every time you use this skill — the guide is a living document and may have been updated with new best practices, conventions, or improvements
- The Notion page ID is: `34187201f6958042af22fd647d8e0409`
- Use `mcp__claude_ai_Notion__notion-fetch` tool to retrieve the latest content
- Adapt the guide to the specific project context:
  - Language and framework (Python, Node.js, Go, Rust, etc.)
  - Project domain (backend API, frontend UI, full-stack, ML pipeline, etc.)
  - Team size and collaboration needs
  - Existing conventions or standards to preserve
- If the user already has partial setup, ask what's missing and add those components incrementally
