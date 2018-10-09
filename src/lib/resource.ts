import 'reflect-metadata';
import { Link } from './link.interface';
import { Model, ModelProp } from './model';
import { isArray, isFunction } from './utils';

const propertyDecoratorKey = '__VaTsResourceProp__';

export function EmbeddedDef(_embedded: {
  [key: string]: () => any;
}): ClassDecorator {
  return function<T extends Function>(constructor: T): T {
    Reflect.defineMetadata(propertyDecoratorKey, _embedded, constructor);
    return constructor;
  };
}

/**
 * A Resource Object represents a resource.
 *
 * It has two reserved properties:
 * (1)  "_links": contains links to other resources.
 * (2)  "_embedded": contains embedded resources.
 *
 * All other properties MUST be valid JSON, and represent the current
 * state of the resource.
 *
 * @Todo: enforce Resource type in T map
 */
export class Resource<
  T extends { [key: string]: any | any[] } = {
    [key: string]: Resource | Resource[];
  },
  Links extends string = any
> extends Model {
  /**
   * It is an object whose property names are link relation types (as
   * defined by [RFC5988](https://tools.ietf.org/html/rfc5988)) and values
   * are either a Resource Object or an array of Resource Objects.
   *
   * Embedded Resources MAY be a full, partial, or inconsistent version of
   * the representation served from the target URI.
   */
  _embedded?: T;
  /**
   * It is an object whose property names are link relation types (as
   * defined by [RFC5988](https://tools.ietf.org/html/rfc5988)) and values
   * are either a Link Object or an array of Link Objects.
   * The subject resource of these links is the Resource Object
   * of which the containing "_links" object is a property.
   */
  @ModelProp()
  _links?: { [L in Links]: Link | Link[] };

  static deserialize<T>(data: object): T {
    const obj = super.deserialize<T>(data);
    const embedded = data['_embedded'];

    if (embedded) {
      const metadata = Reflect.getMetadata(propertyDecoratorKey, this);
      // If metadata is not defined
      if (!metadata) {
        return obj;
      }

      obj['_embedded'] = {};

      Object.keys(embedded).forEach(key => {
        // Return if provided key doesn't match any decorated metadata value.
        if (!metadata[key] || !isFunction(metadata[key])) {
          if (console && console.warn) {
            console.warn(
              `There is no metadata defined for _embedded['${key}'] in ${
                this.constructor.name
              }, or metadata is not correctly defined.`
            );
          }
          return;
        }

        const type = metadata[key]();
        obj['_embedded'][key] = this.deserializeResource(type, embedded[key]);
      });
    }

    return obj;
  }

  protected static deserializeResource(type: any, value: any): any {
    if (isArray(value)) {
      return value.map(
        val => (type.deserialize ? type.deserialize(val) : new Resource())
      );
    }

    return type.deserialize ? type.deserialize(value) : new Resource();
  }
}
