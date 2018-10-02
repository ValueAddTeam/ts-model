// tslint:disable ban-types
export type ClassFieldsKeys<T> = ({
  [P in keyof T]: T[P] extends Function ? never : P
})[keyof T];
export type ClassFields<T> = Pick<T, ClassFieldsKeys<T>>;
export type ClassMethodsKeys<T> = ({
  [P in keyof T]: T[P] extends Function ? P : never
})[keyof T];
export type ClassMethods<T> = Pick<T, ClassMethodsKeys<T>>;
export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
