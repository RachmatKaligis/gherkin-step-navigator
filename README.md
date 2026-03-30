# Gherkin Step Navigator for RobotCode

**Go to Definition** and **Hover** support for Gherkin steps in Robot Framework projects.

> **Companion Extension**: This extension is designed to work alongside [RobotCode GherkinParser Support](https://marketplace.visualstudio.com/items?itemName=d-biehl.robotcode-gherkin), providing enhanced navigation features for Gherkin-based BDD testing with Robot Framework.

Navigate directly from Gherkin feature files to their Robot Framework keyword implementations.

## Prerequisites

- [RobotCode](https://marketplace.visualstudio.com/items?itemName=d-biehl.robotcode) — Robot Framework support for VS Code
- [RobotCode GherkinParser Support](https://marketplace.visualstudio.com/items?itemName=d-biehl.robotcode-gherkin) — Gherkin syntax support for RobotCode

## Features

### Go to Definition

**Ctrl+Click** (or **F12**) on any Gherkin step to jump directly to its keyword implementation in `.resource` files.

```gherkin
Feature: User Login
  Scenario: Successful login
    Given I am on the login page      # Ctrl+Click to jump to keyword
    When I enter valid credentials
    Then I should see the dashboard
```

### Hover Information

**Hover** over any Gherkin step to see:
- Keyword signature
- File location with clickable link
- Arguments and types
- Tags
- Documentation

### Smart Matching

- **Exact matching** — Direct keyword name matches
- **Variable patterns** — Handles `${variable}` placeholders in keywords
- **Flexible quotes** — Matches steps with or without quoted strings

## Installation

1. Install [RobotCode](https://marketplace.visualstudio.com/items?itemName=d-biehl.robotcode) for Robot Framework support
2. Install [RobotCode GherkinParser Support](https://marketplace.visualstudio.com/items?itemName=d-biehl.robotcode-gherkin) for Gherkin syntax and language support
3. Install this extension from the VS Code Marketplace
4. Open a workspace with `.feature` files and `.resource` files

## How It Works

The extension:
1. **Scans** your workspace for Robot Framework `.resource` files
2. **Parses** the `*** Keywords ***` sections to find keyword definitions
3. **Matches** Gherkin steps to keywords using exact and pattern matching
4. **Caches** results for 30 seconds for fast navigation

### File Structure

The extension looks for keywords in:
- `**/steps/**/*.resource` — Primary location (recommended)
- `**/*.resource` — Fallback for all resource files

### Example

**Feature file** (`login.feature`):
```gherkin
Given a user named "Alice" with password "secret123"
```

**Keyword file** (`steps/auth.resource`):
```robotframework
*** Keywords ***
a user named "${name}" with password "${password}"
    [Documentation]    Create a test user with credentials
    [Arguments]        ${extra_args}=
    Create User    ${name}    ${password}
```

**Result:** Ctrl+Click on the step navigates to line 3 of `auth.resource`.

## Requirements

- VS Code 1.82.0 or later
- [RobotCode](https://marketplace.visualstudio.com/items?itemName=d-biehl.robotcode) — for Robot Framework support
- [RobotCode GherkinParser Support](https://marketplace.visualstudio.com/items?itemName=d-biehl.robotcode-gherkin) — for Gherkin syntax support
- Robot Framework keyword files (`.resource`)

## Compatibility

This extension is designed to work as a **companion** to [RobotCode GherkinParser Support](https://marketplace.visualstudio.com/items?itemName=d-biehl.robotcode-gherkin):
- Provides navigation features (Go to Definition, Hover) that complement the GherkinParser
- Does not register language grammars or syntax highlighting (handled by GherkinParser)
- Works seamlessly with existing RobotCode extensions

## Contributing

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/RachmatKaligis/gherkin-step-navigator/issues).

## License

MIT License - see [LICENSE](LICENSE) for details.
