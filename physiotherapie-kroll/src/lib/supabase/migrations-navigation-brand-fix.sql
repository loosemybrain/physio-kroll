-- Migration: Normalize brand values in pages table
-- Maps legacy brand values to current BrandKey format

-- Update legacy 'physio' to 'physiotherapy'
UPDATE public.pages
SET brand = 'physiotherapy'
WHERE brand = 'physio';

-- Update legacy 'konzept' to 'physio-konzept'
UPDATE public.pages
SET brand = 'physio-konzept'
WHERE brand = 'konzept';

-- Optional: Set NULL brands to 'physiotherapy' as default
-- Uncomment if you want to set a default for pages without brand
-- UPDATE public.pages
-- SET brand = 'physiotherapy'
-- WHERE brand IS NULL;
