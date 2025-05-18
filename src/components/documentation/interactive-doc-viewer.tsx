
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
import { Icons, ApiMethodIcons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Helper to check if it's an OpenAPI V3 document
function isOpenAPIV3(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return 'openapi' in doc && doc.openapi.startsWith('3.');
}

// Helper to check if it's an OpenAPI V2 document (Swagger)
function isOpenAPIV2(doc: OpenAPI.Document): doc is OpenAPIV2.Document {
  return 'swagger' in doc && doc.swagger.startsWith('2.');
}


const SchemaDisplay = ({ schema, name }: { schema: OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject, name?: string }) => {
  if (!schema) return <p className="text-xs text-muted-foreground">No schema details.</p>; // Reduced size

  const properties = schema.properties || (schema.type === 'array' && schema.items && (schema.items as any).properties ? (schema.items as any).properties : null);
  const type = schema.type || (properties ? 'object' : 'unknown');
  const enumValues = (schema as any).enum as any[] | undefined;

  return (
    <div className="text-xs p-1.5 border rounded-md bg-secondary/30 my-1"> {/* Reduced padding */}
      {name && <p className="font-semibold text-xs">{name} <Badge variant="outline" className="ml-1 text-xs">{type}</Badge></p>} {/* Smaller text */}
      {!name && <p><Badge variant="outline" className="text-xs">{type}</Badge></p>}
      {schema.description && <p className="text-muted-foreground text-xs mt-0.5">{schema.description}</p>} {/* Smaller margin */}
      {schema.format && <p className="text-xs text-muted-foreground">Format: {schema.format}</p>}
      
      {enumValues && Array.isArray(enumValues) && enumValues.length > 0 && (
        <div className="mt-0.5"> {/* Smaller margin */}
          <p className="text-xs font-medium">Enum Values:</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {enumValues.map((val, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs font-normal">{String(val)}</Badge>
            ))}
          </div>
        </div>
      )}

      {schema.example && <pre className="mt-1 p-1 bg-muted rounded text-xs overflow-auto">Example: {JSON.stringify(schema.example, null, 2)}</pre>}
      
      {type === 'array' && schema.items && !(schema.items as any).properties && ( 
        <div className="ml-3 mt-0.5"> {/* Reduced margin/padding */}
          <p className="text-xs font-medium">Items type: <Badge variant="outline" className="text-xs">{(schema.items as any).type || 'object'}</Badge></p>
          <SchemaDisplay schema={schema.items as OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject} />
        </div>
      )}

      {properties && (
        <Table className="mt-1.5 text-xs"> {/* Reduced margin */}
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead> {/* Smaller text */}
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(properties).map(([propName, propDef]) => {
              const propSchema = propDef as OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject;
              const propEnumValues = (propSchema as any).enum as any[] | undefined;
              return (
                <TableRow key={propName}>
                  <TableCell className="font-mono py-0.5 text-xs">{propName}</TableCell> {/* Smaller padding/text */}
                  <TableCell className="py-0.5 text-xs">
                    {(propSchema as any).type}
                    {(propSchema as any).format ? `(${(propSchema as any).format})` : ''}
                    {propEnumValues && Array.isArray(propEnumValues) && propEnumValues.length > 0 && propEnumValues.length < 6 && ( 
                       <span className="ml-1 text-muted-foreground text-xs">({propEnumValues.map(String).join(', ')})</span>
                    )}
                  </TableCell>
                  <TableCell className="py-0.5 text-xs">
                    {(propSchema as any).description || '-'}
                    {propEnumValues && Array.isArray(propEnumValues) && propEnumValues.length >= 6 && (
                        <div className="mt-0.5">
                            <p className="text-xxs font-medium text-muted-foreground">Enum:</p> {/* text-xxs needs to be defined if used */}
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                                {propEnumValues.map((val, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xxs px-1 py-0 font-normal">{String(val)}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};


const OperationDetailsV3 = ({ path, method, operation }: { path: string, method: string, operation: OpenAPIV3.OperationObject }) => {
  const HttpIcon = ApiMethodIcons[method.toLowerCase()] || Icons.Network;
  return (
    <AccordionItem value={`${path}-${method}`} className="border-b-0">
      <AccordionTrigger className="hover:no-underline p-3"> {/* Reduced padding */}
        <div className="flex items-center gap-2 w-full"> {/* Reduced gap */}
          <Badge 
            variant="outline" 
            className={`w-16 justify-center text-xs font-semibold method-${method.toLowerCase()}`} /* Reduced width */
            style={{
              borderColor: `var(--method-${method.toLowerCase()}-border, hsl(var(--border)))`,
              backgroundColor: `var(--method-${method.toLowerCase()}-bg, hsl(var(--secondary)))`,
              color: `var(--method-${method.toLowerCase()}-fg, hsl(var(--secondary-foreground)))`,
            }}
          >
            <HttpIcon className="w-3 h-3 mr-1" /> {/* Smaller icon/margin */}
            {method.toUpperCase()}
          </Badge>
          <span className="font-mono text-xs flex-grow text-left">{path}</span> {/* Smaller text */}
          <span className="text-xs text-muted-foreground truncate max-w-[200px] text-right">{operation.summary}</span> {/* Max width reduced */}
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-3 bg-card rounded-b-md shadow-inner"> {/* Reduced padding */}
        {operation.description && <p className="text-xs text-muted-foreground mb-2">{operation.description}</p>} {/* Smaller margin/text */}
        {operation.tags && operation.tags.length > 0 && (
          <div className="mb-2"> {/* Smaller margin */}
            {operation.tags.map(tag => <Badge key={tag} variant="secondary" className="mr-1 text-xs">{tag}</Badge>)}
          </div>
        )}

        {operation.parameters && operation.parameters.length > 0 && (
          <div className="mb-3"> {/* Smaller margin */}
            <h4 className="font-semibold text-sm mb-1.5">Parameters</h4> {/* Smaller margin/text */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">In</TableHead>
                  <TableHead className="text-xs">Required</TableHead>
                  <TableHead className="text-xs">Schema</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operation.parameters.map((param, idx) => {
                  const p = param as OpenAPIV3.ParameterObject;
                  return (
                    <TableRow key={p.name + idx}>
                      <TableCell className="font-mono text-xs py-1">{p.name}</TableCell> {/* Smaller padding/text */}
                      <TableCell className="text-xs py-1">{p.in}</TableCell>
                      <TableCell className="text-xs py-1">{p.required ? <Icons.CheckCircle2 className="text-green-500 w-3.5 h-3.5"/> : <Icons.XCircle className="text-red-500 w-3.5 h-3.5"/>}</TableCell> {/* Smaller icon */}
                      <TableCell className="py-1">{p.schema ? <SchemaDisplay schema={p.schema as OpenAPIV3.SchemaObject} /> : 'N/A'}</TableCell>
                      <TableCell className="text-xs py-1">{p.description || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {operation.requestBody && (
          <div className="mb-3"> {/* Smaller margin */}
            <h4 className="font-semibold text-sm mb-1.5">Request Body</h4>
            <p className="text-xs text-muted-foreground mb-1">{(operation.requestBody as OpenAPIV3.RequestBodyObject).description}</p>
            {Object.entries((operation.requestBody as OpenAPIV3.RequestBodyObject).content).map(([contentType, mediaTypeObj]) => (
              <div key={contentType} className="mb-1.5"> {/* Smaller margin */}
                <Badge variant="outline" className="mb-1 text-xs">{contentType}</Badge>
                {mediaTypeObj.schema && <SchemaDisplay schema={mediaTypeObj.schema as OpenAPIV3.SchemaObject}/>}
              </div>
            ))}
          </div>
        )}
        
        <h4 className="font-semibold text-sm mb-1.5">Responses</h4>
        <Accordion type="multiple" className="w-full">
        {Object.entries(operation.responses).map(([statusCode, responseObj]) => {
          const res = responseObj as OpenAPIV3.ResponseObject;
          return (
            <AccordionItem value={statusCode} key={statusCode} className="border rounded-md mb-1.5 bg-secondary/20"> {/* Smaller margin */}
              <AccordionTrigger className="px-2.5 py-1.5 text-xs hover:no-underline"> {/* Smaller padding/text */}
                Status Code: <Badge variant={parseInt(statusCode) >= 400 ? "destructive" : "default"} className="ml-1.5 text-xs">{statusCode}</Badge> 
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-[180px]">{res.description}</span> {/* Max width reduced */}
              </AccordionTrigger>
              <AccordionContent className="px-2.5 py-1.5"> {/* Smaller padding */}
                {res.headers && (
                  <div className="mb-1.5"> {/* Smaller margin */}
                    <h5 className="text-xs font-semibold mb-0.5">Headers:</h5>
                     {Object.entries(res.headers).map(([headerName, headerObj]) => (
                       <div key={headerName} className="text-xs"><strong>{headerName}:</strong> {(headerObj as OpenAPIV3.HeaderObject).description}</div>
                     ))}
                  </div>
                )}
                {res.content && Object.entries(res.content).map(([contentType, mediaTypeObj]) => (
                  <div key={contentType} className="mb-1"> {/* Smaller margin */}
                    <Badge variant="outline" className="mb-1 text-xs">{contentType}</Badge>
                    {mediaTypeObj.schema && <SchemaDisplay schema={mediaTypeObj.schema as OpenAPIV3.SchemaObject}/>}
                  </div>
                ))}
                 {!res.content && <p className="text-xs text-muted-foreground">No content defined for this response.</p>}
              </AccordionContent>
            </AccordionItem>
          )
        })}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  );
};

const OperationDetailsV2 = ({ path, method, operation }: { path: string, method: string, operation: OpenAPIV2.OperationObject }) => {
  const HttpIcon = ApiMethodIcons[method.toLowerCase()] || Icons.Network;
  return (
     <AccordionItem value={`${path}-${method}`} className="border-b-0">
      <AccordionTrigger className="hover:no-underline p-3">
        <div className="flex items-center gap-2 w-full">
          <Badge 
            variant="outline" 
            className={`w-16 justify-center text-xs font-semibold method-${method.toLowerCase()}`}
             style={{
              borderColor: `var(--method-${method.toLowerCase()}-border, hsl(var(--border)))`,
              backgroundColor: `var(--method-${method.toLowerCase()}-bg, hsl(var(--secondary)))`,
              color: `var(--method-${method.toLowerCase()}-fg, hsl(var(--secondary-foreground)))`,
            }}
          >
            <HttpIcon className="w-3 h-3 mr-1" />
            {method.toUpperCase()}
          </Badge>
          <span className="font-mono text-xs flex-grow text-left">{path}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px] text-right">{operation.summary}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-3 bg-card rounded-b-md shadow-inner">
        {operation.description && <p className="text-xs text-muted-foreground mb-2">{operation.description}</p>}
        {operation.tags && operation.tags.length > 0 && (
          <div className="mb-2">
            {operation.tags.map(tag => <Badge key={tag} variant="secondary" className="mr-1 text-xs">{tag}</Badge>)}
          </div>
        )}

        {operation.parameters && operation.parameters.length > 0 && (
          <div className="mb-3">
            <h4 className="font-semibold text-sm mb-1.5">Parameters</h4>
            <Table>
               <TableHeader><TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">In</TableHead><TableHead className="text-xs">Required</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Schema/Details</TableHead><TableHead className="text-xs">Description</TableHead></TableRow></TableHeader>
              <TableBody>
                {operation.parameters.map((param, idx) => {
                  const p = param as OpenAPIV2.Parameter;
                  return (
                    <TableRow key={p.name + idx}>
                      <TableCell className="font-mono text-xs py-1">{p.name}</TableCell>
                      <TableCell className="text-xs py-1">{p.in}</TableCell>
                      <TableCell className="text-xs py-1">{p.required ? <Icons.CheckCircle2 className="text-green-500 w-3.5 h-3.5"/> : <Icons.XCircle className="text-red-500 w-3.5 h-3.5"/>}</TableCell>
                      <TableCell className="text-xs py-1">{p.type} {p.format ? `(${p.format})` : ''}</TableCell>
                       <TableCell className="py-1">{p.schema ? <SchemaDisplay schema={p.schema as OpenAPIV2.SchemaObject} /> : (p.items ? <SchemaDisplay schema={p.items as OpenAPIV2.SchemaObject} name="items"/> : 'N/A')}</TableCell>
                      <TableCell className="text-xs py-1">{p.description || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        <h4 className="font-semibold text-sm mb-1.5">Responses</h4>
         <Accordion type="multiple" className="w-full">
        {Object.entries(operation.responses).map(([statusCode, responseObj]) => {
          const res = responseObj as OpenAPIV2.ResponseObject;
          return (
            <AccordionItem value={statusCode} key={statusCode} className="border rounded-md mb-1.5 bg-secondary/20">
              <AccordionTrigger className="px-2.5 py-1.5 text-xs hover:no-underline">
                Status Code: <Badge variant={parseInt(statusCode) >= 400 ? "destructive" : "default"} className="ml-1.5 text-xs">{statusCode}</Badge>
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-[180px]">{res.description}</span>
              </AccordionTrigger>
              <AccordionContent className="px-2.5 py-1.5">
                {res.schema && <SchemaDisplay schema={res.schema} />}
                {!res.schema && <p className="text-xs text-muted-foreground">No schema defined for this response.</p>}
              </AccordionContent>
            </AccordionItem>
          )
        })}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  )
};


export function InteractiveDocViewer() {
  const { spec, fileName, error: specError, rawSpec } = useOpenApiStore();

  if (specError) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2 text-xl"> {/* Reduced size */}
            <Icons.AlertTriangle /> Error Loading Specification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive p-3 rounded-md text-sm">{specError}</p>
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
          <CardTitle className="flex items-center gap-2 text-xl"><Icons.Info />No API Specification Loaded</CardTitle> {/* Reduced size */}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Please import an OpenAPI specification first using the <a href="/" className="underline text-primary hover:text-primary/80">Import page</a> to view the documentation.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { info, paths } = spec;
  const isV3 = isOpenAPIV3(spec);
  const isV2 = isOpenAPIV2(spec);
  
  const methodColorsCSS = `
    <style>
      .method-get { --method-get-bg: hsl(var(--chart-1)/0.1); --method-get-fg: hsl(var(--chart-1)); --method-get-border: hsl(var(--chart-1)); }
      .method-post { --method-post-bg: hsl(var(--chart-2)/0.1); --method-post-fg: hsl(var(--chart-2)); --method-post-border: hsl(var(--chart-2)); }
      .method-put { --method-put-bg: hsl(var(--chart-3)/0.1); --method-put-fg: hsl(var(--chart-3)); --method-put-border: hsl(var(--chart-3)); }
      .method-delete { --method-delete-bg: hsl(var(--destructive)/0.1); --method-delete-fg: hsl(var(--destructive)); --method-delete-border: hsl(var(--destructive)); }
      .method-patch { --method-patch-bg: hsl(var(--chart-4)/0.1); --method-patch-fg: hsl(var(--chart-4)); --method-patch-border: hsl(var(--chart-4)); }
      .method-options { --method-options-bg: hsl(var(--muted)/0.5); --method-options-fg: hsl(var(--muted-foreground)); --method-options-border: hsl(var(--muted)); }
      .method-head { --method-head-bg: hsl(var(--muted)/0.5); --method-head-fg: hsl(var(--muted-foreground)); --method-head-border: hsl(var(--muted)); }
      .method-trace { --method-trace-bg: hsl(var(--muted)/0.5); --method-trace-fg: hsl(var(--muted-foreground)); --method-trace-border: hsl(var(--muted)); }
      .text-xxs { font-size: 0.65rem; line-height: 0.85rem; }
    </style>
  `;


  return (
    <div className="space-y-4 md:space-y-6"> {/* Reduced spacing */}
      <div dangerouslySetInnerHTML={{ __html: methodColorsCSS }} />
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-background">
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2"> {/* Reduced from 3xl */}
             <Icons.BookOpen className="w-6 h-6 md:w-7 md:h-7" /> {info.title} <Badge variant="outline" className="text-xs md:text-sm">{info.version}</Badge>
          </CardTitle>
          {info.description && <CardDescription className="text-sm pt-1">{info.description}</CardDescription>} {/* Reduced from md */}
          {isV3 && (spec as OpenAPIV3.Document).externalDocs && (
             <a href={(spec as OpenAPIV3.Document).externalDocs!.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                <Icons.ExternalLink className="w-3 h-3"/> External Documentation
            </a>
          )}
           {isV2 && (spec as OpenAPIV2.Document).host && <p className="text-xs text-muted-foreground">Host: {(spec as OpenAPIV2.Document).host}</p>}
           {isV2 && (spec as OpenAPIV2.Document).basePath && <p className="text-xs text-muted-foreground">Base Path: {(spec as OpenAPIV2.Document).basePath}</p>}
        </CardHeader>
        {info.contact && (
        <CardContent className="pt-3 border-t"> {/* Reduced padding */}
            <h3 className="text-xs font-semibold text-muted-foreground mb-0.5">Contact</h3> {/* Reduced size/margin */}
            {info.contact.name && <p className="text-xs">Name: {info.contact.name}</p>}
            {info.contact.url && <p className="text-xs">URL: <a href={info.contact.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{info.contact.url}</a></p>}
            {info.contact.email && <p className="text-xs">Email: <a href={`mailto:${info.contact.email}`} className="text-accent hover:underline">{info.contact.email}</a></p>}
        </CardContent>
        )}
        {info.license && (
        <CardContent className="pt-3 border-t"> {/* Reduced padding */}
            <h3 className="text-xs font-semibold text-muted-foreground mb-0.5">License</h3>
            <p className="text-xs">{info.license.name}
            {info.license.url && <span> (<a href={info.license.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Details</a>)</span>}
            </p>
        </CardContent>
        )}
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Icons.Network /> API Endpoints</CardTitle> {/* Reduced size */}
        </CardHeader>
        <CardContent>
          {paths && Object.keys(paths).length > 0 ? (
             <Accordion type="multiple" className="w-full space-y-1.5"> {/* Reduced spacing */}
              {Object.entries(paths).map(([path, pathItem]) => 
                pathItem && Object.entries(pathItem).map(([method, operation]) => {
                  if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method.toLowerCase())) {
                    return null;
                  }
                  if (isV3) {
                    return <OperationDetailsV3 key={`${path}-${method}`} path={path} method={method} operation={operation as OpenAPIV3.OperationObject} />;
                  } else if (isV2) {
                    return <OperationDetailsV2 key={`${path}-${method}`} path={path} method={method} operation={operation as OpenAPIV2.OperationObject} />;
                  }
                  return null;
                }).filter(Boolean)
              )}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-sm">No paths defined in this specification.</p>
          )}
        </CardContent>
      </Card>
      
      {isV3 && (spec as OpenAPIV3.Document).components?.schemas && Object.keys((spec as OpenAPIV3.Document).components!.schemas!).length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Icons.FileJson /> Schemas</CardTitle> {/* Reduced size */}
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries((spec as OpenAPIV3.Document).components!.schemas!).map(([schemaName, schemaObj]) => (
                <AccordionItem value={schemaName} key={schemaName}>
                  <AccordionTrigger className="text-sm">{schemaName}</AccordionTrigger> {/* Reduced size */}
                  <AccordionContent>
                    <SchemaDisplay schema={schemaObj as OpenAPIV3.SchemaObject} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
       {isV2 && (spec as OpenAPIV2.Document).definitions && Object.keys((spec as OpenAPIV2.Document).definitions!).length > 0 &&(
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Icons.FileJson /> Definitions (Swagger 2.0)</CardTitle> {/* Reduced size */}
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries((spec as OpenAPIV2.Document).definitions!).map(([defName, defObj]) => (
                <AccordionItem value={defName} key={defName}>
                  <AccordionTrigger className="text-sm">{defName}</AccordionTrigger> {/* Reduced size */}
                  <AccordionContent>
                    <SchemaDisplay schema={defObj as OpenAPIV2.SchemaObject} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Raw Specification</CardTitle> {/* Reduced size */}
            <CardDescription className="text-sm">The loaded OpenAPI specification in YAML format. ({fileName})</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] md:h-[400px] w-full rounded-md border p-3 bg-muted/50"> {/* Reduced padding */}
              <pre className="text-xs">{rawSpec || "No raw specification data available."}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
    </div>
  );
}
