export interface ProjectOptions {
  projectName: string;
  packageName: string;
  packagePath: string;
  database: 'mysql' | 'postgresql' | 'h2';
  buildTool: 'maven' | 'gradle';
  modules: string[];
  javaVersion: string;
  springBootVersion: string;
  description: string;
}

export interface EntityOptions {
  entityName: string;
  entityNameLower: string;
  entityNameUpper: string;
  packageName: string;
  packagePath: string;
  fields: EntityField[];
  projectDir: string;
}

export interface EntityField {
  name: string;
  type: string;
  nullable: boolean;
}

export interface AuthOptions {
  packageName: string;
  packagePath: string;
  projectDir: string;
  projectName: string;
}

export interface TemplateContext {
  [key: string]: unknown;
}
