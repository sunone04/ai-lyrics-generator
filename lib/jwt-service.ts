import { SignJWT, jwtVerify } from 'jose'

// JWT配置 - 标准AI SaaS做法
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')
const JWT_ALGORITHM = 'HS256'
const ACCESS_TOKEN_EXPIRY = '15m'  // 短期访问令牌
const REFRESH_TOKEN_EXPIRY = '7d'  // 长期刷新令牌

export interface JWTPayload {
  userId: string
  email: string
  subscriptionStatus: string
  isAdmin: boolean
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat?: number
  exp?: number
}

/**
 * 生成访问令牌
 * 标准AI SaaS做法：短期令牌，减少安全风险
 */
export async function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

/**
 * 生成刷新令牌
 * 标准AI SaaS做法：长期令牌，用于获取新的访问令牌
 */
export async function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

/**
 * 验证访问令牌
 * 标准AI SaaS做法：快速验证，无需数据库查询
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM]
    })
    return payload as unknown as JWTPayload
  } catch (error) {
    throw new Error('Invalid access token')
  }
}

/**
 * 验证刷新令牌
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM]
    })
    return payload as unknown as RefreshTokenPayload
  } catch (error) {
    throw new Error('Invalid refresh token')
  }
}

/**
 * 从请求头提取令牌
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
