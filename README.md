# ts-model

Simple base abstract model based on TypeScript decorators and reflect-metadata which helps with serializing and deserializing data.

## Creating models
```typescript
  class Animal extends Model {
    @ModelProp()
    dateOfBirth: Date;
    @ModelProp(Date)
    name: string;
  }

  class Dog extends Animal {
    retrieve(): void {}
  }

  class Human extends Animal {
    @ModelProp()
    surname: string;
    @ModelProp(Dog)
    dogs: Dog[];
  }
```
