
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { GenerateApiDocumentationInputSchema, type GenerateApiDocumentationInput } from "@/ai/schemas/api-documentation-schemas";
import { generateApiDocumentation, type GenerateApiDocumentationOutput } from "@/ai/flows/api-documentation-generation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Added Input import
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Form schema for the client-side form, including file handling
const GenerateDocumentationClientFormSchema = GenerateApiDocumentationInputSchema.extend({
  sourceCodeFiles: z.custom<FileList>().optional(), // For file input
}).omit({ sourceCodeSnippets: true }); // Remove the old snippets field from form schema

type GenerateDocumentationClientFormValues = z.infer<typeof GenerateDocumentationClientFormSchema>;

export function GenerateDocumentationView() {
  const [generationResult, setGenerationResult] = useState<GenerateApiDocumentationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<GenerateDocumentationClientFormValues>({
    resolver: zodResolver(GenerateDocumentationClientFormSchema),
    defaultValues: {
      description: "",
      partialSpec: "",
      sourceCodeFiles: undefined,
    },
  });

  const onSubmit = async (data: GenerateDocumentationClientFormValues) => {
    setIsLoading(true);
    setError(null);
    setGenerationResult(null);

    let sourceCodeText = "";
    if (data.sourceCodeFiles && data.sourceCodeFiles.length > 0) {
      try {
        const fileContents = await Promise.all(
          Array.from(data.sourceCodeFiles).map(file => file.text())
        );
        sourceCodeText = fileContents.join("\n\n---\n\n"); // Concatenate file contents
      } catch (e) {
        console.error("Error reading file(s):", e);
        setError("Could not read the uploaded source code file(s).");
        setIsLoading(false);
        toast({ title: "File Read Error", description: "Failed to read the content of uploaded files.", variant: "destructive" });
        return;
      }
    }

    const aiInput: GenerateApiDocumentationInput = {
      description: data.description,
      partialSpec: data.partialSpec,
      sourceCodeSnippets: sourceCodeText, // Pass concatenated text to AI
    };

    try {
      const result = await generateApiDocumentation(aiInput);
      setGenerationResult(result);
      toast({
        title: "Documentation Generation Complete",
        description: "OpenAPI specification has been generated.",
      });
    } catch (err: any) {
      console.error("Documentation generation error:", err);
      const errorMessage = err.message || "An unexpected error occurred during documentation generation.";
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icons.FilePlus2 className="w-6 h-6 text-primary" /> AI-Powered API Documentation Generator
          </CardTitle>
          <CardDescription>
            Provide a natural language description of your API, a partial OpenAPI spec, and/or upload relevant source code files (e.g., route definitions, controllers, data models). The AI will attempt to generate a full OpenAPI 3.0.x specification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your API's purpose, main resources, common operations (e.g., CRUD for users), and any key data structures involved. The more detail, the better the result."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This is the primary input for the AI to understand your API. Minimum 50 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="partialSpec"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partial OpenAPI Specification (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste any existing OpenAPI YAML or JSON content here. The AI will try to complete or enhance it."
                        className="min-h-[100px] font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a starting point if you have one.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sourceCodeFiles"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                  <FormItem>
                    <FormLabel>Upload Source Code Files (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple // Allow multiple files
                        accept=".js,.ts,.py,.java,.cs,.go,.rb,.php,text/plain,.txt" // Common code extensions
                        onChange={(e) => onChange(e.target.files)}
                        onBlur={onBlur}
                        name={name}
                        ref={ref}
                        className="pt-2"
                      />
                    </FormControl>
                    <FormDescription>
                      Upload relevant source code files (e.g., route definitions, controllers, data models). The AI will analyze their content. This is not full repository analysis.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} size="lg" className="w-full">
                {isLoading ? (
                  <Icons.Loader className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Icons.Zap className="mr-2 h-5 w-5" />
                )}
                Generate API Specification
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Generating Specification...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The AI is working on generating the OpenAPI specification. This may take a few moments.</p>
            <Progress value={isLoading ? undefined : 100} className="mt-4" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <Icons.AlertTriangle className="h-4 w-4" />
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generationResult && !isLoading && !error && (
        <Card className="mt-6 shadow-xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icons.FileOutput className="w-7 h-7 text-primary" /> Generated OpenAPI Specification
            </CardTitle>
            <CardDescription>
              AI Confidence Score: <Badge variant={generationResult.confidenceScore > 0.7 ? "default" : generationResult.confidenceScore > 0.4 ? "secondary" : "destructive"}>
                {(generationResult.confidenceScore * 100).toFixed(0)}%
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {generationResult.suggestionsForImprovement && generationResult.suggestionsForImprovement.length > 0 && (
              <div>
                <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                  <Icons.Settings className="w-4 h-4 text-accent" /> Suggestions for Improvement:
                </h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground">
                  {generationResult.suggestionsForImprovement.map((suggestion, index) => (
                    <li key={`suggestion-${index}`}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="text-md font-semibold mb-2">Generated YAML:</h3>
              <ScrollArea className="h-[500px] rounded-md border p-4 bg-muted/30">
                <pre className="text-xs font-mono">{generationResult.generatedSpec}</pre>
              </ScrollArea>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(generationResult.generatedSpec);
                  toast({ title: "Copied to clipboard!" });
                }}
              >
                <Icons.FileText className="mr-2 h-4 w-4" /> Copy YAML
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
