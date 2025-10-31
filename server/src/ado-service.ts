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

      console.log(`Uploading attachment: ${fileName}`);

      const response = await axios.post(
        `https://dev.azure.com/${this.config.organization}/_apis/wit/attachments?fileName=${encodeURIComponent(fileName)}&api-version=7.1`,
        fileContent,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': `Basic ${Buffer.from(`:${this.config.personalAccessToken}`).toString('base64')}`
          }
        }
      );

      console.log(`✅ Attachment uploaded: ${fileName}`);
      return response.data.url;
    } catch (error: any) {
      console.error(`❌ Error uploading attachment ${filePath}:`, error.message);
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
      const patchDocument = [
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

        for (const filePath of attachmentPaths) {
          try {
            const attachmentUrl = await this.uploadAttachment(filePath);

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
          } catch (error) {
            console.error(`Failed to upload attachment ${filePath}, continuing...`);
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
}
