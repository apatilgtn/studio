
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DiscoveredApi {
  id: string;
  name: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
  status: "healthy" | "warning" | "critical" | "unknown";
  responseTime: number; // in ms
  security: "high" | "medium" | "low";
  isUndocumented: boolean;
  lastScanned: string;
  issuesFound: number;
  recommendations: string[];
}

const generateMockApis = (count = 100): DiscoveredApi[] => {
  const methods: DiscoveredApi["method"][] = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  const statuses: DiscoveredApi["status"][] = ["healthy", "warning", "critical", "unknown"];
  const securities: DiscoveredApi["security"][] = ["high", "medium", "low"];
  const commonNames = ["User API", "Product Catalog", "Order Service", "Inventory Hub", "Payment Gateway", "Notification Service", "Analytics Engine", "Auth Service", "Geo Lookup", "Data Processor"];
  const commonPaths = ["/users", "/products", "/orders", "/inventory", "/payments", "/notifications", "/analytics", "/auth", "/geo", "/process"];

  return Array.from({ length: count }, (_, i) => {
    const namePart = commonNames[i % commonNames.length];
    const pathPart = commonPaths[i % commonPaths.length];
    const method = methods[i % methods.length];
    const status = statuses[i % statuses.length];
    const security = securities[i % securities.length];
    const isUndocumented = Math.random() < 0.2; // 20% chance of being undocumented
    const issues = status === "critical" ? Math.floor(Math.random() * 5) + 1 : status === "warning" ? Math.floor(Math.random() * 3) : 0;
    
    return {
      id: `api-${i}`,
      name: `${namePart} ${Math.floor(i / commonNames.length) + 1}`,
      endpoint: `/v${Math.ceil(Math.random()*2)}` + pathPart + (Math.random() > 0.5 ? `/{id}`: (Math.random() > 0.7 ? `/${i}` : '')),
      method,
      status,
      responseTime: Math.floor(Math.random() * 500) + 50, // 50-550ms
      security,
      isUndocumented,
      lastScanned: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toLocaleDateString(), // within last 7 days
      issuesFound: issues,
      recommendations: issues > 0 ? [`Implement proper authentication for ${method} ${pathPart}`, "Validate all input parameters thoroughly"] : [],
    };
  });
};


