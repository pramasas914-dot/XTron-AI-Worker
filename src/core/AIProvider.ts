export interface AIProvider {
    name: string;
    apiKey: string;
    baseURL: string;
    maxTokens: number;
    isAvailable: boolean;
}

export interface AIResponse {
    content: string;
    tokens: number;
    provider: string;
    timestamp: Date;
}

export class AIProviderManager {
    private providers: Map<string, AIProvider> = new Map();
    private activeProvider: AIProvider | null = null;
    private fallbackChain: string[] = [];

    registerProvider(providerConfig: AIProvider): void {
        this.providers.set(providerConfig.name, providerConfig);
    }

    setFallbackChain(providerNames: string[]): void {
        this.fallbackChain = providerNames.filter(name => this.providers.has(name));
    }

    getAvailableProviders(): AIProvider[] {
        return Array.from(this.providers.values()).filter(p => p.isAvailable);
    }

    selectProvider(requirement?: string): AIProvider | null {
        if (this.fallbackChain.length === 0) {
            return this.getAvailableProviders()[0] || null;
        }
        for (const providerName of this.fallbackChain) {
            const provider = this.providers.get(providerName);
            if (provider?.isAvailable) {
                this.activeProvider = provider;
                return provider;
            }
        }
        return null;
    }

    async validateApiKey(providerName: string, apiKey: string): Promise<boolean> {
        try {
            const provider = this.providers.get(providerName);
            if (!provider) return false;
            if (providerName === 'openai' && !apiKey.startsWith('sk-')) return false;
            if (providerName === 'claude' && !apiKey.startsWith('sk-ant-')) return false;
            if (providerName === 'gemini' && apiKey.length < 20) return false;
            return true;
        } catch (error) {
            return false;
        }
    }

    removeProvider(providerName: string): void {
        this.providers.delete(providerName);
        if (this.activeProvider?.name === providerName) {
            this.activeProvider = null;
        }
    }

    getProviderStats(): Record<string, any> {
        return {
            total: this.providers.size,
            available: this.getAvailableProviders().length,
            providers: Array.from(this.providers.values()).map(p => ({
                name: p.name,
                available: p.isAvailable,
                maxTokens: p.maxTokens
            }))
        };
    }
}

export const PROVIDERS_CONFIG = {
    openai: {
        name: 'openai',
        baseURL: 'https://api.openai.com/v1',
        models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        maxTokens: 128000
    },
    claude: {
        name: 'claude',
        baseURL: 'https://api.anthropic.com/v1',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        maxTokens: 200000
    },
    gemini: {
        name: 'gemini',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        models: ['gemini-pro', 'gemini-pro-vision'],
        maxTokens: 32000
    },
    groq: {
        name: 'groq',
        baseURL: 'https://api.groq.com/openai/v1',
        models: ['mixtral-8x7b-32768', 'llama2-70b-4096'],
        maxTokens: 32768
    },
    cohere: {
        name: 'cohere',
        baseURL: 'https://api.cohere.com/v1',
        models: ['command-r-plus', 'command-r'],
        maxTokens: 4096
    }
};