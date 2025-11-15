import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, Calendar, Search, Filter, X, Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/DateRangePicker";
import { TechnologyFilter } from "@/components/TechnologyFilter";
import { exportToJSON, exportToCSV, exportToXLSX, exportToPDF } from "@/lib/exportUtils";

export const ScanHistory = () => {
  const [scans, setScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedScans, setSelectedScans] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  // Get all unique technologies from scans for filter options
  const allTechnologies = Array.from(
    new Set(
      scans.flatMap((scan) => {
        if (!scan.tech_stack) return [];
        return Object.values(scan.tech_stack).flatMap((techs: any) =>
          Array.isArray(techs) ? techs.map((t: any) => t.name) : []
        );
      })
    )
  ).sort();

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('website_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      setScans(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error("Failed to load scan history");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter scans based on search criteria
  const filteredScans = scans.filter((scan) => {
    // Domain search filter
    if (searchTerm && !scan.domain.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !scan.url.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Date range filter
    if (dateRange.from && new Date(scan.created_at) < dateRange.from) {
      return false;
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999); // Include the entire end date
      if (new Date(scan.created_at) > toDate) {
        return false;
      }
    }

    // Technology filter
    if (selectedTechnologies.length > 0) {
      const scanTechnologies = scan.tech_stack
        ? Object.values(scan.tech_stack).flatMap((techs: any) =>
            Array.isArray(techs) ? techs.map((t: any) => t.name) : []
          )
        : [];
      
      const hasAllTechs = selectedTechnologies.every((tech) =>
        scanTechnologies.includes(tech)
      );
      
      if (!hasAllTechs) return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({ from: undefined, to: undefined });
    setSelectedTechnologies([]);
  };

  const hasActiveFilters = searchTerm || dateRange.from || dateRange.to || selectedTechnologies.length > 0;

  const toggleScanSelection = (scanId: string) => {
    setSelectedScans((prev) =>
      prev.includes(scanId) ? prev.filter((id) => id !== scanId) : [...prev, scanId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedScans.length === filteredScans.length) {
      setSelectedScans([]);
    } else {
      setSelectedScans(filteredScans.map((scan) => scan.id));
    }
  };

  const getSelectedScansData = () => {
    return filteredScans.filter((scan) => selectedScans.includes(scan.id));
  };

  const handleBulkExport = (format: 'json' | 'csv' | 'xlsx' | 'pdf') => {
    const selectedData = getSelectedScansData();
    
    if (selectedData.length === 0) {
      toast.error("Please select at least one scan to export");
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `webpulsesnap-export-${timestamp}`;

      switch (format) {
        case 'json':
          exportToJSON(selectedData, filename);
          break;
        case 'csv':
          exportToCSV(selectedData, filename);
          break;
        case 'xlsx':
          exportToXLSX(selectedData, filename);
          break;
        case 'pdf':
          exportToPDF(selectedData, filename);
          break;
      }

      toast.success(`Exported ${selectedData.length} scan${selectedData.length > 1 ? 's' : ''} as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export data");
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

  if (filteredScans.length === 0 && hasActiveFilters) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters {hasActiveFilters && `(${selectedTechnologies.length + (searchTerm ? 1 : 0) + (dateRange.from || dateRange.to ? 1 : 0)})`}
          </Button>
        </div>
        
        {showFilters && (
          <Card className="p-6 space-y-4 bg-gradient-to-br from-card to-secondary/10 border-border/50">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Search Domain</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by domain..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background/50"
                  />
                </div>
              </div>
              
              <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
              
              <TechnologyFilter
                technologies={allTechnologies}
                selectedTechnologies={selectedTechnologies}
                setSelectedTechnologies={setSelectedTechnologies}
              />
            </div>
            
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="ghost" size="sm" className="gap-2">
                <X className="h-4 w-4" />
                Clear all filters
              </Button>
            )}
          </Card>
        )}

        <Card className="p-12 text-center border-border/50">
          <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">No matching scans</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters to see more results.</p>
          <Button onClick={clearFilters} variant="outline" className="gap-2">
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {filteredScans.length} of {scans.length} scans
            {selectedScans.length > 0 && ` • ${selectedScans.length} selected`}
          </p>
        </div>
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters {hasActiveFilters && `(${selectedTechnologies.length + (searchTerm ? 1 : 0) + (dateRange.from || dateRange.to ? 1 : 0)})`}
        </Button>
      </div>

      {/* Bulk Export Bar */}
      {selectedScans.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="font-semibold text-foreground">
                {selectedScans.length} scan{selectedScans.length > 1 ? 's' : ''} selected
              </p>
              <Button
                onClick={() => setSelectedScans([])}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear selection
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Export as:</span>
              <Button
                onClick={() => handleBulkExport('json')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
              <Button
                onClick={() => handleBulkExport('csv')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                CSV
              </Button>
              <Button
                onClick={() => handleBulkExport('xlsx')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                XLSX
              </Button>
              <Button
                onClick={() => handleBulkExport('pdf')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </Card>
      )}

      {showFilters && (
        <Card className="p-6 space-y-4 bg-gradient-to-br from-card to-secondary/10 border-border/50">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Search Domain</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>
            
            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
            
            <TechnologyFilter
              technologies={allTechnologies}
              selectedTechnologies={selectedTechnologies}
              setSelectedTechnologies={setSelectedTechnologies}
            />
          </div>
          
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="ghost" size="sm" className="gap-2">
              <X className="h-4 w-4" />
              Clear all filters
            </Button>
          )}
        </Card>
      )}
      
      <div className="grid gap-4">
        {/* Select All Checkbox */}
        {filteredScans.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <Checkbox
              checked={selectedScans.length === filteredScans.length}
              onCheckedChange={toggleSelectAll}
              id="select-all"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Select all ({filteredScans.length})
            </label>
          </div>
        )}

        {filteredScans.map((scan) => {
          const techCount: number = scan.tech_stack 
            ? (Object.values(scan.tech_stack).reduce((sum: number, arr: any) => 
                sum + (Array.isArray(arr) ? arr.length : 0), 0) as number)
            : 0;

          return (
            <Card 
              key={scan.id}
              className="p-6 bg-gradient-to-br from-card to-secondary/10 border-border/50 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedScans.includes(scan.id)}
                  onCheckedChange={() => toggleScanSelection(scan.id)}
                  className="mt-1"
                />
                
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