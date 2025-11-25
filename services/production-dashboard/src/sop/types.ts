/**
 * SOP (Standard Operating Procedure) Types
 */

export type SOPCategory = 'Machines' | 'Processes' | 'Troubleshooting' | 'Safety';
export type SOPDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type MediaType = 'image' | 'video' | 'pdf';

export interface SOPStep {
  order: number;
  title: string;
  content: string;
  images: string[];
  videos: string[];
  warnings: string[];
  tips: string[];
}

export interface Media {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  caption?: string;
}

export interface SOP {
  id: string;
  title: string;
  slug: string;
  category: SOPCategory;
  subcategory?: string;
  tags: string[];
  summary: string;
  content: string;
  steps: SOPStep[];
  relatedSOPs: string[];
  machineId?: string;
  difficulty: SOPDifficulty;
  estimatedTime: number;
  version: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
  viewCount: number;
  lastViewed?: Date;
  isPublished: boolean;
  media: Media[];
  favorites?: string[];
}

export interface SOPCreateInput {
  title: string;
  category: SOPCategory;
  subcategory?: string;
  tags?: string[];
  summary: string;
  content: string;
  steps?: SOPStep[];
  relatedSOPs?: string[];
  machineId?: string;
  difficulty?: SOPDifficulty;
  estimatedTime?: number;
  media?: Media[];
  isPublished?: boolean;
}

export interface SOPUpdateInput {
  title?: string;
  category?: SOPCategory;
  subcategory?: string;
  tags?: string[];
  summary?: string;
  content?: string;
  steps?: SOPStep[];
  relatedSOPs?: string[];
  machineId?: string;
  difficulty?: SOPDifficulty;
  estimatedTime?: number;
  media?: Media[];
  isPublished?: boolean;
}

export interface SOPSearchQuery {
  q?: string;
  category?: SOPCategory;
  difficulty?: SOPDifficulty;
  tags?: string[];
  machineId?: string;
  limit?: number;
  offset?: number;
}

export interface SOPSearchResult {
  sops: SOP[];
  total: number;
  limit: number;
  offset: number;
}

export interface SOPAnalytics {
  mostViewed: Array<{ sop: SOP; views: number }>;
  leastViewed: Array<{ sop: SOP; views: number }>;
  totalSOPs: number;
  searchTerms?: Array<{ term: string; count: number }>;
}
