
import { NextResponse, type NextRequest } from 'next/server';
import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from 'js-yaml';
import type { OpenAPI } from 'openapi-types';

export async function POST(request: NextRequest) {
  let responseBodyText: string | undefined;
  let specUrl = ''; 
  let versionOverridden = false;

  try {
    const body = await request.json();
    specUrl = body.url; 

    if (!specUrl || typeof specUrl !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string' }, { status: 400 });
    }

    let parsedSpec: any; 
    // let rawSpecTextForOutput: string; // Will be generated after validation

    const externalResponse = await fetch(specUrl, {
      headers: {
        'User-Agent': 'APIHarmonyLite-Fetcher/1.0',
        'Accept': 'application/json, application/yaml, text/yaml, application/x-yaml, text/plain, */*',
      }
    });
    responseBodyText = await externalResponse.text(); 

    if (!externalResponse.ok) {
      let errorMsgFromExternalServer = `Request to ${specUrl} failed: ${externalResponse.status} ${externalResponse.statusText}`;
      const contentType = externalResponse.headers.get('content-type');

      if (externalResponse.status === 404) {
         errorMsgFromExternalServer = `Failed to fetch spec. External server at ${specUrl} returned status 404 Not Found. Please check if the URL is correct and publicly accessible.`;
         if (contentType?.includes('text/html')) {
             errorMsgFromExternalServer += ` The content appears to be an HTML page, not the API specification.`;
         } else if (responseBodyText && responseBodyText.length > 0 && !contentType?.includes('application/json') && !contentType?.includes('application/yaml') && !contentType?.includes('text/yaml') && !contentType?.includes('text/plain')) {
            errorMsgFromExternalServer += ` Unexpected content type: ${contentType}. Preview (first 100 chars): ${responseBodyText.substring(0, 100)}...`;
         }
      } else if (contentType?.includes('application/json')) {
        try {
          const errorJson = JSON.parse(responseBodyText); 
          if (errorJson && errorJson.message) {
            errorMsgFromExternalServer = errorJson.message;
          } else if (errorJson && errorJson.error) {
            errorMsgFromExternalServer = errorJson.error;
          } else {
            errorMsgFromExternalServer = `External server (at ${specUrl}) returned status ${externalResponse.status} with a JSON error response that does not conform to expected {message: ...} or {error: ...} structure. Raw error preview: ${responseBodyText.substring(0,100)}...`;
          }
        } catch (e) {
          errorMsgFromExternalServer = `External server (at ${specUrl}) returned status ${externalResponse.status}, claimed JSON error response, but parsing failed. Raw response preview: ${responseBodyText.substring(0,100)}...`;
        }
      } else if (contentType?.includes('text/html')) {
        errorMsgFromExternalServer = `Failed to fetch spec. External server at ${specUrl} returned an HTML page (status ${externalResponse.status} ${externalResponse.statusText}). This could be an error page, authentication prompt, or a misconfigured URL.`;
      } else if (responseBodyText && responseBodyText.length > 0) {
         errorMsgFromExternalServer = `Failed to fetch spec. External server at ${specUrl} returned status ${externalResponse.status} ${externalResponse.statusText} with unexpected content. Preview (first 100 chars): ${responseBodyText.substring(0, 100)}...`;
      }
      
      throw new Error(errorMsgFromExternalServer); 
    }
    
    try {
      parsedSpec = YAML.load(responseBodyText) as OpenAPI.Document;
      if (typeof parsedSpec !== 'object' || parsedSpec === null || (!parsedSpec.swagger && !parsedSpec.openapi)) {
          // If YAML.load results in a non-object or string, it might not be YAML or it might be JSON.
          // Try parsing as JSON as a fallback.
          try {
            parsedSpec = JSON.parse(responseBodyText) as OpenAPI.Document;
             if (typeof parsedSpec !== 'object' || parsedSpec === null || (!parsedSpec.swagger && !parsedSpec.openapi)) {
                throw new Error("Parsed content is not a valid OpenAPI object after attempting YAML and JSON.");
            }
          } catch (jsonError) {
             throw new Error("Content is not valid YAML or JSON.");
          }
      }
    } catch (parseError: any) {
        console.error('Error parsing spec as YAML or JSON:', parseError);
        throw new Error(`Failed to parse specification from ${specUrl}. Content is not valid YAML or JSON. Error: ${parseError.message}`);
    }


    if (parsedSpec.openapi && typeof parsedSpec.openapi === 'string' && parsedSpec.openapi.startsWith('3.0.') && parsedSpec.openapi > '3.0.3') {
        console.warn(`Attempting to override OpenAPI version from ${parsedSpec.openapi} to 3.0.3 for URL: ${specUrl}`);
        parsedSpec.openapi = '3.0.3';
        versionOverridden = true;
    }
    
    let validatedSpecToReturn: OpenAPI.Document;
    try {
      // SwaggerParser.validate/bundle can take the parsed object directly.
      // Dereferencing and bundling might be more robust:
      validatedSpecToReturn = await SwaggerParser.bundle(JSON.parse(JSON.stringify(parsedSpec))) as OpenAPI.Document;
    } catch (validationError: any) {
      // The version override logic for unsupported versions is now primarily handled before this step.
      // If it still fails due to version, it's likely a more fundamental incompatibility.
      throw new Error(`Failed to validate/bundle spec from ${specUrl}: ${validationError.message}`);
    }
    
    // Convert the validated (and potentially bundled) spec back to YAML for the rawSpecText output.
    const rawSpecTextForOutput = YAML.dump(validatedSpecToReturn); 
    
    return NextResponse.json({ specObject: validatedSpecToReturn, rawSpecText: rawSpecTextForOutput, versionOverridden });

  } catch (error: any) {
    let errorContext = '';
    if (error.message) {
      errorContext = error.message;
    } else if (error.name) {
      errorContext = error.name;
    } else {
      try {
        errorContext = JSON.stringify(error);
      } catch (e) {
        errorContext = String(error);
      }
    }
    
    console.error(`Error in fetch-spec proxy for URL: ${specUrl || 'Unknown URL provided in request'}. Details:`, errorContext, error.stack);
    
    let friendlyMessage = `An unexpected error occurred while fetching or parsing the specification.`;

    if (errorContext) {
        if (errorContext.includes("Unsupported OpenAPI version")) {
            friendlyMessage = errorContext; 
        } else if (errorContext.includes("Failed to validate spec") || errorContext.startsWith("Failed to parse specification") || errorContext.startsWith("Request to") || errorContext.startsWith("External server")) {
            friendlyMessage = errorContext; 
        } else {
            friendlyMessage = `Error processing specification: ${errorContext.substring(0, 200)}${errorContext.length > 200 ? '...' : ''}`;
        }
    }
    
    return NextResponse.json({ error: friendlyMessage, fullError: errorContext, stack: error.stack }, { status: 500 });
  }
}
