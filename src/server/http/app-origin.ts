type OriginConfiguration = Record<string, string | undefined>;

export function trustedOrigins(config: OriginConfiguration = process.env): string[] {
  const configured = new URL(config.APP_ORIGIN ?? 'http://localhost:3000');
  if (configured.username || configured.password || !['http:', 'https:'].includes(configured.protocol) || configured.pathname !== '/' || configured.search || configured.hash) {
    throw new Error('Invalid application origin configuration.');
  }
  const origins = [configured.origin];
  if (config.VERCEL_ENV === 'preview') {
    for (const host of [config.VERCEL_URL, config.VERCEL_BRANCH_URL]) {
      if (host && /^[a-z0-9.-]+\.vercel\.app$/i.test(host)) origins.push('https://' + host.toLowerCase());
    }
  }
  return [...new Set(origins)];
}

export function appOrigin(requestUrl: string, config: OriginConfiguration = process.env): string {
  const allowed = trustedOrigins(config), origin = new URL(requestUrl).origin;
  return allowed.includes(origin) ? origin : allowed[0];
}
