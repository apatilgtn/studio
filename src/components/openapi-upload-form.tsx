
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
  const { setSpec, setError, setLoading, isLoading, fileName: currentFileName, activeSpecId, clear: clearActiveSpec } =
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
            } else if (errorJson && errorJson.message) { 
               descriptiveError = typeof errorJson.message === 'string' ? errorJson.message : JSON.stringify(errorJson.message);
            } else { 
               descriptiveError = `Proxy API returned an invalid error format (Status: ${response.status}). Raw: ${responseBodyText.substring(0,150)}...`;
            }
          } catch (e) { 
            if (responseBodyText.toLowerCase().includes("<html")) {
               descriptiveError = `Failed to fetch spec. External server at ${data.url} returned an HTML page (status ${response.status} ${response.statusText}). This could be an error page or authentication prompt.`;
             } else {
               descriptiveError = `Failed to fetch spec. External server at ${data.url} returned status ${response.status} ${response.statusText} with unexpected content. Preview (first 100 chars): ${responseBodyText.substring(0, 100)}...`;
             }
          }
          
          throw new Error(descriptiveError);
        }
        
        const result = JSON.parse(responseBodyText); 
        
        if (result.error) { 
            throw new Error(result.error);
        }
        
        specObject = result.specObject as OpenAPI.Document;
        rawSpecText = result.rawSpecText;
        wasVersionOverridden = result.versionOverridden || false; 
        inputFileName = data.url.substring(data.url.lastIndexOf('/') + 1) || "openapi-spec-from-url";

      } else { 
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
            if (wasVersionOverridden) {
                 throw new Error(`Failed to bundle after overriding file version from ${originalVersionFromFile} to 3.0.3: ${bundleError.message}`);
            }
            throw bundleError; 
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
      
      const newSpecId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setSpec({
        specObject,
        rawSpecText,
        name: inputFileName,
        id: newSpecId, 
      });

      if (wasVersionOverridden && data.type === 'url') {
         toast({
            title: "Success & Version Override (URL)",
            description: `OpenAPI spec "${inputFileName}" loaded. Its original version was changed to 3.0.3 for compatibility. Full parsing not guaranteed.`,
            variant: "default",
            duration: 8000,
          });
      } else if (!wasVersionOverridden) { 
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
    {name: "Guru API (v1 JSON)", url: "https://api.getguru.com/api/v1/openapi.json"},
    {name: "Kubernetes API (v1.29.0, v3 JSON)", url: "https://raw.githubusercontent.com/kubernetes/kubernetes/v1.29.0/api/openapi-spec/v3/api.json"},
    {name: "Petstore OpenAPI v3 (YAML)", url: "https://petstore3.swagger.io/api/v3/openapi.yaml"} 
  ];


  return (
    <Card className="w-full max-w-xl mx-auto shadow-lg"> {/* Slightly reduced max-width */}
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl flex items-center gap-2"> {/* Reduced size */}
          <Icons.UploadCloud className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          Import OpenAPI Specification
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Upload a file (JSON/YAML) or provide a URL. Active for current session.
          {currentFileName && (
             <span className="block mt-1.5 text-xs text-muted-foreground"> {/* Reduced margin/text */}
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
            <TabsTrigger value="url"><Icons.Globe className="w-3.5 h-3.5 mr-1.5" />From URL</TabsTrigger> {/* Smaller icon/margin */}
            <TabsTrigger value="file"><Icons.FileJson className="w-3.5 h-3.5 mr-1.5" />Upload File</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6 mt-3 md:mt-4"> {/* Reduced spacing/margin */}
              <TabsContent value="url">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs md:text-sm">Specification URL</FormLabel> {/* Reduced size */}
                      <FormControl>
                        <Input placeholder="e.g., https://petstore3.swagger.io/api/v3/openapi.json" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Enter the public URL of your OpenAPI specification file (JSON or YAML).
                      </FormDescription>
                      <FormMessage />
                       <div className="mt-2.5 pt-1.5 border-t"> {/* Reduced margin/padding */}
                            <p className="text-xs text-muted-foreground mb-1">Or try an example:</p>
                            <div className="flex flex-wrap gap-1.5 md:gap-2"> {/* Reduced gap */}
                                {exampleSpecs.map(spec => (
                                    <Button 
                                        key={spec.url} 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs h-8" /* Reduced height */
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
                      <FormLabel className="text-xs md:text-sm">Specification File</FormLabel> {/* Reduced size */}
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".json,.yaml,.yml"
                           onChange={(e) => onChange(e.target.files)} 
                          onBlur={onBlur}
                          name={name}
                          ref={ref}
                          className="text-xs" /* Smaller text for file input itself */
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
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
