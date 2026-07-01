export function getPublicBasePath(): string {
  const baseUrl = import.meta.env.BASE_URL || "/";
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function resolvePublicAssetPath(path: string): string {
  if (isAbsoluteExternalPath(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${getPublicBasePath()}${normalizedPath}`;
}

function isAbsoluteExternalPath(path: string): boolean {
  return /^(?:[a-z][a-z\d+\-.]*:|data:|blob:)/iu.test(path);
}
