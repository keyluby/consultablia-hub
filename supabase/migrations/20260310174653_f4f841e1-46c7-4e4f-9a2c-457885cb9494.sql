-- Allow anonymous uploads to invoice-scans bucket
CREATE POLICY "Allow public uploads to invoice-scans"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'invoice-scans');

-- Allow public reads from invoice-scans bucket
CREATE POLICY "Allow public reads from invoice-scans"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'invoice-scans');