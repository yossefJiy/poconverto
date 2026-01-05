// Content Studio API

import { BaseAPI } from './base';

export interface MediaItem {
  id: string;
  client_id: string;
  name: string;
  file_type: string;
  file_size: number | null;
  file_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  folder: string;
  tags: string[];
  metadata: Record<string, unknown>;
  uploaded_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentDraft {
  id: string;
  client_id: string;
  title: string;
  content: string | null;
  content_type: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  platforms: string[];
  media_ids: string[];
  scheduled_for: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIContentHistory {
  id: string;
  client_id: string;
  prompt: string;
  generated_content: string;
  content_type: string;
  model_used: string | null;
  rating: number | null;
  used_in_draft_id: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface BrandAsset {
  id: string;
  client_id: string;
  asset_type: 'color' | 'font' | 'logo' | 'tone' | 'keyword';
  name: string;
  value: string;
  description: string | null;
  is_primary: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UploadMediaInput {
  client_id: string;
  name: string;
  file_type: string;
  file_url: string;
  file_size?: number;
  thumbnail_url?: string;
  alt_text?: string;
  folder?: string;
  tags?: string[];
}

export interface CreateDraftInput {
  client_id: string;
  title: string;
  content?: string;
  content_type?: string;
  platforms?: string[];
  media_ids?: string[];
  scheduled_for?: string;
}

export class ContentAPI extends BaseAPI {
  // Media Library
  async listMedia(clientId: string, folder?: string) {
    return this.request<MediaItem[]>(async () => {
      let query = this.client
        .from('media_library')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (folder) {
        query = query.eq('folder', folder);
      }
      
      return query;
    });
  }

  async uploadMedia(data: UploadMediaInput) {
    return this.request<MediaItem>(async () => {
      return this.client
        .from('media_library')
        .insert({
          client_id: data.client_id,
          name: data.name,
          file_type: data.file_type,
          file_url: data.file_url,
          file_size: data.file_size ?? null,
          thumbnail_url: data.thumbnail_url ?? null,
          alt_text: data.alt_text ?? null,
          folder: data.folder ?? 'general',
          tags: data.tags ?? [],
        })
        .select()
        .single();
    });
  }

  async updateMedia(id: string, data: Partial<MediaItem>) {
    return this.request<MediaItem>(async () => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.alt_text !== undefined) updateData.alt_text = data.alt_text;
      if (data.folder !== undefined) updateData.folder = data.folder;
      if (data.tags !== undefined) updateData.tags = data.tags;
      
      return this.client
        .from('media_library')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteMedia(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('media_library')
        .update({ is_active: false })
        .eq('id', id);
    });
  }

  async getFolders(clientId: string) {
    const { data } = await this.client
      .from('media_library')
      .select('folder')
      .eq('client_id', clientId)
      .eq('is_active', true);
    
    const folders = new Set<string>(['general']);
    for (const item of data || []) {
      if (item.folder) folders.add(item.folder);
    }
    
    return { data: Array.from(folders), error: null, success: true };
  }

  // Content Drafts
  async listDrafts(clientId: string, status?: string) {
    return this.request<ContentDraft[]>(async () => {
      let query = this.client
        .from('content_drafts')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      return query;
    });
  }

  async getDraft(id: string) {
    return this.request<ContentDraft>(async () => {
      return this.client
        .from('content_drafts')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async createDraft(data: CreateDraftInput) {
    return this.request<ContentDraft>(async () => {
      return this.client
        .from('content_drafts')
        .insert({
          client_id: data.client_id,
          title: data.title,
          content: data.content ?? null,
          content_type: data.content_type ?? 'post',
          platforms: data.platforms ?? [],
          media_ids: data.media_ids ?? [],
          scheduled_for: data.scheduled_for ?? null,
        })
        .select()
        .single();
    });
  }

  async updateDraft(id: string, data: Partial<ContentDraft>) {
    return this.request<ContentDraft>(async () => {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.platforms !== undefined) updateData.platforms = data.platforms;
      if (data.media_ids !== undefined) updateData.media_ids = data.media_ids;
      if (data.scheduled_for !== undefined) updateData.scheduled_for = data.scheduled_for;
      
      return this.client
        .from('content_drafts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteDraft(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('content_drafts')
        .delete()
        .eq('id', id);
    });
  }

  // AI Content History
  async listAIHistory(clientId: string, limit = 50) {
    return this.request<AIContentHistory[]>(async () => {
      return this.client
        .from('ai_content_history')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
    });
  }

  async saveAIContent(clientId: string, prompt: string, content: string, contentType: string, model?: string) {
    return this.request<AIContentHistory>(async () => {
      return this.client
        .from('ai_content_history')
        .insert({
          client_id: clientId,
          prompt,
          generated_content: content,
          content_type: contentType,
          model_used: model ?? null,
        })
        .select()
        .single();
    });
  }

  async rateAIContent(id: string, rating: number) {
    return this.request<AIContentHistory>(async () => {
      return this.client
        .from('ai_content_history')
        .update({ rating })
        .eq('id', id)
        .select()
        .single();
    });
  }

  // Brand Assets
  async listBrandAssets(clientId: string, assetType?: string) {
    return this.request<BrandAsset[]>(async () => {
      let query = this.client
        .from('brand_assets')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order', { ascending: true });
      
      if (assetType) {
        query = query.eq('asset_type', assetType);
      }
      
      return query;
    });
  }

  async createBrandAsset(clientId: string, assetType: string, name: string, value: string, description?: string) {
    return this.request<BrandAsset>(async () => {
      return this.client
        .from('brand_assets')
        .insert({
          client_id: clientId,
          asset_type: assetType,
          name,
          value,
          description: description ?? null,
        })
        .select()
        .single();
    });
  }

  async updateBrandAsset(id: string, data: Partial<BrandAsset>) {
    return this.request<BrandAsset>(async () => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.value !== undefined) updateData.value = data.value;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.is_primary !== undefined) updateData.is_primary = data.is_primary;
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
      
      return this.client
        .from('brand_assets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteBrandAsset(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('brand_assets')
        .delete()
        .eq('id', id);
    });
  }
}

export const contentAPI = new ContentAPI();
