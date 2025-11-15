import { useState } from "react";
import { ScanForm } from "@/components/ScanForm";
import { ScanResults } from "@/components/ScanResults";
import { ScanHistory } from "@/components/ScanHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radar } from "lucide-react";

const Index = () => {
  const [currentScan, setCurrentScan] = useState<any>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleScanComplete = (scanData: any) => {
    setCurrentScan(scanData);
    setRefreshHistory(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Radar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">WebPulseSnap</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Website Intelligence</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="scan" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="scan">Scan Website</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-8">
            {/* Scan Form */}
            <ScanForm onScanComplete={handleScanComplete} />

            {/* Results */}
            {currentScan && <ScanResults scan={currentScan} />}
          </TabsContent>

          <TabsContent value="history">
            <ScanHistory key={refreshHistory} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>WebPulseSnap - Discover the technology behind any website</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;