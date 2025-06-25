import { BaseProviderChecker } from '~/components/@settings/tabs/providers/service-status/base-provider';
import type { StatusCheckResult } from '~/components/@settings/tabs/providers/service-status/types';

export class AzureOpenAIStatusChecker extends BaseProviderChecker {
  async checkStatus(): Promise<StatusCheckResult> {
    try {
      // Check Azure status page
      const statusPageResponse = await fetch('https://status.azure.com/en-us/status');
      const text = await statusPageResponse.text();

      // Check for Azure Cognitive Services status
      const cognitiveServicesStatus = text.includes('Cognitive Services') 
        ? (
            text.includes('Cognitive Services') && text.includes('Service is experiencing issues') 
              ? 'degraded' 
              : text.includes('Cognitive Services') && text.includes('Service is down') 
                ? 'down' 
                : 'operational'
          )
        : 'operational';

      // Extract recent incidents
      const incidents: string[] = [];
      const incidentMatches = text.match(/Recent History(.*?)(?=<\/div>)/s);

      if (incidentMatches) {
        const recentIncidents = incidentMatches[1]
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.includes('<') && line.length > 10);

        incidents.push(...recentIncidents.slice(0, 5));
      }

      // Determine overall status
      let status: StatusCheckResult['status'] = cognitiveServicesStatus;
      const messages: string[] = [];

      if (status === 'down') {
        messages.push('Azure Cognitive Services: Major Outage');
      } else if (status === 'degraded') {
        messages.push('Azure Cognitive Services: Degraded Performance');
      } else {
        messages.push('Azure Cognitive Services: Operational');
      }

      // If status page check fails, fallback to endpoint check
      if (!statusPageResponse.ok) {
        const endpointStatus = await this.checkEndpoint('https://status.azure.com/');
        
        return {
          status: endpointStatus === 'reachable' ? 'operational' : 'degraded',
          message: `Status page: ${endpointStatus}`,
          incidents: ['Note: Limited status information due to CORS restrictions'],
        };
      }

      return {
        status,
        message: messages.join(', ') || 'Status unknown',
        incidents,
      };
    } catch (error) {
      console.error('Error checking Azure OpenAI status:', error);

      // Fallback to basic endpoint check
      const endpointStatus = await this.checkEndpoint('https://status.azure.com/');

      return {
        status: endpointStatus === 'reachable' ? 'operational' : 'degraded',
        message: `Status page: ${endpointStatus}`,
        incidents: ['Note: Limited status information due to CORS restrictions'],
      };
    }
  }
}