
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useOpenApiStore } from "@/stores/openapi-store";
import { integrationPatternAnalysis, type IntegrationPatternAnalysisOutput } from "@/ai/flows/integration-pattern-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OpenApiUploadForm } from "@/components/openapi-upload-form";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";


interface SelectedItem {
  name: string;
  description: string;
  examples?: string[];
  impact?: string; // For anti-patterns
  rationale?: string; // For recommendations
  priority?: "High" | "Medium" | "Low"; // For recommendations
  diagram?: string; 
  diagramHint?: string;
  type: 'pattern' | 'anti-pattern' | 'recommendation';
}

const FeatureCard = ({ title, description, icon, link, linkText, action, features }: { title: string, description: string, icon: React.ReactNode, link?: string, linkText?: string, action?: React.ReactNode, features?: string[] }) => (
  <Card className="flex flex-col shadow-sm hover:shadow-lg transition-shadow bg-card h-full">
    <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
      <div className="p-2 bg-primary/10 rounded-lg text-primary">
        {icon}
      </div>
      <div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="flex-grow space-y-2">
      <p className="text-sm text-muted-foreground">{description}</p>
      {features && features.length > 0 && (
        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-2">
          {features.map((feature, index) => <li key={index}>{feature}</li>)}
        </ul>
      )}
    </CardContent>
    {(link && linkText || action) && (
      <CardFooter className="mt-auto pt-4">
        {action}
        {link && linkText && (
          <Button asChild className="w-full" variant="outline">
            <Link href={link}><Icons.ArrowRightCircle className="mr-2 h-4 w-4"/>{linkText}</Link>
          </Button>
        )}
      </CardFooter>
    )}
  </Card>
);


