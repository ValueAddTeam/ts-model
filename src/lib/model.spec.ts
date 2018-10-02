// tslint:disable:no-expression-statement
import test from 'ava';
import { Model, ModelProp } from './model';

class TestClass extends Model {
  @ModelProp(Date)
  date: Date;
  @ModelProp()
  name: string;
  @ModelProp()
  surname: string;
}

test('Model.deserialize', t => {
  const obj = {
    date: '2018-10-02T11:53:50.327Z',
    name: 'Test name',
    surname: 'Test surname'
  };
  const testClass = TestClass.deserialize<TestClass>(obj);

  t.truthy(testClass instanceof TestClass);
  t.truthy(testClass.date instanceof Date);
  t.truthy(testClass.name === obj.name);
});
