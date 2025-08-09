/**
 * 管理员配置文件
 * 统一管理管理员邮箱列表，避免重复配置
 */

export const ADMIN_CONFIG = {
  // 管理员邮箱白名单
  adminEmails: [
    'admin@ai-lyrics-generator.net',
    '1762096094@qq.com',
    // 在这里添加你的实际管理员邮箱
    // 'your-actual-admin-email@domain.com'
  ] as string[],
  
  // 管理后台路径（用于重定向）
  adminPath: '/admin1762096094',
  
  // 登录页面路径
  signInPath: '/auth/signin',
  
  // 首页路径
  homePath: '/'
} as const;

/**
 * 检查用户是否为管理员
 * @param email 用户邮箱
 * @returns 是否为管理员
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_CONFIG.adminEmails.includes(email);
}

/**
 * 管理员认证检查函数
 * @param userEmail 用户邮箱
 * @returns 认证结果
 */
export function checkAdminAuth(userEmail: string | null | undefined) {
  return {
    isAuthenticated: isAdmin(userEmail),
    redirectTo: isAdmin(userEmail) ? null : ADMIN_CONFIG.signInPath
  };
}