export function IntegrationAnalysisView() {
  const { spec, rawSpec, fileName, error: specError, isLoading: isStoreLoading } = useOpenApiStore();
  const [analysisResults, setAnalysisResults] = useState<IntegrationPatternAnalysisOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ai-feature-suite");

  const handleSpecLoad = () => {
    setAnalysisResults(null);
    setSelectedItem(null);
    setAnalysisError(null);
    // If switching to pattern intelligence and a spec is loaded, auto-analyze
    if (activeTab === 'pattern-intelligence' && rawSpec && !isStoreLoading) {
      handleAnalysis();
    }
  };
  
  useEffect(() => {
    if (activeTab === 'pattern-intelligence' && rawSpec && !analysisResults && !isLoadingAnalysis && !analysisError && !isStoreLoading) {
      handleAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, rawSpec, analysisResults, isLoadingAnalysis, analysisError, isStoreLoading]);


  const handleAnalysis = async () => {
    if (!rawSpec) {
      toast({
        title: "No Specification Loaded",
        description: "Please load an OpenAPI specification first to run integration analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setSelectedItem(null); // Reset selected item on new analysis

    try {
      const results = await integrationPatternAnalysis({ openApiSpec: rawSpec });
      setAnalysisResults(results);
      if (results.summary) {
         toast({
            title: "Analysis Complete",
            description: results.summary,
        });
      } else {
        toast({
            title: "Analysis Complete",
            description: `Integration pattern analysis for "${fileName}" finished.`,
        });
      }
     
      // Auto-select first item if available
      if (results.identifiedPatterns && results.identifiedPatterns.length > 0) {
        handleItemSelect(results.identifiedPatterns[0], 'pattern');
      } else if (results.antiPatterns && results.antiPatterns.length > 0) {
        handleItemSelect(results.antiPatterns[0], 'anti-pattern');
      } else if (results.recommendations && results.recommendations.length > 0) {
        handleItemSelect(results.recommendations[0], 'recommendation');
      }

    } catch (err: any) {
      console.error("Integration pattern analysis error:", err);
      const errorMessage = err.message || "An unexpected error occurred during the analysis.";
      setAnalysisError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };
  
 const handleItemSelect = (item: any, type: SelectedItem['type']) => {
    let name: string;
    let description: string;
    let diagramHint = "integration diagram";

    switch (type) {
      case 'pattern':
        name = item.name;
        description = item.description;
        if (name.toLowerCase().includes("point-to-point")) diagramHint = "connection points";
        else if (name.toLowerCase().includes("api gateway")) diagramHint = "gateway architecture";
        else if (name.toLowerCase().includes("cqrs")) diagramHint = "command query";
        break;
      case 'anti-pattern':
        name = item.name;
        description = item.description;
        break;
      case 'recommendation':
        name = item.recommendation;
        description = item.rationale;
        break;
      default:
        name = "Details";
        description = "N/A";
    }

    setSelectedItem({
      name: name,
      description: description,
      examples: item.examples,
      impact: item.impact,
      rationale: item.rationale,
      priority: item.priority,
      diagram: `https://placehold.co/600x300.png`, // Generic placeholder
      diagramHint: diagramHint,
      type: type
    });
  };


  return (
    <div className="container mx-auto space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icons.BrainCircuit className="w-6 h-6 text-primary" /> API Integration Intelligence Hub
          </CardTitle>
          <CardDescription>
            Leverage AI to analyze patterns, discover APIs, monitor health, ensure compliance, and more.
            {fileName && !specError && <span className="block mt-1 text-xs text-muted-foreground">Active spec: <strong>{fileName}</strong></span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!spec && !specError && !isStoreLoading && (
            <>
              <Alert className="mb-6">
                <Icons.Info className="h-4 w-4" />
                <AlertTitle>Load Specification to Start</AlertTitle>
                <AlertDescription>
                  Import an OpenAPI spec to enable integration analysis and other AI features.
                </AlertDescription>
              </Alert>
              <OpenApiUploadForm onSpecLoaded={handleSpecLoad} />
            </>
          )}
          {isStoreLoading && !specError && (
            <div className="flex flex-col items-center justify-center py-10">
              <Icons.Loader className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading specification...</p>
            </div>
          )}
          {specError && (
             <Alert variant="destructive" className="mb-6">
                <Icons.AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error with Specification</AlertTitle>
                <AlertDescription>
                  There was an error: {specError}. Please try importing again.
                  <div className="mt-4"><OpenApiUploadForm onSpecLoaded={handleSpecLoad} /></div>
                </AlertDescription>
            </Alert>
          )}
          {spec && !specError && !isStoreLoading && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="ai-feature-suite">
                  <Icons.BrainCircuit className="w-4 h-4 mr-2"/>AI Feature Suite
                </TabsTrigger>
                <TabsTrigger value="pattern-intelligence">
                  <Icons.Palette className="w-4 h-4 mr-2"/>Pattern Intelligence
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ai-feature-suite">
                <div className="space-y-6">
                  <Card className="bg-card border-primary/20 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl"><Icons.Search className="w-6 h-6 text-primary"/>Automated API Discovery & Documentation</CardTitle>
                      <CardDescription>Discover, document, and visualize your API landscape.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FeatureCard
                        title="Live API Discovery"
                        description="Simulated multi-method scanning to identify API endpoints across systems."
                        icon={<Icons.Radar className="w-8 h-8"/>}
                        features={[
                          "Common path scanning",
                          "Response analysis hints",
                          "Confidence scoring (simulated)"
                        ]}
                        link="/live-api-discovery"
                        linkText="Explore Discovery"
                      />
                      <FeatureCard
                        title="AI Document Generation"
                        description="Automatically generate OpenAPI specifications from descriptions or partial specs."
                        icon={<Icons.FilePlus2 className="w-8 h-8"/>}
                        features={[
                          "Natural language to OpenAPI",
                          "Partial spec enhancement",
                          "YAML output with confidence"
                        ]}
                        link="/generate-documentation"
                        linkText="Generate Docs"
                      />
                      <FeatureCard
                        title="Dependency Graph"
                        description="Interactive visual relationship mapping for your API schemas and operations."
                        icon={<Icons.GitFork className="w-8 h-8"/>}
                        features={[
                          "Schema usage by operations",
                          "Inter-schema references",
                          "Supports OpenAPI v2 & v3"
                        ]}
                        link="/dependency-graph"
                        linkText="View Dependencies"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-primary/20 shadow-sm">
                     <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl"><Icons.Palette className="w-6 h-6 text-primary"/>Integration Pattern Analysis</CardTitle>
                      <CardDescription>Deep learning-based pattern recognition and best practice recommendations for your API.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <FeatureCard
                        title="AI Pattern Analysis"
                        description="Analyze your OpenAPI spec for integration patterns, anti-patterns, and get improvement suggestions."
                        icon={<Icons.Lightbulb className="w-8 h-8"/>}
                        features={[
                            "Identifies common patterns (e.g., API Gateway, CQRS hints)",
                            "Detects anti-patterns (e.g., chatty APIs)",
                            "Provides actionable recommendations"
                        ]}
                        action={<Button variant="outline" className="w-full" onClick={() => { setActiveTab('pattern-intelligence'); if (!analysisResults && rawSpec) handleAnalysis(); }}>Analyze Current Spec <Icons.ArrowRightCircle className="ml-2 h-4 w-4"/></Button>}
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-primary/20 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl"><Icons.HeartPulse className="w-6 h-6 text-primary"/>Comprehensive API Health Monitoring</CardTitle>
                      <CardDescription>Real-time metrics, anomaly detection, and root cause analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <FeatureCard
                        title="Health & Anomaly Detection"
                        description="Analyze API logs/metrics for performance issues and anomalies."
                        icon={<Icons.Activity className="w-8 h-8"/>}
                        features={[
                            "Log & metrics data input",
                            "ML-powered anomaly detection",
                            "Root cause suggestions"
                        ]}
                        link="/health-monitoring"
                        linkText="Monitor Health"
                      />
                      <FeatureCard
                        title="Predictive Monitoring"
                        description="Forecast future API behavior and potential failures based on historical trends."
                        icon={<Icons.TrendingUp className="w-8 h-8"/>}
                        features={[
                            "Time-series data analysis",
                            "Future state predictions",
                            "Preventive recommendations"
                        ]}
                        link="/predictive-monitoring"
                        linkText="Predict Trends"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-primary/20 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl"><Icons.Gavel className="w-6 h-6 text-primary"/>Governance & Compliance Management</CardTitle>
                      <CardDescription>Ensure security, compliance, and manage the API lifecycle.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <FeatureCard
                        title="Vulnerability Scanning"
                        description="AI-driven security vulnerability scanning for APIs based on OpenAPI specs."
                        icon={<Icons.ShieldAlert className="w-8 h-8"/>}
                        features={[
                            "Identifies common security issues",
                            "Provides actionable recommendations"
                        ]}
                        link="/vulnerability-scan"
                        linkText="Scan for Vulnerabilities"
                      />
                      <FeatureCard
                        title="Compliance Checks"
                        description="Audit your APIs against predefined compliance profiles (e.g., PII, Financial)."
                        icon={<Icons.ShieldCheck className="w-8 h-8"/>}
                        features={[
                            "Checks against GENERAL, PII, FINANCIAL profiles",
                            "Detailed rule-based analysis"
                        ]}
                        link="/compliance-check"
                        linkText="Check Compliance"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="pattern-intelligence">
                {isLoadingAnalysis && (
                  <Card className="mt-6 shadow-lg">
                    <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Analyzing Integration Patterns...</CardTitle></CardHeader>
                    <CardContent className="text-center py-6">
                        <Progress value={undefined} className="w-1/2 mx-auto mb-3" />
                        <p className="text-muted-foreground">AI is evaluating the design of <strong>{fileName}</strong>. This may take a moment.</p>
                    </CardContent>
                  </Card>
                )}
                {analysisError && !isLoadingAnalysis && (
                  <Alert variant="destructive" className="mt-6">
                    <Icons.AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Analysis Error</AlertTitle>
                    <AlertDescription>{analysisError}</AlertDescription>
                    <Button variant="outline" size="sm" onClick={handleAnalysis} className="mt-3">Retry Analysis</Button>
                  </Alert>
                )}
                
                {!analysisResults && !isLoadingAnalysis && !analysisError && (
                  <div className="mt-4 text-center border p-8 rounded-lg bg-muted/20">
                    <Icons.Palette className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Pattern Intelligence</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Analyze <strong>{fileName}</strong> to identify integration patterns, anti-patterns, and get improvement suggestions.
                    </p>
                    <Button onClick={handleAnalysis} disabled={isLoadingAnalysis || !rawSpec} size="lg">
                      {isLoadingAnalysis ? (
                        <Icons.Loader className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Icons.Zap className="mr-2 h-5 w-5" />
                      )}
                      Start AI Integration Analysis
                    </Button>
                  </div>
                )}

                {analysisResults && !isLoadingAnalysis && !analysisError && (
                  <Card className="mt-4 border-0 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle>Pattern Intelligence Report for {fileName}</CardTitle>
                        <CardDescription>{analysisResults.summary || "AI-powered insights into API integration design."}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 space-y-4">
                        <div>
                          <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><Icons.CheckCircle2 className="w-4 h-4 text-green-600" /> Identified Patterns</h3>
                          <ScrollArea className="h-[180px] border rounded-md p-2 bg-muted/30">
                            {analysisResults.identifiedPatterns?.length > 0 ? analysisResults.identifiedPatterns.map((p, i) => (
                              <Button key={`ip-${i}`} variant={selectedItem?.name === p.name && selectedItem.type === 'pattern' ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-left mb-1 h-auto py-1.5 text-xs" onClick={() => handleItemSelect(p, 'pattern')}>
                                <span className="truncate block">{p.name}</span>
                              </Button>
                            )) : <p className="text-xs text-muted-foreground p-2">No distinct patterns identified.</p>}
                          </ScrollArea>
                        </div>
                        <div>
                          <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><Icons.AlertTriangle className="w-4 h-4 text-orange-500" /> Potential Anti-Patterns</h3>
                            <ScrollArea className="h-[180px] border rounded-md p-2 bg-muted/30">
                            {analysisResults.antiPatterns?.length > 0 ? analysisResults.antiPatterns.map((ap, i) => (
                              <Button key={`ap-${i}`} variant={selectedItem?.name === ap.name && selectedItem.type === 'anti-pattern' ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-left mb-1 h-auto py-1.5 text-xs" onClick={() => handleItemSelect(ap, 'anti-pattern')}>
                                <span className="truncate block">{ap.name}</span>
                              </Button>
                            )) : <p className="text-xs text-muted-foreground p-2">No anti-patterns identified.</p>}
                          </ScrollArea>
                        </div>
                          <div>
                          <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><Icons.Settings className="w-4 h-4 text-blue-500" /> Recommendations</h3>
                            <ScrollArea className="h-[180px] border rounded-md p-2 bg-muted/30">
                            {analysisResults.recommendations?.length > 0 ? analysisResults.recommendations.map((r, i) => (
                              <Button key={`rec-${i}`} variant={selectedItem?.name === r.recommendation && selectedItem.type === 'recommendation' ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-left mb-1 h-auto py-1.5 text-xs" onClick={() => handleItemSelect(r, 'recommendation')}>
                                <span className="truncate block">{r.recommendation}</span>
                                {r.priority && <Badge variant={r.priority === "High" ? "destructive" : r.priority === "Medium" ? "secondary" : "outline"} className="ml-auto text-xxs px-1">{r.priority}</Badge>}
                              </Button>
                            )) : <p className="text-xs text-muted-foreground p-2">No specific recommendations.</p>}
                          </ScrollArea>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        {selectedItem ? (
                          <Card className="shadow-inner h-full">
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2 text-lg">
                                {selectedItem.type === 'pattern' && <Icons.CheckCircle2 className="w-5 h-5 text-green-600"/>}
                                {selectedItem.type === 'anti-pattern' && <Icons.AlertTriangle className="w-5 h-5 text-orange-500"/>}
                                {selectedItem.type === 'recommendation' && <Icons.Settings className="w-5 h-5 text-blue-500"/>}
                                {selectedItem.name}
                              </CardTitle>
                              <CardDescription className="capitalize text-xs">
                                {selectedItem.type}
                                {selectedItem.type === 'anti-pattern' && selectedItem.impact && <span className="block mt-1">Impact: {selectedItem.impact}</span>}
                                {selectedItem.type === 'recommendation' && selectedItem.priority && <Badge variant={selectedItem.priority === "High" ? "destructive" : selectedItem.priority === "Medium" ? "secondary" : "outline"} className="ml-2 text-xxs px-1.5 py-0.5">{selectedItem.priority} Priority</Badge>}
                                </CardDescription>
                            </CardHeader>
                            <ScrollArea className="h-[420px]"> {/* Fixed height for scroll area */}
                              <CardContent className="pt-0">
                                <p className="text-sm mb-3">{selectedItem.description}</p>
                                {selectedItem.rationale && selectedItem.type === 'recommendation' && (
                                     <p className="text-sm mb-3"><strong>Rationale:</strong> {selectedItem.rationale}</p>
                                )}
                                {selectedItem.examples && selectedItem.examples.length > 0 && (
                                  <div className="mb-3">
                                    <h4 className="text-xs font-semibold mb-1 text-muted-foreground">Examples in Specification:</h4>
                                    <ul className="list-disc list-inside pl-2 space-y-1 text-xs text-muted-foreground">
                                      {selectedItem.examples.map((ex, i) => <li key={`ex-${i}`} className="font-mono">{ex}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {selectedItem.type === 'pattern' && selectedItem.diagram && (
                                  <div className="mt-4 border rounded-md p-2 bg-muted/20">
                                      <h4 className="text-sm font-semibold mb-2 text-center">Illustrative Diagram</h4>
                                    <Image src={selectedItem.diagram} alt={`${selectedItem.name} Diagram`} width={600} height={300} className="rounded-md object-contain mx-auto" data-ai-hint={selectedItem.diagramHint || "integration diagram"}/>
                                    <p className="text-xs text-muted-foreground text-center mt-1">Note: This is a placeholder diagram.</p>
                                  </div>
                                )}
                              </CardContent>
                            </ScrollArea>
                          </Card>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground p-8 border rounded-md bg-muted/20">
                            <p>Select an item from the left to view details, or run analysis if no results are shown.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                     <CardFooter className="pt-4">
                       <Button onClick={handleAnalysis} variant="outline" className="w-full" disabled={isLoadingAnalysis || !rawSpec}>
                          <Icons.RefreshCw className="mr-2 h-4 w-4" /> Re-analyze Current Specification
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      <style jsx global>{`
        .text-xxs { font-size: 0.65rem; line-height: 0.85rem; }
      `}</style>
    </div>
  );
}

