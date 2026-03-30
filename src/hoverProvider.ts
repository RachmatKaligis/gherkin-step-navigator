import * as vscode from "vscode";
import { KeywordMatcher } from "./keywordMatcher";

/**
 * Provides Hover information for Gherkin steps.
 * Shows keyword signature, documentation, arguments, and file location.
 */
export class GherkinHoverProvider implements vscode.HoverProvider {
    constructor(private keywordMatcher: KeywordMatcher) {}

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        // Check if we're on a Gherkin step line
        const line = document.lineAt(position.line);
        const stepMatch = line.text.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/i);

        if (!stepMatch) {
            return undefined;
        }

        const stepText = stepMatch[2].trim();

        // Find matching keywords (limit to top 2)
        const matches = await this.keywordMatcher.findMatches(stepText, document.uri, 2);

        if (matches.length === 0) {
            return undefined;
        }

        // Build hover content
        const content = new vscode.MarkdownString();
        content.isTrusted = true;

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];

            if (i > 0) {
                content.appendMarkdown("\n\n---\n\n");
            }

            // Keyword name
            content.appendCodeblock(match.keyword, "robotframework");

            // File location
            const relativePath = vscode.workspace.asRelativePath(match.file);
            content.appendMarkdown(
                `\n**Location:** [${relativePath}:${match.line + 1}](${vscode.Uri.file(match.file)}#${match.line + 1})`
            );

            // Arguments
            if (match.arguments && match.arguments.length > 0) {
                content.appendMarkdown(`\n\n**Arguments:** ${match.arguments.join(", ")}`);
            }

            // Tags
            if (match.tags && match.tags.length > 0) {
                content.appendMarkdown(`\n\n**Tags:** ${match.tags.join(", ")}`);
            }

            // Documentation
            if (match.documentation) {
                content.appendMarkdown(`\n\n**Documentation:**\n${match.documentation}`);
            }
        }

        return new vscode.Hover(content);
    }
}
