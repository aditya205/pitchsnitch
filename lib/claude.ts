import Anthropic from "@anthropic-ai/sdk";

// SERVER-ONLY.
export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
