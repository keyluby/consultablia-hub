/**
 * MOCK SIGNER:
 * Due to the complexity of XAdES-BES in Node, for this scaffold we'll use a mock
 * string representation. In a real environment, you'd use a robust XML signing
 * library or an external sign API, combined with HashiCorp Vault.
 *
 * It will use xmldsigjs in future iterations properly.
 */
export declare function signXmlWithP12(xmlContent: string, p12Base64: string, password: string): string;
export declare function computeSha256(xmlContent: string): string;
