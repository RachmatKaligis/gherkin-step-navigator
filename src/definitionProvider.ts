import * as vscode from "vscode";
import { KeywordMatcher } from "./keywordMatcher";

/**
 * Provides Go to Definition for Gherkin steps.
 * Navigates from a Gherkin step to its Robot Framework keyword implementation.
 */
export class GherkinDefinitionProvider implements vscode.DefinitionProvider {
    constructor(private keywordMatcher: KeywordMatcher) {}

    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Definition | undefined> {
        // Check if we're on a Gherkin step line
        const line = document.lineAt(position.line);
        const stepMatch = line.text.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/i);

        if (!stepMatch) {
            return undefined;
        }

        const stepText = stepMatch[2].trim();

        // Find matching keywords
        const matches = await this.keywordMatcher.findMatches(stepText, document.uri);

        if (matches.length === 0) {
            return undefined;
        }

        // Convert to VS Code locations
        const definitions: vscode.Location[] = [];
        for (const match of matches) {
            try {
                const uri = vscode.Uri.file(match.file);
                const location = new vscode.Location(uri, new vscode.Position(match.line, 0));
                definitions.push(location);
            } catch (error) {
                console.error(`[DefinitionProvider] Error creating location:`, error);
            }
        }

        return definitions.length > 0 ? definitions : undefined;
    }
}
