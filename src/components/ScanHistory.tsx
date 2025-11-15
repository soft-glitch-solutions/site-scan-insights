import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, Calendar } from "lucide-react";
import { toast } from "sonner";

export const ScanHistory = () => {
  const [scans, setScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('website_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setScans(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error("Failed to load scan history");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (scans.length === 0) {
    return (
      <Card className="p-12 text-center border-border/50">
        <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">No scans yet</h3>
        <p className="text-muted-foreground">Start by scanning your first website!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-6">Scan History</h2>
      
      <div className="grid gap-4">
        {scans.map((scan) => {
          const techCount: number = scan.tech_stack 
            ? (Object.values(scan.tech_stack).reduce((sum: number, arr: any) => 
                sum + (Array.isArray(arr) ? arr.length : 0), 0) as number)
            : 0;

          return (
            <Card 
              key={scan.id}
              className="p-6 bg-gradient-to-br from-card to-secondary/10 border-border/50 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">{scan.domain}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{scan.url}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(scan.created_at).toLocaleDateString()}
                    </div>
                    <Badge variant="secondary" className="bg-secondary/50">
                      {techCount} technologies
                    </Badge>
                    <Badge 
                      variant={scan.scan_status === 'completed' ? 'default' : 'destructive'}
                      className={scan.scan_status === 'completed' ? 'bg-primary/20 text-primary' : ''}
                    >
                      {scan.scan_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};