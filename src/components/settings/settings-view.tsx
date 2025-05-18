
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export function SettingsView() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleSaveChanges = () => {
    console.log("Settings saved (simulated)");
  };

  if (!mounted) {
    return null; // or a loading skeleton
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
            <Icons.Settings className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            Application Settings
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Manage your API Harmony Lite preferences and configurations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* General Settings Section */}
          <section>
            <h3 className="text-lg font-medium mb-3 text-foreground">General</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <Label htmlFor="workspaceName" className="text-sm">Workspace Name</Label>
                <Input id="workspaceName" defaultValue="My API Workspace" className="max-w-sm" />
              </div>
            </div>
          </section>

          <Separator />

          {/* Appearance Settings Section */}
          <section>
            <h3 className="text-lg font-medium mb-3 text-foreground">Appearance</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <Label htmlFor="theme" className="text-sm">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Icons.Sun className="w-4 h-4" /> Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                       <div className="flex items-center gap-2">
                        <Icons.Moon className="w-4 h-4" /> Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                       <div className="flex items-center gap-2">
                        <Icons.Laptop className="w-4 h-4" /> System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <p className="text-xs text-muted-foreground">
                  Current theme: {resolvedTheme && resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1)}
                </p>
            </div>
          </section>

          <Separator />

          {/* AI Settings Section */}
          <section>
            <h3 className="text-lg font-medium mb-3 text-foreground">AI Configuration</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <Label htmlFor="aiModel" className="text-sm">Default AI Model</Label>
                <Input id="aiModel" defaultValue="Gemini 2.0 Flash (Simulated)" disabled className="max-w-sm" />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <Label htmlFor="apiKey" className="text-sm">AI Provider API Key</Label>
                <Input id="apiKey" type="password" placeholder="••••••••••••••••••••••" disabled className="max-w-sm" />
              </div>
              <p className="text-xs text-muted-foreground">
                Note: AI settings are illustrative. API key management would be handled securely in a production environment.
              </p>
            </div>
          </section>
          
          <Separator />

          {/* Data Management Section */}
           <section>
            <h3 className="text-lg font-medium mb-3 text-foreground">Data Management</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                <Label htmlFor="clearLocalData" className="text-sm flex flex-col space-y-1">
                    <span>Clear Local Data</span>
                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                        Clears all imported API specifications and cached data from your browser's local storage.
                    </span>
                </Label>
                <Button variant="destructive" size="sm" onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.localStorage.clear();
                    alert("All local data cleared. Please reload the application.");
                    // Potentially trigger a store reset if needed for Zustand stores
                    // useOpenApiStore.getState().clear();
                    // useAuthStore.getState().logout(); // This might also clear auth
                  }
                }}
                >
                    <Icons.Trash2 className="mr-2 h-4 w-4"/> Clear Data
                </Button>
              </div>
            </div>
          </section>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveChanges} disabled>
              <Icons.Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icons.Info className="w-5 h-5 text-blue-500" /> About API Harmony Lite
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Version: 1.0.0 (Demo)</p>
            <p>API Harmony Lite provides a suite of tools for intelligent API management, analysis, and documentation, powered by AI.</p>
            <p>&copy; {new Date().getFullYear()} API Harmony Project. All rights reserved (Simulated).</p>
        </CardContent>
      </Card>
    </div>
  );
}
