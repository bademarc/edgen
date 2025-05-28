import crypto from 'crypto'

/**
 * Token encryption service for securely storing OAuth tokens
 */
export class TokenEncryptionService {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32
  private readonly ivLength = 16
  private readonly tagLength = 16

  private getEncryptionKey(): Buffer {
    // Try TOKEN_ENCRYPTION_KEY first, then fall back to NEXTAUTH_SECRET
    let key = process.env.TOKEN_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET

    if (!key) {
      // Generate a deterministic key from available environment variables as last resort
      const fallbackSeed = process.env.NEXT_PUBLIC_SUPABASE_URL || 'layeredge-default-seed'
      console.warn('⚠️ No TOKEN_ENCRYPTION_KEY or NEXTAUTH_SECRET found, using fallback key derivation')
      key = fallbackSeed
    }

    // Use the key directly if it's 32 bytes in hex, otherwise derive it
    if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) { // 32 bytes in hex
      return Buffer.from(key, 'hex')
    } else {
      // Derive a key from the provided string using a consistent salt
      return crypto.scryptSync(key, 'layeredge-salt-v1', this.keyLength)
    }
  }

  /**
   * Encrypt a token for secure storage
   */
  encrypt(token: string): string {
    try {
      const key = this.getEncryptionKey()
      const iv = crypto.randomBytes(this.ivLength)

      // Use createCipheriv with the generated IV (not deprecated createCipher)
      const cipher = crypto.createCipheriv(this.algorithm, key, iv)
      cipher.setAAD(Buffer.from('layeredge-token'))

      let encrypted = cipher.update(token, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const tag = cipher.getAuthTag()

      // Combine iv + tag + encrypted data
      const combined = iv.toString('hex') + tag.toString('hex') + encrypted
      return combined
    } catch (error) {
      console.error('Token encryption failed:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        tokenLength: token?.length,
        hasKey: !!process.env.TOKEN_ENCRYPTION_KEY,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET
      })
      throw new Error('Failed to encrypt token')
    }
  }

  /**
   * Decrypt a token for use
   */
  decrypt(encryptedToken: string): string {
    try {
      const key = this.getEncryptionKey()

      // Extract iv, tag, and encrypted data
      const ivHex = encryptedToken.slice(0, this.ivLength * 2)
      const tagHex = encryptedToken.slice(this.ivLength * 2, (this.ivLength + this.tagLength) * 2)
      const encrypted = encryptedToken.slice((this.ivLength + this.tagLength) * 2)

      const iv = Buffer.from(ivHex, 'hex')
      const tag = Buffer.from(tagHex, 'hex')

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
      decipher.setAAD(Buffer.from('layeredge-token'))
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('Token decryption failed:', error)
      throw new Error('Failed to decrypt token')
    }
  }

  /**
   * Check if a token is encrypted (basic heuristic)
   */
  isEncrypted(token: string): boolean {
    // Encrypted tokens will be hex strings of specific length
    const expectedMinLength = (this.ivLength + this.tagLength) * 2 + 32 // Minimum for small tokens
    return token.length >= expectedMinLength && /^[0-9a-f]+$/i.test(token)
  }

  /**
   * Safely encrypt a token only if it's not already encrypted
   */
  safeEncrypt(token: string): string {
    if (this.isEncrypted(token)) {
      return token // Already encrypted
    }
    return this.encrypt(token)
  }

  /**
   * Safely decrypt a token, handling both encrypted and plain tokens
   */
  safeDecrypt(token: string): string {
    if (!this.isEncrypted(token)) {
      return token // Plain token
    }
    return this.decrypt(token)
  }
}

// Singleton instance
let tokenEncryption: TokenEncryptionService | null = null

export function getTokenEncryption(): TokenEncryptionService {
  if (!tokenEncryption) {
    tokenEncryption = new TokenEncryptionService()
  }
  return tokenEncryption
}
