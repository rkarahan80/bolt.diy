import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { getOpenAILikeModel } from '~/lib/modules/llm/base-provider';

export default class GraniteProvider extends BaseProvider {
  name = 'Granite';
  getApiKeyLink = 'https://console.granite.io/';
  labelForGetApiKey = 'Get Granite API Key';
  icon = 'granite';

  config = {
    apiTokenKey: 'GRANITE_API_KEY',
    baseUrlKey: 'GRANITE_API_BASE_URL',
    baseUrl: 'https://api.granite.io/v1',
  };

  staticModels: ModelInfo[] = [
    { name: 'granite-8b', label: 'Granite 8B', provider: 'Granite', maxTokenAllowed: 8192 },
    { name: 'granite-13b', label: 'Granite 13B', provider: 'Granite', maxTokenAllowed: 8192 },
    { name: 'granite-20b', label: 'Granite 20B', provider: 'Granite', maxTokenAllowed: 8192 },
    { name: 'granite-34b', label: 'Granite 34B', provider: 'Granite', maxTokenAllowed: 16384 },
    { name: 'granite-70b', label: 'Granite 70B', provider: 'Granite', maxTokenAllowed: 32768 },
    { name: 'granite-llama3-8b', label: 'Granite Llama3 8B', provider: 'Granite', maxTokenAllowed: 8192 },
    { name: 'granite-llama3-70b', label: 'Granite Llama3 70B', provider: 'Granite', maxTokenAllowed: 8192 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'GRANITE_API_BASE_URL',
      defaultApiTokenKey: 'GRANITE_API_KEY',
    });

    if (!apiKey) {
      throw `Missing API Key configuration for ${this.name} provider`;
    }

    try {
      const response = await fetch(`${baseUrl || this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      const staticModelIds = this.staticModels.map((m) => m.name);

      return data.data
        .filter((model: any) => !staticModelIds.includes(model.id))
        .map((model: any) => ({
          name: model.id,
          label: model.name || model.id,
          provider: this.name,
          maxTokenAllowed: model.context_length || 8192,
        }));
    } catch (error) {
      console.error('Error fetching Granite models:', error);
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'GRANITE_API_BASE_URL',
      defaultApiTokenKey: 'GRANITE_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    // Granite uses an OpenAI-compatible API
    return getOpenAILikeModel(
      baseUrl || this.config.baseUrl,
      apiKey,
      model
    );
  }
}