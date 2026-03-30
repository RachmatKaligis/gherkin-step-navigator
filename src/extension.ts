import * as vscode from "vscode";
import { KeywordMatcher } from "./keywordMatcher";
import { GherkinDefinitionProvider } from "./definitionProvider";
import { GherkinHoverProvider } from "./hoverProvider";

/**
 * Activates the Gherkin Step Navigator extension.
 * Registers definition and hover providers for Gherkin feature files.
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log("[Gherkin Step Navigator] Activating...");

    // Create shared keyword matcher
    const keywordMatcher = new KeywordMatcher();

    // Create providers
    const definitionProvider = new GherkinDefinitionProvider(keywordMatcher);
    const hoverProvider = new GherkinHoverProvider(keywordMatcher);

    // Register for 'gherkin' language (used by Gherkin extensions)
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider("gherkin", definitionProvider),
        vscode.languages.registerHoverProvider("gherkin", hoverProvider)
    );

    // Also register for 'markdown' language (for .feature.md files)
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider("markdown", definitionProvider),
        vscode.languages.registerHoverProvider("markdown", hoverProvider)
    );

    console.log("[Gherkin Step Navigator] Activated successfully");
}

export function deactivate(): void {
    console.log("[Gherkin Step Navigator] Deactivated");
}
