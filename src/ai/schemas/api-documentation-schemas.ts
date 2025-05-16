
import { z } from 'zod';

export const GenerateApiDocumentationInputSchema = z.object({
  description: z
    .string()
    // .min(50, { message: "Description must be at least 50 characters long."}) // Minimum length constraint removed
    .describe('A natural language description of the API(s), its purpose, and its intended endpoints/functionality.'),
  partialSpec: z
    .string()
    .optional()
    .describe('An optional partial OpenAPI specification (YAML or JSON string) to be completed or enhanced, relevant to one of the APIs if multiple are described.'),
  sourceCodeSnippets: z
    .string()
    .optional()
    .describe('Optional source code content from uploaded files (e.g., route definitions, controller methods, data models) to help the AI understand the API structure(s). This may come from one or more files concatenated together.'),
});
export type GenerateApiDocumentationInput = z.infer<typeof GenerateApiDocumentationInputSchema>;

export const GeneratedApiSpecSchema = z.object({
  apiName: z.string().describe("A descriptive name for the identified API (e.g., 'User Service API', 'Product Catalog API')."),
  openApiSpecYaml: z.string().describe("The generated OpenAPI 3.0.x specification in YAML format for this specific API.")
});
export type GeneratedApiSpec = z.infer<typeof GeneratedApiSpecSchema>;


export const GenerateApiDocumentationOutputSchema = z.object({
  generatedSpecs: z
    .array(GeneratedApiSpecSchema)
    .describe('An array of generated OpenAPI specifications. If multiple distinct APIs were inferred from the input, multiple entries will be present. Otherwise, a single entry for the described API.'),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('A confidence score (0.0 to 1.0) indicating the AI\'s overall confidence in the quality and completeness of the generated specification(s) based on the input.'),
  suggestionsForImprovement: z.array(z.string()).optional().describe("Overall suggestions to further improve the API description or the generated spec(s)."),
});
export type GenerateApiDocumentationOutput = z.infer<typeof GenerateApiDocumentationOutputSchema>;
