
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

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
  issuesFound: number; // Derived from status for mock
  recommendations: string[]; // Mock recommendations
}

interface AnalysisIssue {
  id: string;
  type: "Security" | "Performance" | "Documentation" | "Reliability" | "Other";
  severity: "High" | "Medium" | "Low";
  description: string;
  path?: string; // e.g. specific endpoint or schema
}

interface AnalysisRecommendation {
  id: string;
  recommendation: string;
  priority: "High" | "Medium" | "Low";
  benefit: string; // e.g., "Improved Security", "Reduced Latency"
}

interface ApiAnalysisDetails {
  overallHealth: "Good" | "Fair" | "Poor";
  keyObservations: string[];
  issues: AnalysisIssue[];
  recommendations: AnalysisRecommendation[];
  performanceSnapshot: {
    avgResponseTime: string;
    errorRate: string;
    throughput: string;
  };
  securityAssessment: {
    authentication: string;
    authorization: string;
    dataEncryption: string;
  };
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
    const isUndocumented = Math.random() < 0.2;
    const issues = status === "critical" ? Math.floor(Math.random() * 3) + 2 : status === "warning" ? Math.floor(Math.random() * 2) + 1 : 0;
    
    return {
      id: `api-${i}`,
      name: `${namePart} ${Math.floor(i / commonNames.length) + 1}`,
      endpoint: `/v${Math.ceil(Math.random()*2)}` + pathPart + (Math.random() > 0.5 ? `/{id}`: (Math.random() > 0.7 ? `/${i}` : '')),
      method,
      status,
      responseTime: Math.floor(Math.random() * 500) + 50,
      security,
      isUndocumented,
      lastScanned: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toLocaleDateString(),
      issuesFound: issues,
      recommendations: issues > 0 ? [`Implement proper authentication for ${method} ${pathPart}`, "Validate all input parameters thoroughly"] : ["Maintain comprehensive API documentation"],
    };
  });
};

const generateMockAnalysisDetails = (api: DiscoveredApi): ApiAnalysisDetails => {
  const details: ApiAnalysisDetails = {
    overallHealth: "Good",
    keyObservations: [
      "API endpoint is responsive.",
      "Utilizes standard HTTP methods.",
      "Traffic patterns appear nominal."
    ],
    issues: [],
    recommendations: [
      { id: "rec-1", recommendation: "Regularly review API logs for unusual activity.", priority: "Medium", benefit: "Proactive Threat Detection" },
      { id: "rec-2", recommendation: "Ensure API documentation is kept up-to-date with any changes.", priority: "Medium", benefit: "Improved Developer Experience" }
    ],
    performanceSnapshot: {
      avgResponseTime: `${api.responseTime}ms`,
      errorRate: `${(Math.random() * 2).toFixed(1)}%`,
      throughput: `${Math.floor(Math.random() * 500 + 100)} rpm`,
    },
    securityAssessment: {
      authentication: "API Key in Header (Assumed)",
      authorization: "Role-based access control not explicitly defined in scan.",
      dataEncryption: "HTTPS enforced (Assumed)",
    },
  };

  if (api.status === "critical") {
    details.overallHealth = "Poor";
    details.keyObservations.push("Significant issues detected requiring immediate attention.");
    details.issues.push(
      { id: "issue-c1", type: "Security", severity: "High", description: `Endpoint ${api.method} ${api.endpoint} appears to lack robust authentication.`, path: api.endpoint },
      { id: "issue-c2", type: "Performance", severity: "High", description: `High latency observed for multiple requests to ${api.endpoint}.`, path: api.endpoint }
    );
    if(api.isUndocumented) details.issues.push({ id: "issue-c3", type: "Documentation", severity: "Medium", description: "API is undocumented, increasing risk of misuse." });
    details.recommendations.unshift({ id: "rec-c1", recommendation: "Implement strong authentication (e.g., OAuth 2.0) immediately.", priority: "High", benefit: "Critical Security Enhancement" });
  } else if (api.status === "warning") {
    details.overallHealth = "Fair";
    details.keyObservations.push("Some potential areas for improvement noted.");
    details.issues.push({ id: "issue-w1", type: "Performance", severity: "Medium", description: `Response times for ${api.method} ${api.endpoint} are occasionally high.`, path: api.endpoint });
    if(api.isUndocumented) details.issues.push({ id: "issue-w2", type: "Documentation", severity: "Low", description: "API is undocumented." });
    details.recommendations.unshift({ id: "rec-w1", recommendation: "Investigate and optimize performance of the identified slow operations.", priority: "Medium", benefit: "Improved User Experience" });
  }

  if (api.security === "low") {
    details.issues.push({ id: "issue-s1", type: "Security", severity: "High", description: "Low security posture detected. Review authentication and authorization mechanisms.", path: api.endpoint });
    details.securityAssessment.authentication = "Potentially weak or missing authentication.";
  } else if (api.security === "medium") {
     details.issues.push({ id: "issue-s2", type: "Security", severity: "Medium", description: "Standard security measures seem to be in place, but a deeper review is recommended.", path: api.endpoint });
  }


  return details;
};


