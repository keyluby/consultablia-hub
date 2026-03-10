import * as crypto from 'crypto';

/**
 * MOCK SIGNER:
 * Due to the complexity of XAdES-BES in Node, for this scaffold we'll use a mock
 * string representation. In a real environment, you'd use a robust XML signing
 * library or an external sign API, combined with HashiCorp Vault.
 *
 * It will use xmldsigjs in future iterations properly.
 */
export function signXmlWithP12(xmlContent: string, p12Base64: string, password: string): string {
    // 1. In real app, extract private key from P12
    // 2. Compute SHA-256 hash of the XML
    // 3. Inject XAdES Signature block
    const mockSignature = `\n<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">\n  <MockXAdESSignature/>\n</Signature>`;
    return xmlContent.replace('</ECF>', `${mockSignature}\n</ECF>`);
}

export function computeSha256(xmlContent: string): string {
    return crypto.createHash('sha256').update(xmlContent).digest('hex');
}
