import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export default class VertexAIProvider extends BaseProvider {
  name = 'Vertex AI';
  getApiKeyLink = 'https://console.cloud.google.com/vertex-ai/generative';
  labelForGetApiKey = 'Get Vertex AI API Key';
  icon = 'google';

  config = {
    apiTokenKey: 'VERTEX_AI_API_KEY',
    baseUrlKey: 'VERTEX_AI_ENDPOINT',
  };

  staticModels: ModelInfo[] = [
    { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Vertex AI', maxTokenAllowed: 32000 },
    { name: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'Vertex AI', maxTokenAllowed: 32000 },
    { name: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro', provider: 'Vertex AI', maxTokenAllowed: 8192 },
    { name: 'gemini-1.0-pro-vision', label: 'Gemini 1.0 Pro Vision', provider: 'Vertex AI', maxTokenAllowed: 8192 },
    { name: 'text-bison', label: 'Text Bison', provider: 'Vertex AI', maxTokenAllowed: 8192 },
    { name: 'chat-bison', label: 'Chat Bison', provider: 'Vertex AI', maxTokenAllowed: 8192 },
    { name: 'claude-3-sonnet@vertex', label: 'Claude 3 Sonnet (Vertex)', provider: 'Vertex AI', maxTokenAllowed: 28000 },
    { name: 'claude-3-haiku@vertex', label: 'Claude 3 Haiku (Vertex)', provider: 'Vertex AI', maxTokenAllowed: 28000 },
    { name: 'claude-3-opus@vertex', label: 'Claude 3 Opus (Vertex)', provider: 'Vertex AI', maxTokenAllowed: 28000 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'VERTEX_AI_ENDPOINT',
      defaultApiTokenKey: 'VERTEX_AI_API_KEY',
    });

    if (!apiKey) {
      throw `Missing API Key configuration for ${this.name} provider`;
    }

    // For Vertex AI, we would typically need to use the Google Cloud client libraries
    // to fetch available models, but that's complex for browser environments.
    // Instead, we'll return an empty array and rely on the static models.
    return [];
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;
    const settings = providerSettings?.[this.name];

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'VERTEX_AI_ENDPOINT',
      defaultApiTokenKey: 'VERTEX_AI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    // Get project ID from settings or environment
    const projectId = settings?.projectId || 
                      serverEnv?.VERTEX_AI_PROJECT_ID || 
                      process?.env?.VERTEX_AI_PROJECT_ID;

    if (!projectId) {
      throw new Error(`Missing project ID for ${this.name} provider`);
    }

    // For Vertex AI, we use the Google AI SDK with additional configuration
    const google = createGoogleGenerativeAI({
      apiKey,
      options: {
        apiVersion: 'v1',
        projectId: projectId,
        location: settings?.location || 'us-central1',
        useVertexAI: true,
      }
    });

    return google(model);
  }
}