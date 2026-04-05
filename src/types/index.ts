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
  authStrategy: 'jwt' | 'session';
  projectType: 'api' | 'fullstack';
  flyway: boolean;
  /** Frontend template to scaffold alongside the Spring Boot backend */
  frontendTemplate: 'none' | 'nextjs';
  /** Backend base URL injected into the frontend .env (e.g. http://localhost:8080) */
  backendUrl: string;
}

export interface EntityOptions {
  entityName: string;
  entityNameLower: string;
  entityNameUpper: string;
  packageName: string;
  packagePath: string;
  fields: EntityField[];
  relations: EntityRelation[];
  projectDir: string;
  flyway: boolean;
}

export interface EntityField {
  name: string;
  type: string;
  nullable: boolean;
}

export interface EntityRelation {
  type: 'ManyToOne' | 'OneToMany' | 'ManyToMany' | 'OneToOne';
  target: string;       // e.g. "Category"
  fieldName: string;    // e.g. "category"
  eager: boolean;
}

export interface SchemaEntity {
  name: string;
  fields: EntityField[];
  relations?: EntityRelation[];
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
