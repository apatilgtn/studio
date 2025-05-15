
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from 'js-yaml';
import type { OpenAPI } from 'openapi-types';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOpenApiStore } from "@/stores/openapi-store";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    url: z.string().url({ message: "Please enter a valid URL." }),
  }),
  z.object({
    type: z.literal("file"),
    file: z.custom<FileList>((val) => typeof window !== 'undefined' ? val instanceof FileList : true, "Invalid file input.")
      .refine((val) => typeof window !== 'undefined' ? val?.length === 1 : true, "Please upload exactly one file.")
      .refine((val) => typeof window !== 'undefined' ? val?.[0] instanceof File : true, "Uploaded item must be a file."),
  }),
]);

type FormValues = z.infer<typeof formSchema>;

export function OpenApiUploadForm({ onSpecLoaded }: { onSpecLoaded?: (name: string) => void }) {
  const { setSpec, setError, setLoading, isLoading, fileName: currentFileName } =
    useOpenApiStore();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "url", url: "" },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    setError(null);
    let specObject: OpenAPI.Document;
    let rawSpecText: string;
    let inputFileName: string;
    let wasVersionOverridden = false;

    if (typeof window === 'undefined' && data.type === 'file') {
      setError("File upload can only be performed in the browser.");
      setLoading(false);
      toast({title: "Error", description: "Cannot process file uploads on the server.", variant: "destructive"});
      return;
    }

    try {
      if (data.type === "url") {
        const response = await fetch('/api/fetch-spec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: data.url }),
        });
        
        const responseBodyText = await response.text(); 

        if (!response.ok) {
          let descriptiveError = `Error fetching spec via proxy: ${response.status} ${response.statusText}`;
          try {
            const errorJson = JSON.parse(responseBodyText);
            if (errorJson && errorJson.error) {
               descriptiveError = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
            } else if (errorJson && errorJson.message) { // For other backend errors that might use .message
               descriptiveError = typeof errorJson.message === 'string' ? errorJson.message : JSON.stringify(errorJson.message);
            } else {
              // Fallback if parsing or structure is unexpected but status suggests an error
              descriptiveError = `Proxy API returned status ${response.status} but error message is unclear. Raw response: ${responseBodyText.substring(0, 150)}...`;
            }
          } catch (e) {
            // If responseBodyText itself is not JSON (e.g., HTML error page from external server)
            descriptiveError = `Failed to fetch spec. External server returned status ${response.status} ${response.statusText} with non-JSON content. Preview: ${responseBodyText.substring(0, 150)}...`;
          }
          throw new Error(descriptiveError);
        }
        
        const result = JSON.parse(responseBodyText); // responseBodyText is now guaranteed to be JSON if response.ok
        
        if (result.error) { // Should not happen if response.ok, but as a safeguard from proxy logic
            throw new Error(result.error);
        }
        
        specObject = result.specObject as OpenAPI.Document;
        rawSpecText = result.rawSpecText;
        wasVersionOverridden = result.versionOverridden || false;
        inputFileName = data.url.substring(data.url.lastIndexOf('/') + 1) || "openapi-spec-from-url";

      } else { // type === "file"
        const file = data.file![0]; 
        inputFileName = file.name;
        const fileContentText = await file.text();
        
        let parsedContentForFile: any; 
        if (inputFileName.endsWith(".yaml") || inputFileName.endsWith(".yml")) {
          parsedContentForFile = YAML.load(fileContentText);
        } else { 
          parsedContentForFile = JSON.parse(fileContentText);
        }
        
        const originalVersionFromFile = parsedContentForFile.openapi;

        // Attempt to override version if it's an unsupported 3.0.x patch
        if (parsedContentForFile.openapi && typeof parsedContentForFile.openapi === 'string' && 
            parsedContentForFile.openapi.startsWith('3.0.') && parsedContentForFile.openapi > '3.0.3') {
            console.warn(`Attempting to override OpenAPI version from ${originalVersionFromFile} to 3.0.3 for file upload.`);
            parsedContentForFile.openapi = '3.0.3';
            wasVersionOverridden = true;
        }

        try {
          const specToBundle = JSON.parse(JSON.stringify(parsedContentForFile));
          specObject = (await SwaggerParser.bundle(specToBundle)) as OpenAPI.Document;
        } catch (bundleError: any) {
            // If bundling fails after potential override, or if it wasn't an overridable version issue
            if (wasVersionOverridden) {
                 throw new Error(`Failed to bundle after overriding file version from ${originalVersionFromFile} to 3.0.3: ${bundleError.message}`);
            }
            throw bundleError; // Re-throw original error
        }
        rawSpecText = YAML.dump(specObject); 

        if (wasVersionOverridden) {
          toast({
            title: "Version Override (File)",
            description: `OpenAPI version ${originalVersionFromFile} in your file was changed to 3.0.3 for compatibility. Full parsing not guaranteed.`,
            variant: "default", 
            duration: 8000,
          });
        }
      }
      
      setSpec({
        specObject,
        rawSpecText,
        name: inputFileName,
        id: `temp-${Date.now()}`, 
      });

      if (wasVersionOverridden && data.type === 'url') {
         toast({
            title: "Success & Version Override (URL)",
            description: `OpenAPI spec "${inputFileName}" loaded. Its original version was changed to 3.0.3 for compatibility. Full parsing not guaranteed.`,
            variant: "default",
            duration: 8000,
          });
      } else if (!wasVersionOverridden) { // Only show simple success if no override happened (or file override already toasted)
         toast({
            title: "Success",
            description: `OpenAPI spec "${inputFileName}" loaded and validated.`,
            variant: "default",
          });
      }
      
      if (onSpecLoaded) {
        onSpecLoaded(inputFileName);
      }
      form.reset({type: data.type, url: data.type === 'url' ? "" : undefined, file: undefined});

    } catch (err: any) {
      console.error("Error processing OpenAPI spec:", err);
      const errorMessage = err.message || "Failed to parse or validate OpenAPI specification.";
      setError(errorMessage); 
      toast({
        title: "Error Processing Specification",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  const exampleSpecs = [
    {name: "Swagger Petstore (v2 JSON)", url: "https://petstore.swagger.io/v2/swagger.json"},
    // The Gitea link often causes issues due to version or structure, let's use a more standard v3 example.
    {name: "OpenAPI Petstore (v3 YAML)", url: "https://petstore3.swagger.io/api/v3/openapi.yaml"}, 
    {name: "Zoom API (v2 JSON)", url: "https://marketplace.zoom.us/docs/api-reference/zoom-api/oas-api.json"} 
  ];


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Icons.UploadCloud className="w-6 h-6 text-primary" />
          Import OpenAPI Specification
        </CardTitle>
        <CardDescription>
          Upload a file (JSON/YAML) or provide a URL. The imported spec will be active for the current session.
          {currentFileName && (
             <span className="block mt-2 text-sm text-muted-foreground">
                Currently active: <strong className="text-foreground">{currentFileName}</strong>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="url" className="w-full" onValueChange={(value) => {
          form.setValue("type", value as "url" | "file");
          if (value === 'url') {
            form.setValue('file', undefined as any); 
            form.resetField('file'); 
          } else {
            form.setValue('url', '');
             form.resetField('url'); 
          }
          form.clearErrors(); 
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url"><Icons.Globe className="w-4 h-4 mr-2" />From URL</TabsTrigger>
            <TabsTrigger value="file"><Icons.FileJson className="w-4 h-4 mr-2" />Upload File</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <TabsContent value="url">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specification URL</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., https://petstore3.swagger.io/api/v3/openapi.json" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the public URL of your OpenAPI specification file (JSON or YAML).
                      </FormDescription>
                      <FormMessage />
                       <div className="mt-3 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1.5">Or try an example:</p>
                            <div className="flex flex-wrap gap-2">
                                {exampleSpecs.map(spec => (
                                    <Button 
                                        key={spec.url} 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs"
                                        onClick={() => {
                                          form.setValue("url", spec.url);
                                          form.clearErrors("url"); 
                                        }}
                                    >
                                        {spec.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="file">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, onBlur, name, ref } }) => ( 
                    <FormItem>
                      <FormLabel>Specification File</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".json,.yaml,.yml"
                           onChange={(e) => onChange(e.target.files)} 
                          onBlur={onBlur}
                          name={name}
                          ref={ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload a .json, .yaml, or .yml file from your computer.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.UploadCloud className="mr-2 h-4 w-4" />
                )}
                Load Specification
              </Button>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
