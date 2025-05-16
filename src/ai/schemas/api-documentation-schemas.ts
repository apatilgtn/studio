import { z } from 'zod';

export const GenerateApiDocumentationInputSchema = z.object({
  description: z
    .string()
    .min(50, { message: "Description must be at least 50 characters long."})
    .describe('A natural language description of the API, its purpose, and its intended endpoints/functionality.'),
  partialSpec: z
    .string()
    .optional()
    .describe('An optional partial OpenAPI specification (YAML or JSON string) to be completed or enhanced.'),
  sourceCodeSnippets: z
    .string()
    .optional()
    .describe('Optional source code snippets (e.g., route definitions, controller methods, data models) to help the AI understand the API structure.'),
});
export type GenerateApiDocumentationInput = z.infer<typeof GenerateApiDocumentationInputSchema>;
