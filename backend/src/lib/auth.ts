import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'apex_gym_hub_default_secret_key_2026'

/**
 * Hash a password using pbkdf2 with a random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored salt:hash string
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) return false
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return hash === verifyHash
  } catch {
    return false
  }
}

/**
 * Sign a JWT using HS256 algorithm natively
 */
export function signJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
  
  const extendedPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // Valid for 24 hours
  }
  const base64Payload = Buffer.from(JSON.stringify(extendedPayload)).toString('base64url')
  
  const signatureInput = `${base64Header}.${base64Payload}`
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64url')
    
  return `${signatureInput}.${signature}`
}

/**
 * Verify a JWT and return the decoded payload, or null if invalid/expired
 */
export function verifyJwt(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const [header, payload, signature] = parts
    const signatureInput = `${header}.${payload}`
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64url')
      
    if (signature !== expectedSignature) return null
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return decodedPayload
  } catch {
    return null
  }
}

/**
 * Helper to authenticate and retrieve the user context from a Next.js Request
 */
export function getAuthUser(request: Request): any | null {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    return verifyJwt(token)
  } catch {
    return null
  }
}
