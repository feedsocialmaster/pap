const DEFAULT_SITE_URL = 'https://pasoapasoshoes.com';

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_SITE_URL;

  return raw.replace(/\/$/, '');
}

export function absoluteUrl(pathname: string) {
  const base = getSiteUrl();
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}
