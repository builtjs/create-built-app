export function generateTemplateId(baseName: string): string {
    // Generate a 6-character random string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomStr = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    
    return `${baseName}${randomStr}`;
  }