export function APIDiscoveryScannerView() {
  const [discoveredApis, setDiscoveredApis] = useState<DiscoveredApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [issuesDetected, setIssuesDetected] = useState(0);
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  const { toast } = useToast();

  const handleStartScan = async () => {
    setIsLoading(true);
    setScanProgress(0);
    setDiscoveredApis([]);
    setIssuesDetected(0);
    setRecommendationsCount(0);

    // Simulate scanning
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setScanProgress(i);
    }

    const mockData = generateMockApis();
    setDiscoveredApis(mockData);

    const detectedIssues = mockData.filter(api => api.status === 'warning' || api.status === 'critical').length;
    setIssuesDetected(detectedIssues);
    setRecommendationsCount(mockData.reduce((acc, api) => acc + api.recommendations.length, 0));
    
    setIsLoading(false);
    toast({
      title: "API Scan Complete",
      description: `${mockData.length} APIs discovered and analyzed.`,
    });
  };
  
  const handleAnalyzeApi = (apiName: string) => {
    toast({
        title: "Analyzing API...",
        description: `Initiating detailed analysis for ${apiName}. (This is a placeholder action)`,
    });
    // Placeholder for actual analysis logic
  };

  const getStatusColor = (status: DiscoveredApi["status"]) => {
    if (status === "healthy") return "bg-green-500 hover:bg-green-600";
    if (status === "warning") return "bg-yellow-500 hover:bg-yellow-600";
    if (status === "critical") return "bg-red-500 hover:bg-red-600";
    return "bg-gray-400 hover:bg-gray-500";
  };
  
  const getSecurityBadgeVariant = (security: DiscoveredApi["security"]): "default" | "secondary" | "destructive" => {
    if (security === "high") return "default"; // Or a green-like variant if you make one
    if (security === "medium") return "secondary"; // Yellow/orange
    return "destructive"; // Red
  };


  return (
    <div className="space-y-6 p-4 md:p-8 bg-secondary/30 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Icons.Radar className="w-8 h-8 text-primary" />
          API Discovery Scanner
        </h1>
        <p className="text-muted-foreground mt-1">
          Automatically discover, analyze, and monitor APIs across your enterprise.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APIs Discovered</CardTitle>
            <Icons.Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discoveredApis.length}</div>
            <p className="text-xs text-muted-foreground">Total APIs found in the ecosystem</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Undocumented APIs</CardTitle>
            <Icons.Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discoveredApis.filter(api => api.isUndocumented).length}</div>
            <p className="text-xs text-muted-foreground">APIs without formal documentation</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Detected</CardTitle>
            <Icons.AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{issuesDetected}</div>
            <p className="text-xs text-muted-foreground">Potential vulnerabilities & misconfigurations</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <Icons.Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendationsCount}</div>
            <p className="text-xs text-muted-foreground">Actionable insights for improvement</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle className="text-xl">Discovered API Inventory</CardTitle>
                <CardDescription>List of APIs identified during the scan.</CardDescription>
            </div>
          <Button onClick={handleStartScan} disabled={isLoading} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? (
              <Icons.Loader className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Icons.PlayCircle className="mr-2 h-5 w-5" />
            )}
            Start New Scan
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-8 text-center">
              <Progress value={scanProgress} className="w-full h-3 mb-3" />
              <p className="text-sm text-muted-foreground">Scanning for APIs... {scanProgress.toFixed(0)}%</p>
            </div>
          )}
          {!isLoading && discoveredApis.length === 0 && (
            <Alert className="bg-background">
              <Icons.Info className="h-4 w-4" />
              <AlertTitle>No Scan Performed Yet</AlertTitle>
              <AlertDescription>
                Click "Start New Scan" to discover APIs in your environment.
              </AlertDescription>
            </Alert>
          )}
          {!isLoading && discoveredApis.length > 0 && (
            <ScrollArea className="h-[500px] border rounded-md">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[180px]">Name</TableHead>
                    <TableHead className="min-w-[200px]">Endpoint</TableHead>
                    <TableHead className="w-[90px]">Method</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Response Time</TableHead>
                    <TableHead className="w-[90px]">Security</TableHead>
                    <TableHead className="w-[80px] text-center">Undoc'd</TableHead>
                    <TableHead className="w-[140px]">Last Scanned</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discoveredApis.map((api) => (
                    <TableRow key={api.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground">{api.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{api.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`method-${api.method.toLowerCase()}`}>{api.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`${getStatusColor(api.status)} text-white`}
                        >
                            {api.status.charAt(0).toUpperCase() + api.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{api.responseTime} ms</TableCell>
                      <TableCell>
                        <Badge variant={getSecurityBadgeVariant(api.security)} className="capitalize">
                          {api.security}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-center"> {/* Ensured Undoc'd content is also centered */}
                        {api.isUndocumented ? <Icons.AlertTriangle className="w-4 h-4 text-orange-500 inline-block" /> : <Icons.CheckCircle2 className="w-4 h-4 text-green-500 inline-block" />}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{api.lastScanned}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleAnalyzeApi(api.name)}>
                          <Icons.Search className="w-4 h-4 mr-1" /> Analyze
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
        <style jsx global>{`
        .method-get { background-color: hsl(var(--chart-1)/0.1); border-color: hsl(var(--chart-1)); color: hsl(var(--chart-1)); }
        .method-post { background-color: hsl(var(--chart-2)/0.1); border-color: hsl(var(--chart-2)); color: hsl(var(--chart-2));}
        .method-put { background-color: hsl(var(--chart-3)/0.1); border-color: hsl(var(--chart-3)); color: hsl(var(--chart-3));}
        .method-delete { background-color: hsl(var(--destructive)/0.1); border-color: hsl(var(--destructive)); color: hsl(var(--destructive));}
        .method-patch { background-color: hsl(var(--chart-4)/0.1); border-color: hsl(var(--chart-4)); color: hsl(var(--chart-4));}
        .method-options { background-color: hsl(var(--muted)/0.5); border-color: hsl(var(--muted-foreground)); color: hsl(var(--muted-foreground));}
      `}</style>
    </div>
  );
}

