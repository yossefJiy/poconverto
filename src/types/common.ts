// Common types used across all domains

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'archived';

export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface BaseEntity extends AuditFields {
  id: string;
}
