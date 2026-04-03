export function validatePackageName(value: string): boolean | string {
  if (!value || value.trim() === '') return 'Package name cannot be empty.';
  const valid = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(value.trim());
  if (!valid)
    return 'Package name must be lowercase, dot-separated identifiers (e.g. com.example.myapp).';
  return true;
}

export function validateProjectName(value: string): boolean | string {
  if (!value || value.trim() === '') return 'Project name cannot be empty.';
  const valid = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value.trim());
  if (!valid) return 'Project name must start with a letter and contain only alphanumerics, hyphens, or underscores.';
  return true;
}

export function validateEntityName(value: string): boolean | string {
  if (!value || value.trim() === '') return 'Entity name cannot be empty.';
  const valid = /^[A-Za-z][A-Za-z0-9]*$/.test(value.trim());
  if (!valid) return 'Entity name must start with a letter and contain only alphanumerics (PascalCase recommended).';
  return true;
}

export function toPackagePath(packageName: string): string {
  return packageName.replace(/\./g, '/');
}

export function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
