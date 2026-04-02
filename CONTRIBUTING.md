# Contributing to Gherkin Step Navigator

Thank you for your interest in contributing to the Gherkin Step Navigator extension! This document provides guidelines and instructions for contributing.

## How to Report Issues

- **Bug Reports**: Open an issue on [GitHub Issues](https://github.com/RachmatKaligis/gherkin-step-navigator/issues) with:
  - A clear description of the bug
  - Steps to reproduce the issue
  - Expected vs. actual behavior
  - Your VS Code version and OS
  - Extension version number

- **Feature Requests**: Open an issue with label `enhancement` describing:
  - What you'd like to add or improve
  - Use cases and motivation
  - Any proposed implementation approach

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RachmatKaligis/gherkin-step-navigator.git
   cd gherkin-step-navigator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run compile
   ```

4. **Test locally**:
   - Open the project in VS Code
   - Press `F5` to launch the Extension Development Host
   - Test the Go-to-Definition and Hover features with a `.feature` file

5. **Run linting**:
   ```bash
   npm run lint
   ```

## Submitting Changes

1. **Create a branch**: Use a descriptive branch name (e.g., `feature/improve-hover` or `fix/definition-lookup`)
2. **Make your changes**: 
   - Keep commits focused and atomic
   - Write clear commit messages
   - Follow the existing code style (TypeScript conventions)
3. **Test thoroughly**: Run the extension locally and verify all edge cases
4. **Submit a Pull Request**:
   - Provide a clear description of changes
   - Link any related issues
   - Include test/verification steps where applicable

## Code Style & Standards

- **Language**: TypeScript
- **Linting**: ESLint (run `npm run lint`)
- **Formatting**: Follow existing code style in the project
- **Comments**: Include comments for non-obvious logic
- **Performance**: Be mindful of keyword matching performance, especially for large projects

## Architecture Overview

The extension provides two main features:

1. **Go-to-Definition** (`definitionProvider.ts`): Navigate from Gherkin steps to Robot Framework keyword implementations
2. **Hover Information** (`hoverProvider.ts`): Display keyword signatures and documentation on hover

The `keywordMatcher.ts` module handles:
- Scanning `.resource` files for keyword definitions
- Matching Gherkin steps to Robot Framework keywords
- Caching results for 30 seconds to optimize performance

## Release Process

- Versioning follows [Semantic Versioning](https://semver.org/)
- Update [CHANGELOG.md](CHANGELOG.md) with notable changes
- Version bumps are made in `package.json` and `package-lock.json` during releases

## Questions?

Open an issue with the label `question` or start a discussion on GitHub. The project maintainer is happy to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License (same as this project).

---

**Thank you for contributing!** Every improvement makes this extension better for the Robot Framework community.
