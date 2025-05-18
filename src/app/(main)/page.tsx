
"use client";

import { OpenApiUploadForm } from "@/components/openapi-upload-form";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const features = [
    {
      title: "Discover & Document",
      description: "Automated API discovery, interactive documentation viewing, and AI-powered spec generation.",
      icon: <Icons.FilePlus2 className="w-8 h-8 text-primary" />,
      links: [
        { href: "/live-api-discovery", label: "Live Discovery" },
        { href: "/api-discovery-scanner", label: "Discovery Scanner" },
        { href: "/documentation", label: "View Docs" },
        { href: "/generate-documentation", label: "Generate Docs" },
      ]
    },
    {
      title: "Analyze & Monitor",
      description: "Deep dive into API health, integration patterns, and predict future behavior with AI.",
      icon: <Icons.Activity className="w-8 h-8 text-primary" />,
      links: [
        { href: "/dashboard", label: "API Dashboard" },
        { href: "/health-monitoring", label: "Health Analysis" },
        { href: "/predictive-monitoring", label: "Predictive Monitoring" },
        { href: "/integration-analysis", label: "Integration Analysis" },
        { href: "/dependency-graph", label: "Dependency Graph" },
      ]
    },
    {
      title: "Govern & Secure",
      description: "Ensure your APIs are secure, compliant, and well-maintained throughout their lifecycle.",
      icon: <Icons.ShieldCheck className="w-8 h-8 text-primary" />,
      links: [
        { href: "/vulnerability-scan", label: "Vulnerability Scan" },
        { href: "/compliance-check", label: "Compliance Check" },
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center">
        <div className="flex justify-center mb-6">
           <Image 
            src="https://placehold.co/120x120.png" // Placeholder for a more sophisticated logo/graphic
            alt="API Harmony Lite Logo" 
            width={100} 
            height={100}
            className="rounded-full shadow-md"
            data-ai-hint="modern tech logo"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
          Welcome to API Harmony Lite
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Your intelligent API orchestration engine. Streamline management, gain powerful insights, and accelerate your API development lifecycle.
        </p>
      </section>

      {/* Get Started - OpenAPI Upload Form */}
      <section>
        <Card className="shadow-xl border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl md:text-3xl flex items-center gap-3 text-primary">
              <Icons.Rocket className="w-7 h-7" /> Get Started
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Import your OpenAPI specification via URL or file upload to begin exploring its capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <OpenApiUploadForm />
          </CardContent>
        </Card>
      </section>

      {/* Key Features Overview */}
      <section className="space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-semibold text-foreground mb-2">Unlock Powerful API Capabilities</h2>
            <p className="text-md text-muted-foreground max-w-xl mx-auto">
                Dive into a suite of tools designed to help you manage, analyze, and secure your APIs effectively.
            </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  {feature.icon}
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
              <CardContent className="mt-auto pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Explore Features:</p>
                <div className="flex flex-wrap gap-2">
                  {feature.links.map(link => (
                    <Button key={link.href} asChild variant="outline" size="sm" className="text-xs">
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Further Call to Action */}
      <section className="text-center py-8 bg-muted/50 rounded-lg shadow-inner">
        <h3 className="text-2xl font-semibold text-foreground mb-4">Ready to Harmonize Your APIs?</h3>
        <p className="text-md text-muted-foreground mb-6 max-w-lg mx-auto">
          If you haven't already, import your API specification above. <br/>
          Then, explore the dashboard, generate documentation, or perform an analysis to see API Harmony Lite in action.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <Icons.LayoutDashboard className="mr-2" /> Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/documentation">
              <Icons.BookOpen className="mr-2" /> View Documentation Tools
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
