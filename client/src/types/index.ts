export type User = { id: string; name: string; email: string; avatar?: string; role: "user" | "admin"; preferences?: Record<string, unknown> };
export type Tool = { _id: string; title: string; slug: string; shortDescription: string; fullDescription: string; category: string; toolType: string; price: number; priority: string; imageUrl: string; galleryImages: string[]; features: string[]; rating: number; reviewCount: number; tags: string[]; usageCount: number; isPublished: boolean; createdAt: string };
export type Pagination = { page: number; limit: number; total: number; pages: number };
export type ApiResponse<T> = { success: boolean; message: string; data: T; error?: unknown };
export type Conversation = { _id: string; title: string; updatedAt: string };
export type Message = { _id: string; role: "user" | "assistant"; content: string; createdAt: string };
