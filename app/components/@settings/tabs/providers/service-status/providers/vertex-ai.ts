import { BaseProviderChecker } from '~/components/@settings/tabs/providers/service-status/base-provider';
import type { StatusCheckResult } from '~/components/@settings/tabs/providers/service-status/types';

export class VertexAIStatusChecker extends BaseProviderChecker {
  async checkStatus(): Promise<StatusCheckResult> {
    try {
      // Check Google Cloud status page
      const statusPageResponse = await fetch('https://status.cloud.google.com/');
      const text = await statusPageResponse.text();

      // Check for Vertex AI status
      const vertexAIStatus = text.includes('Vertex AI') 
        ? (
            text.includes('Vertex AI') && text.includes('Service disruption') 
              ? 'degraded' 
              : text.includes('Vertex AI') && text.includes('Service outage') 
                ? 'down' 
                : 'operational'
          )
        : 'operational';

      // Extract recent incidents
      const incidents: string[] = [];
      const incidentMatches = text.match(/Incidents(.*?)(?=<\/div>)/s);

      if (incidentMatches) {
        const recentIncidents = incidentMatches[1]
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.includes('<') && line.length > 10);

        incidents.push(...recentIncidents.slice(0, 5));
      }

      // Determine overall status
      let status: StatusCheckResult['status'] = vertexAIStatus;
      const messages: string[] = [];

      if (status === 'down') {
        messages.push('Vertex AI: Major Outage');
      } else if (status === 'degraded') {
        messages.push('Vertex AI: Degraded Performance');
      } else {
        messages.push('Vertex AI: Operational');
      }

      // If status page check fails, fallback to endpoint check
      if (!statusPageResponse.ok) {
        const endpointStatus = await this.checkEndpoint('https://status.cloud.google.com/');
        
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
      console.error('Error checking Vertex AI status:', error);

      // Fallback to basic endpoint check
      const endpointStatus = await this.checkEndpoint('https://status.cloud.google.com/');

      return {
        status: endpointStatus === 'reachable' ? 'operational' : 'degraded',
        message: `Status page: ${endpointStatus}`,
        incidents: ['Note: Limited status information due to CORS restrictions'],
      };
    }
  }
}