import * as vscode from "vscode";

/**
 * Information about a Robot Framework keyword found in a .resource file
 */
export interface KeywordInfo {
    /** The keyword name as written in the file */
    keyword: string;
    /** Absolute path to the file containing the keyword */
    file: string;
    /** 0-based line number where the keyword is defined */
    line: number;
    /** Keyword documentation from [Documentation] tag */
    documentation?: string;
    /** Arguments from [Arguments] tag */
    arguments?: string[];
    /** Tags from [Tags] tag */
    tags?: string[];
    /** Match priority (1 = exact, 2 = pattern) */
    priority?: number;
    /** Regex pattern for matching steps with variables */
    pattern?: RegExp;
}

/**
 * Shared keyword matching logic for Gherkin step navigation.
 * Parses Robot Framework .resource files and matches Gherkin steps to keyword definitions.
 */
export class KeywordMatcher {
    private keywordCache: Map<string, KeywordInfo[]> = new Map();
    private cacheTimestamp: number = 0;
    private readonly CACHE_TIMEOUT = 30000; // 30 seconds

    /**
     * Find keywords matching a Gherkin step text
     * @param stepText The step text (without Given/When/Then prefix)
     * @param documentUri URI of the document containing the step (for workspace resolution)
     * @param limit Maximum number of matches to return (default: all)
     */
    async findMatches(
        stepText: string,
        documentUri: vscode.Uri,
        limit?: number
    ): Promise<KeywordInfo[]> {
        await this.refreshCache(documentUri);
        const matches = this.findMatchingKeywords(stepText);
        return limit ? matches.slice(0, limit) : matches;
    }

    /**
     * Refresh the keyword cache if expired
     */
    private async refreshCache(documentUri: vscode.Uri): Promise<void> {
        const now = Date.now();
        if (now - this.cacheTimestamp < this.CACHE_TIMEOUT && this.keywordCache.size > 0) {
            return;
        }

        this.keywordCache.clear();
        this.cacheTimestamp = now;

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
        if (!workspaceFolder) {
            return;
        }

        // Find .resource files - prioritize steps/ directories
        const stepsPattern = new vscode.RelativePattern(workspaceFolder, "**/steps/**/*.resource");
        const generalPattern = new vscode.RelativePattern(workspaceFolder, "**/*.resource");

        const [stepsFiles, allFiles] = await Promise.all([
            vscode.workspace.findFiles(stepsPattern),
            vscode.workspace.findFiles(generalPattern)
        ]);

        // Combine and deduplicate
        const fileSet = new Set<string>();
        const uniqueFiles: vscode.Uri[] = [];
        
        for (const file of [...stepsFiles, ...allFiles]) {
            if (!fileSet.has(file.fsPath)) {
                fileSet.add(file.fsPath);
                uniqueFiles.push(file);
            }
        }

        // Parse all resource files
        await Promise.all(uniqueFiles.map(uri => this.parseResourceFile(uri)));
    }

    /**
     * Parse a Robot Framework .resource file and extract keywords
     */
    private async parseResourceFile(fileUri: vscode.Uri): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const content = document.getText();
            const lines = content.split(/\r?\n/);

            let inKeywordsSection = false;
            let currentKeyword: KeywordInfo | null = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmedLine = line.trim();

                // Check for *** Keywords *** section
                if (trimmedLine.match(/^\*\*\*\s*Keywords\s*\*\*\*$/i)) {
                    inKeywordsSection = true;
                    continue;
                }

                // Check for other sections
                if (trimmedLine.match(/^\*\*\*.*\*\*\*$/)) {
                    inKeywordsSection = false;
                    if (currentKeyword) {
                        this.addKeywordToCache(currentKeyword);
                        currentKeyword = null;
                    }
                    continue;
                }

