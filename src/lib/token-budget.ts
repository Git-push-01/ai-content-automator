/**
 * Token Budget Tracker
 * Tracks OpenAI API usage and enforces spending limits
 */

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  calls: number;
}

interface BudgetConfig {
  maxTokens: number;
  maxCost: number; // in USD
  warningThreshold: number; // percentage (0-1)
}

// GPT-4o pricing (as of 2024)
const PRICING = {
  "gpt-4o": {
    input: 2.5 / 1_000_000, // $2.50 per 1M input tokens
    output: 10 / 1_000_000, // $10 per 1M output tokens
  },
  "gpt-4o-mini": {
    input: 0.15 / 1_000_000,
    output: 0.6 / 1_000_000,
  },
};

class TokenBudgetTracker {
  private usage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    calls: 0,
  };

  private config: BudgetConfig;

  constructor() {
    this.config = {
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "100000", 10),
      maxCost: parseFloat(process.env.OPENAI_MAX_COST_USD || "1.00"),
      warningThreshold: parseFloat(
        process.env.OPENAI_WARNING_THRESHOLD || "0.8"
      ),
    };
  }

  /**
   * Check if we can make an API call within budget
   */
  canMakeCall(estimatedTokens: number = 2500): {
    allowed: boolean;
    reason?: string;
    remaining: { tokens: number; cost: number };
  } {
    const remainingTokens = this.config.maxTokens - this.usage.totalTokens;
    const remainingCost = this.config.maxCost - this.usage.estimatedCost;

    if (this.usage.totalTokens + estimatedTokens > this.config.maxTokens) {
      return {
        allowed: false,
        reason: `Token budget exceeded. Used ${this.usage.totalTokens}/${this.config.maxTokens} tokens.`,
        remaining: { tokens: remainingTokens, cost: remainingCost },
      };
    }

    if (this.usage.estimatedCost >= this.config.maxCost) {
      return {
        allowed: false,
        reason: `Cost budget exceeded. Spent $${this.usage.estimatedCost.toFixed(4)}/$${this.config.maxCost.toFixed(2)}.`,
        remaining: { tokens: remainingTokens, cost: remainingCost },
      };
    }

    return {
      allowed: true,
      remaining: { tokens: remainingTokens, cost: remainingCost },
    };
  }

  /**
   * Record token usage from an API call
   */
  recordUsage(
    promptTokens: number,
    completionTokens: number,
    model: "gpt-4o" | "gpt-4o-mini" = "gpt-4o"
  ): void {
    const pricing = PRICING[model];
    const callCost =
      promptTokens * pricing.input + completionTokens * pricing.output;

    this.usage.promptTokens += promptTokens;
    this.usage.completionTokens += completionTokens;
    this.usage.totalTokens += promptTokens + completionTokens;
    this.usage.estimatedCost += callCost;
    this.usage.calls += 1;

    // Log warning if approaching limit
    const tokenPercent = this.usage.totalTokens / this.config.maxTokens;
    const costPercent = this.usage.estimatedCost / this.config.maxCost;

    if (
      tokenPercent >= this.config.warningThreshold ||
      costPercent >= this.config.warningThreshold
    ) {
      console.warn(
        `⚠️ Token budget warning: ${(Math.max(tokenPercent, costPercent) * 100).toFixed(1)}% of budget used`
      );
    }
  }

  /**
   * Get current usage stats
   */
  getUsage(): TokenUsage & { budget: BudgetConfig } {
    return {
      ...this.usage,
      budget: this.config,
    };
  }

  /**
   * Reset usage (for new session)
   */
  reset(): void {
    this.usage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      calls: 0,
    };
  }

  /**
   * Get formatted usage summary
   */
  getSummary(): string {
    const tokenPercent = (
      (this.usage.totalTokens / this.config.maxTokens) *
      100
    ).toFixed(1);
    const costPercent = (
      (this.usage.estimatedCost / this.config.maxCost) *
      100
    ).toFixed(1);

    return `AI Usage: ${this.usage.calls} calls | ${this.usage.totalTokens.toLocaleString()}/${this.config.maxTokens.toLocaleString()} tokens (${tokenPercent}%) | $${this.usage.estimatedCost.toFixed(4)}/$${this.config.maxCost.toFixed(2)} (${costPercent}%)`;
  }
}

// Singleton instance for the session
let tracker: TokenBudgetTracker | null = null;

export function getTokenBudgetTracker(): TokenBudgetTracker {
  if (!tracker) {
    tracker = new TokenBudgetTracker();
  }
  return tracker;
}

export function resetTokenBudget(): void {
  tracker = null;
}

export type { TokenUsage, BudgetConfig };
