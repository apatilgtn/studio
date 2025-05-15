
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

    let parsedSpec: any; // Use 'any' to allow modification of openapi property
    let rawSpecTextForOutput: string;

    const externalResponse = await fetch(specUrl);
    responseBodyText = await externalResponse.text(); 

    if (!externalResponse.ok) {
      let errorMsgFromExternalServer = `Request to ${specUrl} failed: ${externalResponse.status} ${externalResponse.statusText}`;
      const contentType = externalResponse.headers.get('content-type');

      if (contentType?.includes('application/json')) {
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
          throw new Error("Parsed YAML is not a valid OpenAPI object, trying JSON.");
      }
    } catch (yamlError) {
      try {
        parsedSpec = JSON.parse(responseBodyText) as OpenAPI.Document;
        if (typeof parsedSpec !== 'object' || parsedSpec === null || (!parsedSpec.swagger && !parsedSpec.openapi)) {
            throw new Error("Parsed JSON is not a valid OpenAPI object.");
        }
      } catch (jsonError: any) {
        console.error('Error parsing spec as YAML or JSON:', { yamlError, jsonError });
        throw new Error(`Failed to parse specification from ${specUrl}. Content is not valid YAML or JSON. YAML error: ${(yamlError as Error).message}, JSON error: ${jsonError.message}`);
      }
    }

    // Check and override OpenAPI version if necessary
    if (parsedSpec.openapi && typeof parsedSpec.openapi === 'string' && parsedSpec.openapi > '3.0.3' && parsedSpec.openapi.startsWith('3.0.')) {
        console.warn(`Attempting to override OpenAPI version from ${parsedSpec.openapi} to 3.0.3 for URL: ${specUrl}`);
        parsedSpec.openapi = '3.0.3';
        versionOverridden = true;
    }
    
    let validatedSpecToReturn: OpenAPI.Document;
    try {
      const specToValidate = JSON.parse(JSON.stringify(parsedSpec)); 
      validatedSpecToReturn = await SwaggerParser.validate(specToValidate) as OpenAPI.Document;
    } catch (validationError: any) {
      // If primary validation fails, and we haven't already overridden, and it's an unsupported version error for 3.0.x > 3.0.3
      if (!versionOverridden && validationError.message && validationError.message.includes("Unsupported OpenAPI version")) {
        const openApiVersionMatch = validationError.message.match(/Unsupported OpenAPI version: (3\.0\.\d+)/);
        if (openApiVersionMatch && openApiVersionMatch[1] > '3.0.3') {
          console.warn(`Retrying validation: Overriding OpenAPI version from ${parsedSpec.openapi} to 3.0.3 for URL: ${specUrl}`);
          parsedSpec.openapi = '3.0.3';
          versionOverridden = true;
          const specToReValidate = JSON.parse(JSON.stringify(parsedSpec));
          try {
            validatedSpecToReturn = await SwaggerParser.validate(specToReValidate) as OpenAPI.Document;
          } catch (secondValidationError: any) {
            throw new Error(`Failed to validate spec from ${specUrl} even after overriding version to 3.0.3: ${secondValidationError.message}`);
          }
        } else {
          throw validationError; // Re-throw if not the specific unsupported 3.0.x version we handle
        }
      } else {
        throw validationError; // Re-throw other validation errors or if already tried override
      }
    }
    
    rawSpecTextForOutput = YAML.dump(validatedSpecToReturn); 
    
    return NextResponse.json({ specObject: validatedSpecToReturn, rawSpecText: rawSpecTextForOutput, versionOverridden });

  } catch (error: any) {
    console.error(`Error in fetch-spec proxy for URL: ${specUrl || 'Unknown URL provided in request'}. Details:`, error.message, error.stack);
    // Ensure a user-friendly message. Error.message might be too technical or include stack traces from SwaggerParser.
    let friendlyMessage = "An unexpected error occurred while fetching or parsing the specification.";
    if (error.message) {
        if (error.message.includes("Unsupported OpenAPI version")) {
            friendlyMessage = error.message; // This is usually a clear message from SwaggerParser
        } else if (error.message.includes("Failed to validate spec")) {
            friendlyMessage = `The specification from ${specUrl} has validation errors. ${error.message}`;
        } else if (error.message.startsWith("Failed to parse specification") || error.message.startsWith("Request to") || error.message.startsWith("External server")) {
            friendlyMessage = error.message; // These are our custom, more friendly messages
        }
    }
    return NextResponse.json({ error: friendlyMessage, fullError: error.message, stack: error.stack }, { status: 500 });
  }
}