                if (inKeywordsSection && trimmedLine) {
                    // Keyword definition: not indented, not a setting, not a comment
                    if (!line.startsWith('    ') && !line.startsWith('\t') && trimmedLine !== '') {
                        // Save previous keyword
                        if (currentKeyword) {
                            this.addKeywordToCache(currentKeyword);
                        }

                        // Skip settings and comments
                        if (trimmedLine.startsWith('[') || trimmedLine.startsWith('#')) {
                            continue;
                        }

                        // Start new keyword
                        currentKeyword = {
                            keyword: trimmedLine,
                            file: fileUri.fsPath,
                            line: i,
                            arguments: [],
                            tags: [],
                            documentation: "",
                            pattern: this.createKeywordPattern(trimmedLine)
                        };
                    } else if (currentKeyword) {
                        // Parse keyword settings
                        if (trimmedLine.startsWith('[Documentation]')) {
                            const match = trimmedLine.match(/\[Documentation\]\s*(.+)/);
                            if (match) {
                                currentKeyword.documentation = match[1];
                            }
                        } else if (trimmedLine.startsWith('[Arguments]')) {
                            const match = trimmedLine.match(/\[Arguments\]\s*(.+)/);
                            if (match) {
                                currentKeyword.arguments = match[1].split(/\s+/);
                            }
                        } else if (trimmedLine.startsWith('[Tags]')) {
                            const match = trimmedLine.match(/\[Tags\]\s*(.+)/);
                            if (match) {
                                currentKeyword.tags = match[1].split(/\s+/);
                            }
                        }
                    }
                }
            }

            // Don't forget the last keyword
            if (currentKeyword) {
                this.addKeywordToCache(currentKeyword);
            }
        } catch (error) {
            console.error(`[KeywordMatcher] Error parsing ${fileUri.fsPath}:`, error);
        }
    }

    /**
     * Add a keyword to the cache, avoiding duplicates
     */
    private addKeywordToCache(keywordInfo: KeywordInfo): void {
        const normalizedKey = this.normalizeForMatching(keywordInfo.keyword);
        
        if (!this.keywordCache.has(normalizedKey)) {
            this.keywordCache.set(normalizedKey, []);
        }

        const existing = this.keywordCache.get(normalizedKey)!;
        const isDuplicate = existing.some(k =>
            k.keyword === keywordInfo.keyword &&
            k.file === keywordInfo.file &&
            k.line === keywordInfo.line
        );

        if (!isDuplicate) {
            existing.push(keywordInfo);
        }
    }

    /**
     * Create a regex pattern for matching steps with variables
     */
    private createKeywordPattern(keyword: string): RegExp {
        let pattern = keyword;
        let captureGroupIndex = 0;

        // Handle quoted variables first
        pattern = pattern.replace(/["']?(\$\{[^}]+\})["']?/g, () => {
            captureGroupIndex++;
            return `__CAPTURE_${captureGroupIndex}__`;
        });

        // Escape regex special characters
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Replace placeholders with capture groups
        for (let i = 1; i <= captureGroupIndex; i++) {
            pattern = pattern.replace(
                `__CAPTURE_${i}__`,
                `(?:["'])?([^"']*)(?:["'])?`
            );
        }

        // Normalize whitespace
        pattern = pattern.replace(/\s+/g, '\\s+');

        return new RegExp(`^${pattern}$`, 'i');
    }

    /**
     * Find keywords matching a step text
     */
    private findMatchingKeywords(stepText: string): KeywordInfo[] {
        const matches: KeywordInfo[] = [];

        // Clean step text
        const cleanStepText = stepText
            .replace(/^["']|["']$/g, '')
            .replace(/["']/g, '')
            .trim();

        const normalizedStep = this.normalizeForMatching(cleanStepText);

        // Try direct lookup first (exact match)
        const directMatches = this.keywordCache.get(normalizedStep);
        if (directMatches) {
            matches.push(...directMatches.map(m => ({ ...m, priority: 1 })));
        }

        // Then try pattern matching for keywords with variables
        for (const [normalizedKeyword, keywordInfos] of this.keywordCache) {
            if (normalizedKeyword === normalizedStep) {
                continue; // Already added as exact match
            }

            for (const keywordInfo of keywordInfos) {
                if (keywordInfo.pattern && keywordInfo.pattern.test(cleanStepText)) {
                    matches.push({ ...keywordInfo, priority: 2 });
                }
            }
        }

        // Sort by priority
        return matches.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    }

    /**
     * Normalize text for matching comparison
     */
    private normalizeForMatching(text: string): string {
        return text
            .toLowerCase()
            .replace(/^(given|when|then|and|but)\s+/i, '')
            .replace(/\$\{[^}]+\}/g, 'VAR')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Clear the cache (useful for testing or manual refresh)
     */
    clearCache(): void {
        this.keywordCache.clear();
        this.cacheTimestamp = 0;
    }
}