export function APIDiscoveryScannerView() {
  const [discoveredApis, setDiscoveredApis] = useState<DiscoveredApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [issuesDetected, setIssuesDetected] = useState(0);
  const [recommendationsCount, setRecommendationsCount] = useState(0); // This will be mock
  const { toast } = useToast();

  const [selectedApiForAnalysis, setSelectedApiForAnalysis] = useState<DiscoveredApi | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const currentAnalysisDetails = selectedApiForAnalysis ? generateMockAnalysisDetails(selectedApiForAnalysis) : null;


  const handleStartScan = async () => {
    setIsLoading(true);
    setScanProgress(0);
    setDiscoveredApis([]);
    setIssuesDetected(0);
    setRecommendationsCount(0);

    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setScanProgress(i);
    }

    const mockData = generateMockApis();
    setDiscoveredApis(mockData);

    const detectedIssues = mockData.reduce((acc, api) => acc + api.issuesFound, 0);
    setIssuesDetected(detectedIssues);
    // For mock recommendations, let's say each issue has 1-2 recommendations.
    setRecommendationsCount(Math.floor(detectedIssues * 1.5)); 
    
    setIsLoading(false);
    toast({
      title: "API Scan Complete",
      description: `${mockData.length} APIs discovered and analyzed. ${detectedIssues} potential issues found.`,
    });
  };
  
  const handleAnalyzeApi = (api: DiscoveredApi) => {
    setSelectedApiForAnalysis(api);
    setIsAnalysisModalOpen(true);
  };

  const getStatusColor = (status: DiscoveredApi["status"]) => {
    if (status === "healthy") return "bg-green-500 hover:bg-green-600";
    if (status === "warning") return "bg-yellow-500 hover:bg-yellow-600";
    if (status === "critical") return "bg-red-500 hover:bg-red-600";
    return "bg-gray-400 hover:bg-gray-500";
  };
  
  const getSecurityBadgeVariant = (security: DiscoveredApi["security"]): "default" | "secondary" | "destructive" => {
    if (security === "high") return "default"; 
    if (security === "medium") return "secondary"; 
    return "destructive"; 
  };

  const getIssueSeverityBadge = (severity: AnalysisIssue["severity"]) => {
    if (severity === "High") return <Badge variant="destructive" className="text-xs">{severity}</Badge>;
    if (severity === "Medium") return <Badge variant="secondary" className="text-xs bg-orange-500 text-white hover:bg-orange-600">{severity}</Badge>;
    return <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">{severity}</Badge>;
  }

  const getRecommendationPriorityBadge = (priority: AnalysisRecommendation["priority"]) => {
     if (priority === "High") return <Badge variant="destructive" className="text-xs">{priority}</Badge>;
    if (priority === "Medium") return <Badge variant="secondary" className="text-xs bg-blue-500 text-white hover:bg-blue-600">{priority}</Badge>;
    return <Badge variant="outline" className="text-xs border-gray-500 text-gray-600">{priority}</Badge>;
  }


  return (
    <div className="space-y-6 p-4 md:p-8 bg-secondary/30 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Icons.Radar className="w-8 h-8 text-primary" />
          API Discovery Scanner
        </h1>
        <p className="text-muted-foreground mt-1">
          Automatically discover, analyze, and monitor APIs across your enterprise. (Simulated)
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="shadow-lg bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APIs Discovered</CardTitle>
            <Icons.Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discoveredApis.length}</div>
            <p className="text-xs text-muted-foreground">Total APIs found in the ecosystem</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Undocumented APIs</CardTitle>
            <Icons.Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discoveredApis.filter(api => api.isUndocumented).length}</div>
            <p className="text-xs text-muted-foreground">APIs without formal documentation</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Detected</CardTitle>
            <Icons.AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{issuesDetected}</div>
            <p className="text-xs text-muted-foreground">Potential vulnerabilities & misconfigs</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg bg-card">
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
      
      <Card className="shadow-xl bg-card">
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
                        <Badge variant="outline" className={`text-xs method-badge-${api.method.toLowerCase()}`}>{api.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`text-xs ${getStatusColor(api.status)} text-white`}
                        >
                            {api.status.charAt(0).toUpperCase() + api.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{api.responseTime} ms</TableCell>
                      <TableCell>
                        <Badge variant={getSecurityBadgeVariant(api.security)} className="capitalize text-xs">
                          {api.security}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-center">
                        {api.isUndocumented ? <Icons.AlertTriangle className="w-4 h-4 text-orange-500 inline-block" /> : <Icons.CheckCircle2 className="w-4 h-4 text-green-500 inline-block" />}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{api.lastScanned}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleAnalyzeApi(api)}>
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

      {selectedApiForAnalysis && currentAnalysisDetails && (
        <AlertDialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl flex items-center gap-2">
                <Icons.ClipboardCheck className="w-6 h-6 text-primary" /> Analysis Report: {selectedApiForAnalysis.name}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Detailed (simulated) analysis for {selectedApiForAnalysis.method} <code>{selectedApiForAnalysis.endpoint}</code>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4 text-sm my-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Overall Health: <Badge variant={currentAnalysisDetails.overallHealth === 'Good' ? 'default' : currentAnalysisDetails.overallHealth === 'Fair' ? 'secondary' : 'destructive' } className="ml-2">{currentAnalysisDetails.overallHealth}</Badge></CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">Based on simulated scan data.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2"><Icons.Eye className="w-4 h-4"/>Key Observations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                {currentAnalysisDetails.keyObservations.map((obs, i) => <li key={`obs-${i}`}>{obs}</li>)}
                            </ul>
                        </CardContent>
                    </Card>

                    {currentAnalysisDetails.issues.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2"><Icons.AlertTriangle className="w-4 h-4 text-destructive"/>Identified Issues ({currentAnalysisDetails.issues.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {currentAnalysisDetails.issues.map(issue => (
                                    <div key={issue.id} className="p-2 border rounded-md bg-muted/50 text-xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium">{issue.description}</span>
                                            {getIssueSeverityBadge(issue.severity)}
                                        </div>
                                        <Badge variant="outline" className="text-xs">{issue.type}</Badge>
                                        {issue.path && <p className="text-xs text-muted-foreground mt-1">Path: <code>{issue.path}</code></p>}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {currentAnalysisDetails.recommendations.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2"><Icons.Wrench className="w-4 h-4 text-blue-500"/>Recommendations ({currentAnalysisDetails.recommendations.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                 {currentAnalysisDetails.recommendations.map(rec => (
                                    <div key={rec.id} className="p-2 border rounded-md bg-muted/50 text-xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium">{rec.recommendation}</span>
                                            {getRecommendationPriorityBadge(rec.priority)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Benefit: {rec.benefit}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                    <Separator />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                         <Card className="p-3">
                             <h4 className="font-semibold mb-1">Performance Snapshot</h4>
                             <p>Avg. Response Time: {currentAnalysisDetails.performanceSnapshot.avgResponseTime}</p>
                             <p>Error Rate: {currentAnalysisDetails.performanceSnapshot.errorRate}</p>
                             <p>Throughput: {currentAnalysisDetails.performanceSnapshot.throughput}</p>
                         </Card>
                         <Card className="p-3">
                             <h4 className="font-semibold mb-1">Security Assessment</h4>
                             <p>Authentication: {currentAnalysisDetails.securityAssessment.authentication}</p>
                             <p>Authorization: {currentAnalysisDetails.securityAssessment.authorization}</p>
                             <p>Data Encryption: {currentAnalysisDetails.securityAssessment.dataEncryption}</p>
                         </Card>
                     </div>

                </div>
            </ScrollArea>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsAnalysisModalOpen(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

        <style jsx global>{`
        .method-badge-get { background-color: hsl(var(--chart-1)/0.1); border-color: hsl(var(--chart-1)); color: hsl(var(--chart-1)); }
        .method-badge-post { background-color: hsl(var(--chart-2)/0.1); border-color: hsl(var(--chart-2)); color: hsl(var(--chart-2));}
        .method-badge-put { background-color: hsl(var(--chart-3)/0.1); border-color: hsl(var(--chart-3)); color: hsl(var(--chart-3));}
        .method-badge-delete { background-color: hsl(var(--destructive)/0.1); border-color: hsl(var(--destructive)); color: hsl(var(--destructive));}
        .method-badge-patch { background-color: hsl(var(--chart-4)/0.1); border-color: hsl(var(--chart-4)); color: hsl(var(--chart-4));}
        .method-badge-options { background-color: hsl(var(--muted)/0.5); border-color: hsl(var(--muted-foreground)); color: hsl(var(--muted-foreground));}
      `}</style>
    </div>
  );
}

