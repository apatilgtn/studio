
"use client";

import { useOpenApiStore } from "@/stores/openapi-store";
import type { OpenAPI, OpenAPIV3, OpenAPIV2 } from 'openapi-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SchemaUsage {
  operations: { path: string; method: string; type: 'requestBody' | 'response' }[];
  referencedBySchemas: string[]; // Schemas that reference this schema
}

// Helper to check if it's an OpenAPI V3 document
function isOpenAPIV3(doc: OpenAPI.Document | null | undefined): doc is OpenAPIV3.Document {
  return !!doc && 'openapi' in doc && typeof doc.openapi === 'string' && doc.openapi.startsWith('3.');
}

// Helper to check if it's an OpenAPI V2 document (Swagger)
function isOpenAPIV2(doc: OpenAPI.Document | null | undefined): doc is OpenAPIV2.Document {
  return !!doc && 'swagger' in doc && typeof doc.swagger === 'string' && doc.swagger.startsWith('2.');
}


export function DependencyGraphViewer() {
  const { spec, error: specError } = useOpenApiStore();

  if (specError) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2 text-xl">
            <Icons.AlertTriangle /> Error Loading Specification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive p-3 rounded-md">{specError}</p>
           <p className="mt-4 text-sm">
            Please try importing the specification again via the <a href="/" className="underline text-primary hover:text-primary/80">Import page</a>.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!spec) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Icons.Info />No API Specification Loaded</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Please import an OpenAPI specification first using the <a href="/" className="underline text-primary hover:text-primary/80">Import page</a> to view dependencies.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isV3 = isOpenAPIV3(spec);
  const isV2 = isOpenAPIV2(spec);

   if (!isV3 && !isV2) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Icons.Info />Unsupported Specification Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Dependency graph analysis currently supports OpenAPI V3 and V2 specifications. The loaded specification is not recognized as either.
          </p>
        </CardContent>
      </Card>
    );
  }

  const schemaUsageMap = new Map<string, SchemaUsage>();
  let schemasContainer: Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | OpenAPIV2.SchemaObject | OpenAPIV2.ReferenceObject> | undefined;
  let refPrefix: string;

  if (isV3) {
    schemasContainer = (spec as OpenAPIV3.Document).components?.schemas;
    refPrefix = '#/components/schemas/';
  } else { // isV2
    schemasContainer = (spec as OpenAPIV2.Document).definitions;
    refPrefix = '#/definitions/';
  }

  // Initialize map
  if (schemasContainer) {
    for (const schemaName in schemasContainer) {
      schemaUsageMap.set(schemaName, { operations: [], referencedBySchemas: [] });
    }
  }

  // Helper to find $ref values
  const findRefs = (obj: any, currentSchemaNameForReferencing?: string): string[] => {
    const refsFound: string[] = [];
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (key === '$ref' && typeof obj[key] === 'string') {
            const refPath = obj[key] as string;
            if (refPath.startsWith(refPrefix)) {
              const refSchemaName = refPath.substring(refPrefix.length);
              refsFound.push(refSchemaName);
              if (currentSchemaNameForReferencing && schemaUsageMap.has(refSchemaName)) {
                  const referencedSchemaEntry = schemaUsageMap.get(refSchemaName)!;
                  if (!referencedSchemaEntry.referencedBySchemas.includes(currentSchemaNameForReferencing)){
                      referencedSchemaEntry.referencedBySchemas.push(currentSchemaNameForReferencing);
                  }
              }
            }
          } else {
            refsFound.push(...findRefs(obj[key], currentSchemaNameForReferencing));
          }
        }
      }
    }
    return refsFound;
  };
  
  // Analyze schema properties for inter-schema references
  if (schemasContainer) {
    for (const schemaName in schemasContainer) {
        const schemaObject = schemasContainer[schemaName];
        findRefs(schemaObject, schemaName);
    }
  }

  // Analyze paths for schema usage
  if (spec.paths) {
    for (const path in spec.paths) {
      const pathItem = spec.paths[path] as OpenAPIV3.PathItemObject | OpenAPIV2.PathItemObject;
      if (!pathItem) continue;

      for (const method in pathItem) {
        if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method.toLowerCase())) continue;
        
        const operation = pathItem[method as keyof typeof pathItem];
        if (!operation || typeof operation !== 'object' || !('responses' in operation)) continue;

        const recordOperationUsage = (schemaNames: string[], type: 'requestBody' | 'response') => {
          schemaNames.forEach(refSchemaName => {
            if (schemaUsageMap.has(refSchemaName)) {
              schemaUsageMap.get(refSchemaName)!.operations.push({ path, method, type });
            }
          });
        };

        if (isV3) {
          const v3Operation = operation as OpenAPIV3.OperationObject;
          if (v3Operation.requestBody && 'content' in v3Operation.requestBody) {
            for (const contentType in v3Operation.requestBody.content) {
              const mediaType = v3Operation.requestBody.content[contentType];
              if (mediaType.schema) {
                recordOperationUsage(findRefs(mediaType.schema), 'requestBody');
              }
            }
          }
          if (v3Operation.responses) {
            for (const statusCode in v3Operation.responses) {
              const response = v3Operation.responses[statusCode];
              if (response && 'content' in response && response.content) {
                for (const contentType in response.content) {
                  const mediaType = response.content[contentType];
                  if (mediaType.schema) {
                     recordOperationUsage(findRefs(mediaType.schema), 'response');
                  }
                }
              }
            }
          }
        } else { // isV2
          const v2Operation = operation as OpenAPIV2.OperationObject;
          if (v2Operation.parameters) {
            for (const param of v2Operation.parameters) {
              if (!('$ref' in param) && param.in === 'body' && param.schema) {
                recordOperationUsage(findRefs(param.schema), 'requestBody');
              }
            }
          }
          if (v2Operation.responses) {
            for (const statusCode in v2Operation.responses) {
              const response = v2Operation.responses[statusCode];
              if (response && !('$ref' in response) && response.schema) {
                 recordOperationUsage(findRefs(response.schema), 'response');
              }
            }
          }
        }
      }
    }
  }
  
  const hasDependencies = Array.from(schemaUsageMap.values()).some(
    usage => usage.operations.length > 0 || usage.referencedBySchemas.length > 0
  );

  return (
    <Card className="w-full shadow-xl"> {/* Changed to shadow-xl */}
      <CardHeader className="bg-primary/5"> {/* Added subtle bg */}
        <CardTitle className="text-xl md:text-2xl flex items-center gap-2"> {/* Reduced size */}
          <Icons.GitFork className="w-6 h-6 text-primary" /> API Schema Dependencies
        </CardTitle>
        <CardDescription className="text-xs md:text-sm"> {/* Reduced size */}
          Shows how schemas (from <code>{isV3 ? 'components/schemas' : 'definitions'}</code>) are used by operations or other schemas.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 md:pt-6"> {/* Adjusted padding */}
        {!schemasContainer && <p className="text-muted-foreground text-sm">No schemas found in the specification (expected in {isV3 ? 'components/schemas' : 'definitions'}).</p>}
        {schemasContainer && !hasDependencies && <p className="text-muted-foreground text-sm">No schema dependencies found among the defined schemas.</p>}
        {schemasContainer && hasDependencies && (
          <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-300px)]"> {/* Adjusted height */}
            <Accordion type="multiple" className="w-full space-y-1.5 md:space-y-2"> {/* Reduced spacing */}
              {Array.from(schemaUsageMap.entries()).map(([schemaName, usage]) => {
                const opCount = usage.operations.length;
                const refCount = usage.referencedBySchemas.length;
                if (opCount === 0 && refCount === 0 && !Object.keys(schemasContainer || {}).includes(schemaName) ) return null; // Only show defined schemas or those with usage
                
                return (
                <AccordionItem value={schemaName} key={schemaName} className="border rounded-md shadow-sm bg-card hover:shadow-md transition-shadow">
                  <AccordionTrigger className="px-3 py-2.5 md:px-4 md:py-3 hover:bg-muted/50 rounded-t-md"> {/* Reduced padding */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 md:gap-2"> {/* Reduced gap */}
                        <Icons.FileJson className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                        <span className="font-semibold text-xs md:text-sm">{schemaName}</span> {/* Reduced text size */}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-xs text-muted-foreground"> {/* Reduced gap & text size */}
                        {opCount > 0 && <Badge variant="outline" className="text-xs px-1.5 py-0.5">Ops: {opCount}</Badge>}
                        {refCount > 0 && <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Refs: {refCount}</Badge>}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-3 md:p-4 bg-background rounded-b-md text-xs"> {/* Reduced padding & text size */}
                    {opCount > 0 && (
                      <div className="mb-2 md:mb-3"> {/* Reduced margin */}
                        <h4 className="text-xs font-medium mb-1 text-muted-foreground">Used by Operations:</h4>
                        <ul className="space-y-1">
                          {usage.operations.map((op, idx) => (
                            <li key={idx} className="flex items-center gap-1.5"> {/* Reduced gap */}
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-1.5 py-0.5 method-badge-${op.method.toLowerCase()}`}
                                style={{
                                  // @ts-ignore - CSS custom properties
                                  '--method-badge-bg': `var(--method-${op.method.toLowerCase()}-bg, hsl(var(--muted)))`,
                                  '--method-badge-fg': `var(--method-${op.method.toLowerCase()}-fg, hsl(var(--muted-foreground)))`,
                                  '--method-badge-border': `var(--method-${op.method.toLowerCase()}-border, hsl(var(--border)))`,
                                }}
                              >
                                {op.method.toUpperCase()}
                              </Badge>
                              <span className="font-mono text-xs">{op.path}</span>
                              <span className="text-muted-foreground/80 text-xs">({op.type})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {refCount > 0 && (
                      <div className="mt-2"> {/* Added margin top */}
                        <h4 className="text-xs font-medium mb-1 text-muted-foreground">Referenced by Schemas:</h4>
                         <ul className="space-y-1">
                          {usage.referencedBySchemas.map((refName, idx) => (
                            <li key={idx} className="flex items-center gap-1 text-xs"> {/* Reduced gap */}
                              <Icons.Link2 className="w-3 h-3 text-muted-foreground/70"/> {refName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {opCount === 0 && refCount === 0 && (
                        <p className="text-xs text-muted-foreground italic">This schema is defined but not directly used by operations or other schemas in this specification.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
                )
              })}
            </Accordion>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
