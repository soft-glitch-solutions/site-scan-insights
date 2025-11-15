import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScanFormProps {
  onScanComplete: (data: any) => void;
}

export const ScanForm = ({ onScanComplete }: ScanFormProps) => {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    // Validate URL format
    let validUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      validUrl = 'https://' + url;
    }

    try {
      new URL(validUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsScanning(true);

    try {
      const { data, error } = await supabase.functions.invoke('scan-website', {
        body: { url: validUrl }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Scan completed successfully!");
        onScanComplete(data.data);
        setUrl("");
      } else {
        throw new Error(data.error || "Scan failed");
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error.message || "Failed to scan website");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-card to-secondary/20 border-border/50 shadow-lg">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Analyze Any Website
          </h2>
          <p className="text-muted-foreground">
            Discover the technologies, platforms, and infrastructure behind any domain
          </p>
        </div>

        <form onSubmit={handleScan} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter website URL (e.g., example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isScanning}
            className="flex-1 h-12 text-lg bg-background/50 border-border/50 focus-visible:ring-primary"
          />
          <Button 
            type="submit" 
            disabled={isScanning}
            size="lg"
            className="h-12 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Scan
              </>
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
};