import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScanRequest {
  url: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { url } = await req.json() as ScanRequest;
    
    if (!url) {
      throw new Error('URL is required');
    }

    // Extract domain from URL
    const domain = new URL(url).hostname;
    
    console.log('Scanning website:', url, 'Domain:', domain);

    // Call BuiltWith API
    const builtwithApiKey = Deno.env.get('BUILTWITH_API_KEY');
    const builtwithUrl = `https://api.builtwith.com/free1/api.json?KEY=${builtwithApiKey}&LOOKUP=${encodeURIComponent(domain)}`;
    
    console.log('Calling BuiltWith API for domain:', domain);
    
    const builtwithResponse = await fetch(builtwithUrl);
    const builtwithData = await builtwithResponse.json();
    
    console.log('BuiltWith response received');

    // Process and organize tech stack data
    const techStack = organizeTechStack(builtwithData);

    // Save to database
    const { data: scanData, error: dbError } = await supabaseClient
      .from('website_scans')
      .insert({
        url,
        domain,
        builtwith_data: builtwithData,
        tech_stack: techStack,
        scan_status: 'completed'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Scan saved to database:', scanData.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: scanData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error scanning website:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function organizeTechStack(builtwithData: any): any {
  const techStack: any = {
    frameworks: [],
    analytics: [],
    advertising: [],
    widgets: [],
    cms: [],
    javascript: [],
    servers: [],
    cdn: [],
    payment: [],
    ecommerce: [],
    other: []
  };

  if (!builtwithData || !builtwithData.Results || !builtwithData.Results[0]) {
    return techStack;
  }

  const results = builtwithData.Results[0];
  const paths = results.Paths || [];

  // Categorize technologies
  paths.forEach((path: any) => {
    const name = path.Name || 'Unknown';
    const category = categorizeTech(name, path);
    
    const tech = {
      name,
      domain: path.Domain,
      firstDetected: path.FirstDetected,
      lastDetected: path.LastDetected
    };

    if (techStack[category]) {
      techStack[category].push(tech);
    } else {
      techStack.other.push(tech);
    }
  });

  return techStack;
}

function categorizeTech(name: string, path: any): string {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('shopify') || nameLower.includes('woocommerce') || 
      nameLower.includes('magento') || nameLower.includes('commerce')) {
    return 'ecommerce';
  }
  if (nameLower.includes('stripe') || nameLower.includes('paypal') || nameLower.includes('payment')) {
    return 'payment';
  }
  if (nameLower.includes('react') || nameLower.includes('vue') || 
      nameLower.includes('angular') || nameLower.includes('next')) {
    return 'frameworks';
  }
  if (nameLower.includes('analytics') || nameLower.includes('google tag') || 
      nameLower.includes('gtm') || nameLower.includes('tracking')) {
    return 'analytics';
  }
  if (nameLower.includes('wordpress') || nameLower.includes('drupal') || nameLower.includes('cms')) {
    return 'cms';
  }
  if (nameLower.includes('cloudflare') || nameLower.includes('cdn') || nameLower.includes('akamai')) {
    return 'cdn';
  }
  if (nameLower.includes('nginx') || nameLower.includes('apache') || nameLower.includes('server')) {
    return 'servers';
  }
  if (nameLower.includes('javascript') || nameLower.includes('jquery') || nameLower.includes('js')) {
    return 'javascript';
  }
  if (nameLower.includes('ads') || nameLower.includes('advertising')) {
    return 'advertising';
  }
  
  return 'other';
}