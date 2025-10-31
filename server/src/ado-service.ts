import axios, { AxiosInstance } from 'axios';
import { CMGFormData } from './types';
import fs from 'fs';
import path from 'path';

export interface ADOConfig {
  organization: string;
  project: string;
  personalAccessToken: string;
  areaPath?: string;
  iterationPath?: string;
}

export interface ADOWorkItem {
  id: number;
  url: string;
  fields: {
    'System.Title': string;
    'System.State': string;
    'System.WorkItemType': string;
    [key: string]: any;
  };
}

export class AzureDevOpsService {
  private client: AxiosInstance;
  private config: ADOConfig;
  private baseUrl: string;

  constructor(config: ADOConfig) {
    this.config = config;
    this.baseUrl = `https://dev.azure.com/${config.organization}/${encodeURIComponent(config.project)}`;

    // Create axios instance with authentication
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json-patch+json',
        'Authorization': `Basic ${Buffer.from(`:${config.personalAccessToken}`).toString('base64')}`
      }
    });
  }

  /**
   * Upload an attachment to Azure DevOps
   */
  private async uploadAttachment(filePath: string): Promise<string> {
    try {
      const fileName = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath);

      console.log(`Uploading attachment: ${fileName} (${fileContent.length} bytes)`);

      const uploadUrl = `https://dev.azure.com/${this.config.organization}/_apis/wit/attachments?fileName=${encodeURIComponent(fileName)}&api-version=7.1`;
      console.log(`Upload URL: ${uploadUrl}`);

      const response = await axios.post(
        uploadUrl,
        fileContent,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': `Basic ${Buffer.from(`:${this.config.personalAccessToken}`).toString('base64')}`
          }
        }
      );

      console.log(`✅ Attachment uploaded: ${fileName} -> ${response.data.url}`);
      return response.data.url;
    } catch (error: any) {
      console.error(`❌ Error uploading attachment ${filePath}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Create a new work item (User Story) in Azure DevOps
   */
  async createWorkItem(formData: CMGFormData, attachmentPaths?: string[]): Promise<ADOWorkItem> {
    try {
      // Build the description with formatted data
      const description = this.buildDescription(formData);

      // Build the JSON Patch document for creating the work item
      type PatchOperation = {
        op: string;
        path: string;
        value: any;
      };
      const patchDocument: PatchOperation[] = [
        {
          op: 'add',
          path: '/fields/System.Title',
          value: formData.title
        },
        {
          op: 'add',
          path: '/fields/System.Description',
          value: description
        },
        {
          op: 'add',
          path: '/fields/System.Tags',
          value: this.buildTags(formData)
        }
      ];

      // Add Area Path if configured
      if (this.config.areaPath) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.AreaPath',
          value: this.config.areaPath
        });
      }

      // Add Iteration Path if configured
      if (this.config.iterationPath) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.IterationPath',
          value: this.config.iterationPath
        });
      }

      // Upload attachments and add as relations
      if (attachmentPaths && attachmentPaths.length > 0) {
        console.log(`Uploading ${attachmentPaths.length} attachment(s)...`);
        console.log('Attachment paths:', JSON.stringify(attachmentPaths, null, 2));

        for (const filePath of attachmentPaths) {
          try {
            console.log(`Processing attachment: ${filePath}`);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
              console.error(`❌ File not found: ${filePath}`);
              continue;
            }

            console.log(`✅ File exists, uploading: ${filePath}`);
            const attachmentUrl = await this.uploadAttachment(filePath);
            console.log(`✅ Attachment uploaded successfully: ${attachmentUrl}`);

            // Add attachment as a relation to the work item
            patchDocument.push({
              op: 'add',
              path: '/relations/-',
              value: {
                rel: 'AttachedFile',
                url: attachmentUrl,
                attributes: {
                  comment: `Uploaded from CMG Intake: ${path.basename(filePath)}`
                }
              }
            });
            console.log(`✅ Attachment added to patch document`);
          } catch (error: any) {
            console.error(`❌ Failed to upload attachment ${filePath}:`, error.message);
            console.error('Error stack:', error.stack);
          }
        }
      }

      console.log('Creating ADO work item...');
      console.log('URL:', `${this.baseUrl}/_apis/wit/workitems/$User Story?api-version=7.1`);

      // Make the API call to create the work item
      const response = await this.client.post(
        '/_apis/wit/workitems/$User Story?api-version=7.1',
        patchDocument
      );

      const workItem: ADOWorkItem = response.data;

      console.log(`✅ Work item created successfully! ID: ${workItem.id}`);
      console.log(`   View at: ${workItem.url}`);

      return workItem;
    } catch (error: any) {
      console.error('❌ Error creating ADO work item:', error.message);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }

      throw new Error(`Failed to create ADO work item: ${error.message}`);
    }
  }

  /**
   * Build a formatted description with all form data
   */
  private buildDescription(formData: CMGFormData): string {
    const parts: string[] = [];

    // Add main description
    parts.push('<div>');
    parts.push('<h3>Description</h3>');
    parts.push(`<p>${this.escapeHtml(formData.description)}</p>`);
    parts.push('</div>');

    // Add Software Platforms
    if (formData.softwarePlatforms && formData.softwarePlatforms.length > 0) {
      parts.push('<div>');
      parts.push('<h3>Software Platforms</h3>');
      parts.push('<ul>');
      formData.softwarePlatforms.forEach(platform => {
        parts.push(`<li>${this.escapeHtml(platform)}</li>`);
      });
      parts.push('</ul>');
      parts.push('</div>');
    }

    // Add Impacted Areas
    if (formData.impactedAreas && formData.impactedAreas.length > 0) {
      parts.push('<div>');
      parts.push('<h3>Impacted Areas</h3>');
      parts.push('<ul>');
      formData.impactedAreas.forEach(area => {
        parts.push(`<li>${this.escapeHtml(area)}</li>`);
      });
      parts.push('</ul>');
      parts.push('</div>');
    }

    // Add Channels
    if (formData.channels && formData.channels.length > 0) {
      parts.push('<div>');
      parts.push('<h3>Channels</h3>');
      parts.push('<ul>');
      formData.channels.forEach(channel => {
        parts.push(`<li>${this.escapeHtml(channel)}</li>`);
      });
      parts.push('</ul>');
      parts.push('</div>');
    }

    // Add metadata footer
    parts.push('<div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc;">');
    parts.push('<p><em>Submitted via CMG Intake AI Assistant</em></p>');
    parts.push(`<p><em>Submission Date: ${new Date().toLocaleString()}</em></p>`);
    parts.push('</div>');

    return parts.join('\n');
  }

  /**
   * Build tags string from form data
   */
  private buildTags(formData: CMGFormData): string {
    const tags: string[] = ['CMG-Intake', 'AI-Submitted'];

    // Add first platform as a tag (if available)
    if (formData.softwarePlatforms && formData.softwarePlatforms.length > 0) {
      tags.push(formData.softwarePlatforms[0].replace(/\s+/g, '-'));
    }

    // Add first impacted area as a tag (if available)
    if (formData.impactedAreas && formData.impactedAreas.length > 0) {
      tags.push(formData.impactedAreas[0].replace(/\s+/g, '-'));
    }

    return tags.join('; ');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '\n': '<br>'
    };
    return text.replace(/[&<>"'\n]/g, m => map[m]);
  }

  /**
   * Test the connection to Azure DevOps
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/_apis/projects?api-version=7.1');
      console.log('✅ ADO connection test successful');
      return true;
    } catch (error: any) {
      console.error('❌ ADO connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Search for work items using WIQL (Work Item Query Language)
   * Can search across all projects or a specific project
   */
  async searchWorkItems(searchParams: {
    searchText?: string;
    workItemType?: string;
    state?: string;
    project?: string; // Optional: search specific project, or omit for all projects
    maxResults?: number;
  }): Promise<ADOWorkItem[]> {
    try {
      const { searchText, workItemType = 'User Story', state, project, maxResults = 50 } = searchParams;

      // Build WIQL query
      const conditions: string[] = [
        `[System.WorkItemType] = '${workItemType}'`
      ];

      // Add project filter only if specified (otherwise search all projects)
      if (project && project !== 'All Projects') {
        conditions.push(`[System.TeamProject] = '${project.replace(/'/g, "''")}'`);
      }

      if (searchText && searchText.trim().length > 0) {
        conditions.push(`[System.Title] CONTAINS '${searchText.replace(/'/g, "''")}'`);
      }

      if (state) {
        conditions.push(`[System.State] = '${state}'`);
      }

      const wiql = `
        SELECT [System.Id]
        FROM WorkItems
        WHERE ${conditions.join(' AND ')}
        ORDER BY [System.ChangedDate] DESC
      `;

      console.log('Executing WIQL query:', wiql);

      // For organization-wide queries, use the organization-level endpoint
      const queryUrl = project && project !== 'All Projects'
        ? '/_apis/wit/wiql?api-version=7.1'  // Project-scoped
        : `https://dev.azure.com/${this.config.organization}/_apis/wit/wiql?api-version=7.1`; // Org-wide

      // Execute WIQL query to get work item IDs
      const queryResponse = await axios.post(
        queryUrl,
        { query: wiql },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`:${this.config.personalAccessToken}`).toString('base64')}`
          }
        }
      );

      const workItemRefs = queryResponse.data.workItems || [];

      if (workItemRefs.length === 0) {
        console.log('No work items found matching the search criteria');
        return [];
      }

      // Limit results
      const limitedRefs = workItemRefs.slice(0, maxResults);
      const workItemIds = limitedRefs.map((ref: any) => ref.id);

      console.log(`Found ${workItemRefs.length} work items, fetching details for ${workItemIds.length}...`);

      // Fetch full work item details in batch (organization-wide)
      const workItems = await this.getWorkItemsByIds(workItemIds, true);

      console.log(`✅ Retrieved ${workItems.length} work items`);
      return workItems;
    } catch (error: any) {
      console.error('❌ Error searching work items:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Failed to search work items: ${error.message}`);
    }
  }

  /**
   * Get multiple work items by their IDs
   * @param ids - Array of work item IDs
   * @param useOrgLevel - If true, uses organization-level endpoint (for cross-project queries)
   */
  async getWorkItemsByIds(ids: number[], useOrgLevel: boolean = false): Promise<ADOWorkItem[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

      // ADO API supports batch retrieval with comma-separated IDs
      const idsParam = ids.join(',');
      const fieldsParam = [
        'System.Id',
        'System.Title',
        'System.Description',
        'System.State',
        'System.WorkItemType',
        'System.TeamProject',  // Include project name
        'System.CreatedDate',
        'System.ChangedDate',
        'System.Tags',
        'System.AreaPath',
        'System.IterationPath'
      ].join(',');

      // Use organization-level endpoint for cross-project queries
      const baseUrl = useOrgLevel
        ? `https://dev.azure.com/${this.config.organization}`
        : this.baseUrl;

      const response = await axios.get(
        `${baseUrl}/_apis/wit/workitems?ids=${idsParam}&fields=${fieldsParam}&api-version=7.1`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`:${this.config.personalAccessToken}`).toString('base64')}`
          }
        }
      );

      return response.data.value || [];
    } catch (error: any) {
      console.error('❌ Error fetching work items by IDs:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Failed to fetch work items: ${error.message}`);
    }
  }

  /**
   * Get a single work item by ID with full details
   */
  async getWorkItemById(id: number): Promise<ADOWorkItem> {
    try {
      const response = await this.client.get(
        `/_apis/wit/workitems/${id}?$expand=all&api-version=7.1`
      );

      console.log(`✅ Retrieved work item ${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching work item ${id}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Failed to fetch work item ${id}: ${error.message}`);
    }
  }
}
