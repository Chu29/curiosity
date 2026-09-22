// Shared TypeScript types for Science & Technology Learning Platform

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: Date | string;
  updatedAt: Date | string;
}
