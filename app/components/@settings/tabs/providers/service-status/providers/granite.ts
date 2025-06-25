import { BaseProviderChecker } from '~/components/@settings/tabs/providers/service-status/base-provider';
import type { StatusCheckResult } from '~/components/@settings/tabs/providers/service-status/types';

export class GraniteStatusChecker extends BaseProviderChecker {
  async checkStatus(): Promise<StatusCheckResult> {
    try {
      // Check Granite API endpoint directly
      const apiEndpoint = 'https://api.granite.io/v1/health';
      
      try {
        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          return {
            status: 'operational',
            message: 'Granite API: Operational',
            incidents: [],
          };
        } else {
          return {
            status: 'degraded',
            message: `Granite API: Degraded (Status ${response.status})`,
            incidents: [`API returned status code ${response.status}`],
          };
        }
      } catch (error) {
        console.error('Error checking Granite API:', error);
        
        // Fallback to basic endpoint check
        const endpointStatus = await this.checkEndpoint('https://api.granite.io/');
        
        return {
          status: endpointStatus === 'reachable' ? 'degraded' : 'down',
          message: `API endpoint: ${endpointStatus === 'reachable' ? 'Reachable but not responding properly' : 'Unreachable'}`,
          incidents: ['Note: Limited status information available'],
        };
      }
    } catch (error) {
      console.error('Error checking Granite status:', error);

      // Fallback to basic endpoint check
      const endpointStatus = await this.checkEndpoint('https://api.granite.io/');

      return {
        status: endpointStatus === 'reachable' ? 'degraded' : 'down',
        message: `API endpoint: ${endpointStatus}`,
        incidents: ['Note: Limited status information available'],
      };
    }
  }
}