-- Create table for storing website scans
CREATE TABLE public.website_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  domain text NOT NULL,
  builtwith_data jsonb,
  tech_stack jsonb,
  scan_status text DEFAULT 'completed',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_scans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view scans (public tool)
CREATE POLICY "Anyone can view scans"
ON public.website_scans
FOR SELECT
USING (true);

-- Create policy to allow anyone to insert scans (public tool)
CREATE POLICY "Anyone can insert scans"
ON public.website_scans
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_website_scans_domain ON public.website_scans(domain);
CREATE INDEX idx_website_scans_created_at ON public.website_scans(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_website_scans_updated_at
BEFORE UPDATE ON public.website_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();