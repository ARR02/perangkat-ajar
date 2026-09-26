import { DocumentStatus, DocumentType, IdentityContext } from "./index";

export interface DocumentMeta {
  id: string;
  projectId: string;
  type: DocumentType;
  version: number;
  status: DocumentStatus;
  parentId?: string;
  needsReview: boolean;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentIR<T = Record<string, unknown>> {
  meta: DocumentMeta;
  identity: IdentityContext;
  content: T;
}
