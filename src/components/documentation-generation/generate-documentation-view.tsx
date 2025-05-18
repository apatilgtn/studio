
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { type GenerateApiDocumentationOutput, type GenerateApiDocumentationInput, GeneratedApiSpecSchema } from "@/ai/schemas/api-documentation-schemas"; 
import { generateApiDocumentation } from "@/ai/flows/api-documentation-generation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Form schema for the client-side form, including file handling
const GenerateDocumentationClientFormSchema = z.object({
  description: z.string(), // Min length removed as per user request
  partialSpec: z.string().optional(),
  sourceCodeFiles: z.custom<FileList>().optional(), // For file input
});

type GenerateDocumentationClientFormValues = z.infer<typeof GenerateDocumentationClientFormSchema>;

export function GenerateDocumentationView() {
  const [generationResult, setGenerationResult] = useState<GenerateApiDocumentationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const form = useForm<GenerateDocumentationClientFormValues>({
    resolver: zodResolver(GenerateDocumentationClientFormSchema),
    defaultValues: {
      description: "",
      partialSpec: "",
      sourceCodeFiles: undefined,
    },
  });

  useEffect(() => {
    const apiName = searchParams.get('apiName');
    const endpoint = searchParams.get('endpoint');
    const method = searchParams.get('method');

    if (apiName && endpoint && method) {
      const prefillText = `The following API, named "${decodeURIComponent(apiName)}", was discovered and is currently undocumented:
- Method: ${decodeURIComponent(method)}
- Endpoint: ${decodeURIComponent(endpoint)}

Please describe its purpose, main resources, expected request/response structures, and any key data models involved to help generate its OpenAPI specification.
For example:
- What does this API do?
- What data does it accept?
- What data does it return?
- Are there any specific data types or formats to be aware of?
`;
      form.setValue('description', prefillText);
      toast({
        title: "Context Pre-filled",
        description: `Description started for API: ${decodeURIComponent(apiName)}. Please elaborate.`,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, form.setValue, toast]); 

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
        sourceCodeText = fileContents.join("\n\n---\n\n"); 
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
      sourceCodeSnippets: sourceCodeText,
    };

    try {
      const result = await generateApiDocumentation(aiInput);
      setGenerationResult(result);
      toast({
        title: "Documentation Generation Complete",
        description: `AI has generated ${result.generatedSpecs?.length || 0} specification(s).`,
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
    <div className="container mx-auto space-y-4 md:space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
            <Icons.FilePlus2 className="w-5 h-5 md:w-6 md:h-6 text-primary" /> AI-Powered API Documentation Generator
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
             Describe your API and, optionally, provide a partial OpenAPI spec or upload relevant source code files. 
             The AI will analyze these inputs to generate one or more OpenAPI 3.0.x specifications in YAML format.
             If multiple distinct APIs are described or implied by the code, it will attempt to create separate specifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs md:text-sm">API Description(s)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your API's purpose, resources, operations (e.g., CRUD for users), and key data structures. If describing multiple APIs, clearly delineate them."
                        className="min-h-[120px] md:min-h-[150px] text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription className="text-xs">
                        This description is the primary input for the AI. Be as detailed as possible.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <Tabs defaultValue="partial-spec" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="partial-spec">Enhance with Partial Spec</TabsTrigger>
                  <TabsTrigger value="from-code">Generate from Code Files</TabsTrigger>
                </TabsList>
                <TabsContent value="partial-spec" className="mt-4">
                  <FormField
                    control={form.control}
                    name="partialSpec"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Partial OpenAPI Specification (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste existing OpenAPI YAML or JSON content here. For multiple APIs, this might be for one of them."
                            className="min-h-[80px] md:min-h-[100px] font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Provide a starting point if available. The AI will attempt to complete or enhance it.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="from-code" className="mt-4">
                  <FormField
                    control={form.control}
                    name="sourceCodeFiles"
                    render={({ field: { onChange, onBlur, name, ref } }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Upload Source Code Files (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            multiple 
                            accept=".js,.ts,.py,.java,.cs,.go,.rb,.php,text/plain,.txt,.mjs,.cjs,.jsx,.tsx,.json,.yaml,.yml,.md"
                            onChange={(e) => onChange(e.target.files)}
                            onBlur={onBlur}
                            name={name}
                            ref={ref}
                            className="pt-1.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 text-xs"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Upload relevant files (routes, controllers, models). If files represent multiple APIs, AI will try to create separate specs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <Button type="submit" disabled={isLoading} size="lg" className="w-full mt-6">
                {isLoading ? (
                  <Icons.Loader className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                ) : (
                  <Icons.Zap className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                )}
                Generate API Specification(s)
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-4 md:mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Icons.Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin text-primary" /> Generating Specification(s)...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs md:text-sm text-muted-foreground">The AI is working. This may take a few moments.</p>
            <Progress value={isLoading ? undefined : 100} className="mt-3 md:mt-4" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4 md:mt-6">
          <Icons.AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm md:text-base">Generation Error</AlertTitle>
          <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {generationResult && !isLoading && !error && (
        <Card className="mt-4 md:mt-6 shadow-xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
              <Icons.FileOutput className="w-6 h-6 md:w-7 md:h-7 text-primary" /> Generated OpenAPI Specification(s)
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              AI Confidence Score (Overall): <Badge variant={generationResult.confidenceScore > 0.7 ? "default" : generationResult.confidenceScore > 0.4 ? "secondary" : "destructive"} className="text-xs">
                {(generationResult.confidenceScore * 100).toFixed(0)}%
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-4">
            {generationResult.suggestionsForImprovement && generationResult.suggestionsForImprovement.length > 0 && (
              <div>
                <h3 className="text-sm md:text-base font-semibold mb-1.5 flex items-center gap-2">
                  <Icons.Lightbulb className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" /> Overall Suggestions for Improvement:
                </h3>
                <ul className="list-disc list-inside pl-3 md:pl-4 space-y-1 text-xs md:text-sm text-muted-foreground">
                  {generationResult.suggestionsForImprovement.map((suggestion, index) => (
                    <li key={`suggestion-${index}`}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {generationResult.generatedSpecs && generationResult.generatedSpecs.length > 0 ? (
              <Accordion type="multiple" defaultValue={generationResult.generatedSpecs.length === 1 ? [generationResult.generatedSpecs[0].apiName] : []} className="w-full space-y-1.5 md:space-y-2">
                {generationResult.generatedSpecs.map((specItem, index) => (
                  <AccordionItem value={specItem.apiName || `spec-${index}`} key={specItem.apiName || `spec-${index}`} className="border rounded-md shadow-sm">
                     <AccordionTrigger className="px-3 py-2.5 md:px-4 md:py-3 hover:bg-muted/50 rounded-t-md">
                        <div className="flex items-center gap-1.5 md:gap-2">
                           <Icons.FileJson className="w-4 h-4 md:w-5 md:w-5 text-accent" />
                           <span className="font-semibold text-xs md:text-sm">{specItem.apiName || `Generated API ${index + 1}`}</span>
                        </div>
                     </AccordionTrigger>
                     <AccordionContent className="p-3 md:p-4 bg-background rounded-b-md">
                        <ScrollArea className="h-[300px] md:h-[400px] rounded-md border p-2.5 md:p-3 bg-muted/30">
                          <pre className="text-xs font-mono">{specItem.openApiSpecYaml}</pre>
                        </ScrollArea>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(specItem.openApiSpecYaml);
                            toast({ title: "Copied to clipboard!", description: `${specItem.apiName || 'Generated API'} YAML copied.` });
                          }}
                        >
                          <Icons.Copy className="mr-1.5 h-3.5 w-3.5" /> Copy YAML for {specItem.apiName || `API ${index + 1}`}
                        </Button>
                     </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
               <Alert>
                  <Icons.Info className="h-4 w-4" />
                  <AlertTitle className="text-sm md:text-base">No Specifications Generated</AlertTitle>
                  <AlertDescription className="text-xs md:text-sm">The AI did not produce any API specifications based on the input.</AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    