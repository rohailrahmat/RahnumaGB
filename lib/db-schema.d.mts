type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => PromiseLike<unknown[]>;

export function createSchemaStatements(sql: SqlTag): PromiseLike<unknown[]>[];
