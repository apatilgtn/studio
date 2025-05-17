
'use server';
/**
 * @fileOverview API Documentation Generation AI agent.
 *
 * - generateApiDocumentation - A function that handles the API documentation generation process.
 * - GenerateApiDocumentationInput - The input type for the generateApiDocumentation function (imported).
 * - GenerateApiDocumentationOutput - The return type for the generateApiDocumentation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { GenerateApiDocumentationInputSchema, type GenerateApiDocumentationInput, GenerateApiDocumentationOutputSchema, type GenerateApiDocumentationOutput } from '@/ai/schemas/api-documentation-schemas';

// GenerateApiDocumentationInputSchema and GenerateApiDocumentationInput type are now imported.
// GenerateApiDocumentationOutputSchema and GenerateApiDocumentationOutput type are now imported.

export async function generateApiDocumentation(input: GenerateApiDocumentationInput): Promise<GenerateApiDocumentationOutput> {
  return generateApiDocumentationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateApiDocumentationPrompt',
  input: {schema: GenerateApiDocumentationInputSchema},
  output: {schema: GenerateApiDocumentationOutputSchema},
  prompt: `You are an expert API designer tasked with generating OpenAPI 3.0.x specifications.
Based on the following description (and optional partial specification, and optional source code content from uploaded files), generate one or more OpenAPI 3.0.x specifications in YAML format.

If the provided description or source code snippets clearly suggest multiple distinct APIs or microservices (e.g., a 'User Service' and a 'Product Service'), attempt to generate a separate OpenAPI 3.0.x specification in YAML for each. Provide each spec with a descriptive \`apiName\` (e.g., "User Service API", "Product Catalog API"). Each generated spec should be an entry in the \`generatedSpecs\` array.

If only one API is apparent from the input, generate a single entry in the \`generatedSpecs\` array, using a suitable \`apiName\` (e.g., derived from the description or "Main API").

For each API identified:
- Identify potential endpoints, request/response schemas (including data types like string, integer, boolean, object, array), and appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH).
- Ensure the generated specification is well-structured and follows OpenAPI best practices.
- Include basic request and response examples where appropriate.

Provide an overall \`confidenceScore\` from 0.0 to 1.0 on the quality and completeness of the generated spec(s) based on the input.
Also, provide an array of \`suggestionsForImprovement\` for how the user could improve their input description to get even better specification(s), or areas where the generated spec(s) might need further refinement.

Description:
{{{description}}}

{{#if partialSpec}}
Partial Specification (to be completed or enhanced, assumed to be for one of the APIs if multiple are described):
\`\`\`
{{{partialSpec}}}
\`\`\`
{{/if}}

{{#if sourceCodeSnippets}}
Source Code Content (analyze these for API structure, endpoints, data models. This content may be from one or more uploaded files concatenated together. Try to discern if different parts of the code map to different APIs):
\`\`\`
{{{sourceCodeSnippets}}}
\`\`\`
{{/if}}

Focus on creating functional and comprehensive specification(s). If the input is vague, make reasonable assumptions but note them in the suggestions.
The output YAML for each spec should be directly usable.
The \`generatedSpecs\` field in the output must be an array, even if only one API spec is generated.
`,
});

const generateApiDocumentationFlow = ai.defineFlow(
  {
    name: 'generateApiDocumentationFlow',
    inputSchema: GenerateApiDocumentationInputSchema,
    outputSchema: GenerateApiDocumentationOutputSchema,
  },
  async (input: GenerateApiDocumentationInput) => {
    const {output} = await prompt(input);
    // Ensure output and output.generatedSpecs are not null/undefined before returning
    if (!output || !output.generatedSpecs) {
        // Fallback or error handling if AI returns unexpected structure
        console.error("AI did not return the expected generatedSpecs structure.");
        return {
            generatedSpecs: [{ apiName: "Error API", openApiSpecYaml: "Error: AI failed to generate specification." }],
            confidenceScore: 0,
            suggestionsForImprovement: ["The AI model did not produce a valid output. Please check your input or try again."]
        };
    }
    return output;
  }
);
