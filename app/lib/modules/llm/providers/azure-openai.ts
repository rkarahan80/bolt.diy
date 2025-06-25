import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class AzureOpenAIProvider extends BaseProvider {
  name = 'Azure OpenAI';
  getApiKeyLink = 'https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.CognitiveServices%2Faccounts';
  labelForGetApiKey = 'Get Azure OpenAI API Key';
  icon = 'azure';

  config = {
    apiTokenKey: 'AZURE_OPENAI_API_KEY',
    baseUrlKey: 'AZURE_OPENAI_ENDPOINT',
  };

  staticModels: ModelInfo[] = [
    { name: 'gpt-4o', label: 'GPT-4o', provider: 'Azure OpenAI', maxTokenAllowed: 8000 },
    { name: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'Azure OpenAI', maxTokenAllowed: 8000 },
    { name: 'gpt-4', label: 'GPT-4', provider: 'Azure OpenAI', maxTokenAllowed: 8000 },
    { name: 'gpt-35-turbo', label: 'GPT-3.5 Turbo', provider: 'Azure OpenAI', maxTokenAllowed: 4000 },
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
      defaultBaseUrlKey: 'AZURE_OPENAI_ENDPOINT',
      defaultApiTokenKey: 'AZURE_OPENAI_API_KEY',
    });

    if (!apiKey || !baseUrl) {
      throw `Missing API Key or Endpoint configuration for ${this.name} provider`;
    }

    // Azure OpenAI requires API version
    const apiVersion = settings?.apiVersion || '2023-12-01-preview';
    
    try {
      const response = await fetch(`${baseUrl}/openai/deployments?api-version=${apiVersion}`, {
        headers: {
          'api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const res = await response.json();
      const staticModelIds = this.staticModels.map((m) => m.name);

      return res.data
        .filter((deployment: any) => !staticModelIds.includes(deployment.id))
        .map((deployment: any) => ({
          name: deployment.id,
          label: `${deployment.id} (${deployment.model})`,
          provider: this.name,
          maxTokenAllowed: 8000, // Default value, Azure doesn't provide this directly
        }));
    } catch (error) {
      console.error('Error fetching Azure OpenAI deployments:', error);
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
    const settings = providerSettings?.[this.name];

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'AZURE_OPENAI_ENDPOINT',
      defaultApiTokenKey: 'AZURE_OPENAI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    if (!baseUrl) {
      throw new Error(`Missing endpoint URL for ${this.name} provider`);
    }

    // Azure OpenAI requires API version
    const apiVersion = settings?.apiVersion || '2023-12-01-preview';

    const openai = createOpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
      defaultQuery: {
        'api-version': apiVersion,
      },
      defaultHeaders: {
        'api-key': apiKey,
      },
      deployment: model,
    });

    return openai(model);
  }
}