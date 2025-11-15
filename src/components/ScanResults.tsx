import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Globe, 
  Layers, 
  BarChart, 
  ShoppingCart, 
  CreditCard,
  Code,
  Server,
  Cloud,
  Megaphone
} from "lucide-react";
import { toast } from "sonner";

interface ScanResultsProps {
  scan: any;
}

const categoryIcons: Record<string, any> = {
  frameworks: Code,
  analytics: BarChart,
  ecommerce: ShoppingCart,
  payment: CreditCard,
  cms: Layers,
  servers: Server,
  cdn: Cloud,
  advertising: Megaphone,
  javascript: Code,
  widgets: Layers,
  other: Globe
};

export const ScanResults = ({ scan }: ScanResultsProps) => {
  const techStack = scan.tech_stack || {};

  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData: any[] = [];
      
      Object.entries(techStack).forEach(([category, technologies]: [string, any]) => {
        if (Array.isArray(technologies) && technologies.length > 0) {
          technologies.forEach((tech: any) => {
            exportData.push({
              Category: category.charAt(0).toUpperCase() + category.slice(1),
              Technology: tech.name,
              Domain: tech.domain || '',
              'First Detected': tech.firstDetected || '',
              'Last Detected': tech.lastDetected || ''
            });
          });
        }
      });

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row => 
        Object.values(row).map(val => `"${val}"`).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scan.domain}-scan-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Export completed!");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{scan.domain}</h3>
            <p className="text-muted-foreground text-sm">
              Scanned on {new Date(scan.created_at).toLocaleDateString()} at {new Date(scan.created_at).toLocaleTimeString()}
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Technology Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(techStack).map(([category, technologies]: [string, any]) => {
          if (!Array.isArray(technologies) || technologies.length === 0) return null;

          const Icon = categoryIcons[category] || Globe;

          return (
            <Card 
              key={category} 
              className="p-6 bg-gradient-to-br from-card to-secondary/10 border-border/50 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground capitalize">
                  {category}
                </h4>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {technologies.map((tech: any, index: number) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="bg-secondary/50 hover:bg-secondary text-foreground"
                  >
                    {tech.name}
                  </Badge>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground mt-3">
                {technologies.length} {technologies.length === 1 ? 'technology' : 'technologies'} detected
              </p>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {Object.values(techStack).every((arr: any) => !Array.isArray(arr) || arr.length === 0) && (
        <Card className="p-12 text-center border-border/50">
          <p className="text-muted-foreground">No technologies detected for this website.</p>
        </Card>
      )}
    </div>
  );
};