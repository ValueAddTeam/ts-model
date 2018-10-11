import 'reflect-metadata';
import { ClassFields, ClassFieldsKeys, Omit } from './types';
import { isArray, isPrimitive } from './utils';

const propertyDecoratorKey = '__VaTsModelProp__';

/**
 * Pick properties from model.
 * Useful if server returns model without some properties.
 *
 * Eg.:
 * <code>
 *   class TestClass extends Model {
 *     @ModelProp(Date)
 *     date: Date;
 *     @ModelProp()
 *     name: string;
 *     @ModelProp()
 *     surname: string;
 *   }
 *
 *   type TestClassWithFullName = ModelSubset<TestClass, 'name' | 'surname'>;
 * </code>
 */
export type ModelSubset<T, K extends keyof T> = Omit<
  T,
  Exclude<ClassFieldsKeys<T>, K>
>;

/**
 * Annotate properties which should be deserializable.
 * @param {any} [type] - class which should be used during creating object e.g.:
 * <code>
 * class Animal extends Model {
 *   @ModelProp()
 *   name: string;
 * }
 *
 * class Dog extends Animal {
 * }
 *
 * class Person {
 *   @ModelProp()
 *   name: string;
 *   @ModelProp(Dog) // <---- Dog class will be used during creating array of Dogs.
 *   dogs: Dog[]
 * }
 * </code>
 * @param {string} [sourceProperty] - name of source property, which will be mapped to target property.
 * @returns {PropertyDecorator}
 */
export function ModelProp(
  type?: () => any,
  sourceProperty?: string | symbol
): PropertyDecorator {
  return (target, property) => {
    const source = sourceProperty || property;
    const classConstructor = target.constructor;
    const metadata = {
      targetProp: property,
      type:
        type ||
        Reflect.getMetadata('design:type', target, property) ||
        undefined
    };

    Reflect.defineMetadata(
      propertyDecoratorKey,
      metadata,
      classConstructor,
      source
    );
  };
}

export abstract class Model {
  /**
   * Parse provided object (e.g. data from server) into model instance.
   * @Todo: Support for nested arrays.
   * @Todo: Implement different object creation in array (e.g. Person have animals' array which can be Dog or Cat).
   * @param {any} data
   * @returns {T}
   */
  static deserialize<T>(data: object): T {
    const obj = new (<any>this)();

    if (!data) {
      return obj;
    }

    Object.keys(data).forEach(key => {
      const metadata = Reflect.getMetadata(propertyDecoratorKey, this, key);
      // Return if provided key doesn't mach any decorated class member.
      if (!metadata) {
        return;
      }

      const targetProp = metadata.targetProp;
      let type = metadata.type;

      if (!type.name || type.name === 'anonymous') {
        type = type();
      }

      obj[targetProp] = Model.deserializeProperty(data[key], type);
    });

    return <T>obj;
  }

  protected static deserializeProperty(value: any, type: any): any {
    if (isPrimitive(value) && isPrimitive(type)) {
      // Value is primitive type, just return it
      return value;
    }

    if (isArray(value)) {
      // If decorated property is type of array return it. It means that values of array are primitive type.
      if (isArray(type)) {
        return value;
      }

      // If decorated property specified own type, deserialize it.
      const prop = [];

      value.forEach((arrObj: any) => {
        prop.push(
          type.deserialize ? type.deserialize(arrObj) : new type(value)
        );
      });

      return prop;
    }

    // If have deserialize method and value is defined.
    if (type.deserialize && value) {
      return type.deserialize(value);
    }

    if (value) {
      // If is instance of object just call new with provided data (e.g. Date).
      return new type(value);
    } else {
      return value;
    }
  }

  /**
   * Returns deep clone of the object.
   * @returns {this}
   */
  clone(): this {
    return <this>(<any>this).constructor.deserialize(this.serialize());
  }

  /**
   * Returns shallow copy of the object.
   * @returns {this}
   */
  copy(): this {
    const data = { ...(<any>this) };
    return <this>Object.assign(new (<any>this.constructor)(), data);
  }

  /**
   * Creates new object and maps sources' properties to this newly created object's properties.
   * @param sources
   * @returns {this}
   */
  mapToModel(...sources: Array<Partial<ClassFields<this>>>): this {
    return <this>(
      (<any>this).constructor.deserialize(
        Object.assign(this.serialize(), ...sources)
      )
    );
  }

  /**
   * Serialize and return plain object without methods.
   * @param {string[]} exclude - array of property names which should be excluded from object (you can provide nested
   *                             properties e.g.: ['position.z']).
   * @returns {any}
   */
  serialize(exclude?: string[]): object {
    const obj = this.basicSerialize();

    if (exclude) {
      exclude.forEach(prop => {
        const arrProp = prop.split('.');
        const l = arrProp.length - 1;
        let toDelete = obj;

        for (let i = 0; i < l; i++) {
          if (!(arrProp[i] in toDelete)) {
            throw new Error(
              'Property ' +
                prop +
                ' does not exist on ' +
                (<any>this.constructor).name
            );
          }
          toDelete = toDelete[arrProp[i]];
        }

        if (!(arrProp[l] in toDelete)) {
          throw new Error(
            'Property ' +
              prop +
              ' does not exist on ' +
              (<any>this.constructor).name
          );
        }

        delete toDelete[arrProp[l]];
      });
    }

    return obj;
  }

  /**
   * Serializes model with all its properties
   * @returns {object}
   */
  protected basicSerialize(): object {
    const obj = {};

    // tslint:disable-next-line forin
    for (const property in this) {
      obj[<string>property] = this.basicSerializeProperty(this[property]);
    }

    return obj;
  }

  /**
   * Serializes single property
   * @param property
   * @returns {any}
   */
  protected basicSerializeProperty(property: any): any {
    if (property && typeof property !== 'function') {
      if (typeof property.serialize === 'function') {
        return property.serialize();
      } else if (isArray(property)) {
        return property.map((element: any) =>
          this.basicSerializeProperty(element)
        );
      } else {
        return JSON.parse(JSON.stringify(property));
      }
    } else if (typeof property !== 'function') {
      return property;
    }
  }
}
