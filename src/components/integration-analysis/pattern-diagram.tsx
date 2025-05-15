
"use client";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";

interface PatternDiagramProps {
  patternName: string;
}

export function PatternDiagram({ patternName }: PatternDiagramProps) {
  const renderDiagram = () => {
    const lowerCasePatternName = patternName.toLowerCase();

    if (lowerCasePatternName.includes("resource-based") || lowerCasePatternName.includes("resource-oriented")) {
      return (
        <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
          <div className="flex items-center space-x-3">
            <Icons.User className="w-10 h-10 text-primary" />
            <Icons.ArrowRightCircle className="w-6 h-6 text-muted-foreground" />
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-1 p-1.5 bg-card rounded shadow-sm">
                <Icons.FileJson className="w-5 h-5 text-accent" />
                <span className="text-xs font-mono">/users</span>
              </div>
              <div className="flex items-center space-x-1 p-1.5 bg-card rounded shadow-sm">
                <Icons.ShoppingCart className="w-5 h-5 text-accent" />
                <span className="text-xs font-mono">/products</span>
              </div>
               <div className="flex items-center space-x-1 p-1.5 bg-card rounded shadow-sm">
                <Icons.BookOpen className="w-5 h-5 text-accent" />
                <span className="text-xs font-mono">/articles</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Clients interact with clearly defined resources (e.g., /users, /products) using standard HTTP methods.
          </p>
        </div>
      );
    }

    if (lowerCasePatternName.includes("api gateway")) {
      return (
        <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
          <div className="flex items-center space-x-3">
            <Icons.User className="w-10 h-10 text-primary" />
            <Icons.ArrowRightCircle className="w-6 h-6 text-muted-foreground" />
            <div className="flex flex-col items-center p-2 border-2 border-dashed border-primary rounded-md bg-primary/10">
                <Icons.Shield className="w-10 h-10 text-primary" />
                <span className="text-xs font-semibold mt-1">API Gateway</span>
            </div>
            <Icons.ArrowRightCircle className="w-6 h-6 text-muted-foreground" />
            <div className="flex flex-col space-y-1">
              <Icons.Server className="w-8 h-8 text-accent" title="Service A" />
              <Icons.Server className="w-8 h-8 text-accent" title="Service B" />
              <Icons.Database className="w-8 h-8 text-accent" title="Database Service"/>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            A single entry point (Gateway) routes requests to appropriate backend microservices.
          </p>
        </div>
      );
    }
    
    if (lowerCasePatternName.includes("cqrs")) {
      return (
        <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
          <div className="flex justify-around w-full items-start">
            <div className="flex flex-col items-center space-y-1">
              <Icons.Edit className="w-8 h-8 text-blue-500" />
              <span className="text-xs font-semibold">Commands</span>
              <Icons.ArrowDown className="w-5 h-5 text-muted-foreground" />
              <Icons.Database className="w-10 h-10 text-accent" />
              <span className="text-xs">Write Model</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Icons.Search className="w-8 h-8 text-green-500" />
              <span className="text-xs font-semibold">Queries</span>
              <Icons.ArrowDown className="w-5 h-5 text-muted-foreground" />
              <Icons.FileText className="w-10 h-10 text-accent" />
              <span className="text-xs">Read Model</span>
            </div>
          </div>
           <p className="text-xs text-muted-foreground text-center pt-2">
            Separate models for updating (Commands) and reading (Queries) data to optimize performance and scalability.
          </p>
        </div>
      );
    }

    if (lowerCasePatternName.includes("content negotiation")) {
      return (
        <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
          <div className="flex items-center space-x-4">
            <Icons.User className="w-10 h-10 text-primary" />
            <div className="flex flex-col items-center">
                <span className="text-xs font-mono bg-card p-1 rounded">Accept: application/json</span>
                 <Icons.ArrowRightCircle className="w-5 h-5 text-muted-foreground my-1" />
            </div>
            <Icons.Server className="w-10 h-10 text-accent" />
             <div className="flex flex-col items-center">
                 <Icons.ArrowLeft className="w-5 h-5 text-muted-foreground my-1" />
                <span className="text-xs font-mono bg-card p-1 rounded">Content-Type: application/json</span>
            </div>
          </div>
           <p className="text-xs text-muted-foreground text-center pt-2">
            Client and server agree on media types (e.g., JSON, XML) for requests and responses.
          </p>
        </div>
      );
    }

    if (lowerCasePatternName.includes("oauth 2.0 authentication") || lowerCasePatternName.includes("oauth2")) {
      return (
        <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
          <div className="flex items-center space-x-3">
            <Icons.User className="w-8 h-8 text-primary" />
            <Icons.ArrowRightCircle className="w-5 h-5 text-muted-foreground" />
            <Icons.KeyRound className="w-8 h-8 text-yellow-500" />
            <span className="text-xs font-semibold">Auth Server</span>
            <Icons.ArrowRightCircle className="w-5 h-5 text-muted-foreground" />
            <Icons.Server className="w-8 h-8 text-accent" />
          </div>
           <p className="text-xs text-muted-foreground text-center pt-2">
            Client obtains an access token from an authorization server to access protected resources.
          </p>
        </div>
      );
    }

    if (lowerCasePatternName.includes("api key authentication")) {
      return (
        <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
          <div className="flex items-center space-x-3">
            <Icons.User className="w-8 h-8 text-primary" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono bg-card p-1 rounded">X-API-Key: *****</span>
              <Icons.ArrowRightCircle className="w-5 h-5 text-muted-foreground my-1" />
            </div>
            <Icons.Server className="w-8 h-8 text-accent" />
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Client includes a pre-shared API key in requests, typically in a header.
          </p>
        </div>
      );
    }
    
    if (lowerCasePatternName.includes("pagination")) {
      return (
        <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
          <div className="flex items-center space-x-3">
            <Icons.Server className="w-10 h-10 text-accent" />
            <div className="flex flex-col space-y-1 items-center">
              <span className="text-xs font-mono bg-card p-1 rounded">/items?page=1&limit=10</span>
              <Icons.List className="w-6 h-6 text-primary" />
              <span className="text-xs text-muted-foreground">Page 1</span>
            </div>
            <div className="flex flex-col space-y-1 items-center">
                <span className="text-xs font-mono bg-card p-1 rounded">/items?page=2&limit=10</span>
              <Icons.List className="w-6 h-6 text-primary" />
              <span className="text-xs text-muted-foreground">Page 2</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Large datasets are broken into smaller chunks (pages) for efficient retrieval.
          </p>
        </div>
      );
    }

    if (lowerCasePatternName.includes("versioning")) {
      return (
        <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
          <div className="flex items-center space-x-4">
            <Icons.Server className="w-10 h-10 text-accent" />
            <div className="flex flex-col space-y-2">
                <Badge variant="outline" className="text-xs">/v1/resource</Badge>
                <Badge variant="secondary" className="text-xs">/v2/resource</Badge>
                <Badge variant="outline" className="text-xs">Accept: application/vnd.myapi.v3+json</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            API versions are managed (e.g., via URL path, header) to allow evolution without breaking clients.
          </p>
        </div>
      );
    }

    if (lowerCasePatternName.includes("rate limiting")) {
      return (
        <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
          <div className="flex items-center space-x-3">
            <Icons.User className="w-8 h-8 text-primary" />
            <Icons.ArrowRightCircle className="w-5 h-5 text-muted-foreground" />
            <Icons.Gauge className="w-8 h-8 text-red-500" />
            <span className="text-xs font-semibold">Rate Limiter</span>
            <Icons.ArrowRightCircle className="w-5 h-5 text-muted-foreground" />
            <Icons.Server className="w-8 h-8 text-accent" />
          </div>
           <p className="text-xs text-muted-foreground text-center pt-2">
            Controls the number of requests a client can make in a given time period to prevent abuse.
          </p>
        </div>
      );
    }
    
    if (lowerCasePatternName.includes("idempotency")) {
        return (
          <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-secondary/30 shadow-inner">
            <div className="flex items-center space-x-3">
              <Icons.User className="w-8 h-8 text-primary" />
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono bg-card p-1 rounded">POST /payments</span>
                <span className="text-xxs font-mono bg-card p-0.5 rounded mt-0.5">Idempotency-Key: abc-123</span>
                <Icons.ArrowRightCircle className="w-5 h-5 text-muted-foreground my-1" />
              </div>
              <Icons.Server className="w-8 h-8 text-accent" />
               <div className="flex flex-col items-center">
                 <Icons.ArrowLeft className="w-5 h-5 text-muted-foreground my-1" />
                <span className="text-xs font-mono bg-card p-1 rounded">201 Created (or 200 OK)</span>
              </div>
            </div>
             <p className="text-xs text-muted-foreground text-center pt-2">
              Ensures that making the same request multiple times has the same effect as making it once.
            </p>
          </div>
        );
      }


    // Default placeholder if no specific diagram matches
    return (
      <div className="flex flex-col items-center justify-center h-[200px] border rounded-lg bg-secondary/30 shadow-inner p-4">
        <Icons.ImageIcon className="w-16 h-16 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground mt-2">Illustrative diagram for: {patternName}</p>
        <p className="text-xs text-muted-foreground">(Conceptual representation)</p>
      </div>
    );
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-2 text-center text-foreground">
        Illustrative Diagram
      </h4>
      {renderDiagram()}
       <style jsx global>{`
        .text-xxs { font-size: 0.6rem; line-height: 0.8rem; }
      `}</style>
    </div>
  );
}
