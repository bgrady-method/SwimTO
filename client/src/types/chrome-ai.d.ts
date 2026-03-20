interface LanguageModelCreateOptions {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
}

interface LanguageModelSession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

interface LanguageModelAPI {
  availability(): Promise<'readily' | 'after-download' | 'no'>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
}

declare global {
  // eslint-disable-next-line no-var
  var LanguageModel: LanguageModelAPI | undefined;
}

export {};
