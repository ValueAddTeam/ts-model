// tslint:disable:no-expression-statement
import test from 'ava';
import { Model, ModelProp } from './model';

class TestModel extends Model {
  @ModelProp(Date)
  date: Date;
  @ModelProp()
  name: string;
  @ModelProp()
  surname: string;
}

class TestModel2 extends Model {
  @ModelProp()
  id: number;
  @ModelProp()
  nicknames: string[];
  @ModelProp(() => TestModel)
  testModels: TestModel[];
  @ModelProp()
  username: string;
}

test('Model.deserialize() with simple data', t => {
  const obj = {
    date: '2018-10-02T11:53:50.327Z',
    name: 'Test name',
    surname: 'Test surname'
  };
  const testModel = TestModel.deserialize<TestModel>(obj);

  t.truthy(testModel instanceof TestModel, 'should be instance of TestModel');
  t.truthy(testModel.date instanceof Date, 'should be instance of date');
  t.truthy(testModel.name === obj.name, `should be ${obj.name}`);
  t.truthy(testModel.surname === obj.surname, `should be ${obj.surname}`);
});

test('Model.deserialize() with nested Models', t => {
  const tstObj = {
    date: '2018-10-02T11:53:50.327Z',
    name: 'Test name',
    surname: 'Test surname'
  };

  const obj = {
    id: 1,
    nicknames: ['Foo', 'Bar', 'Baz'],
    testModels: [tstObj, tstObj, tstObj, tstObj],
    username: 'Tester'
  };

  const testModel = TestModel2.deserialize<TestModel2>(obj);

  t.truthy(
    testModel instanceof TestModel2,
    'testClass2 should be instance of TestClass2'
  );
  t.is(testModel.id, 1, 'Id should be 1');
  t.truthy(
    testModel.username === obj.username,
    `Username should be ${obj.username}`
  );
  t.truthy(
    testModel.testModels instanceof Array,
    'testClass2.testModels should be Array'
  );
  t.truthy(
    testModel.testModels.length === obj.testModels.length,
    `testClass2.testModels.length should be ${obj.testModels.length}`
  );
  t.truthy(
    testModel.testModels.every(tc => tc instanceof TestModel),
    'Every testClass2.testModels should be instance of TestClass'
  );
});

test('Model.clone()', t => {
  const tstObj = {
    date: '2018-10-02T11:53:50.327Z',
    name: 'Test name',
    surname: 'Test surname'
  };

  const testModel = TestModel.deserialize<TestModel>(tstObj);
  const cloneOfTestModel = testModel.clone();
  t.truthy(
    testModel !== cloneOfTestModel,
    'The cloned model should be different from the model that was cloned'
  );

  const obj = {
    id: 1,
    nicknames: ['Foo', 'Bar', 'Baz'],
    testModels: [tstObj, tstObj, tstObj, tstObj],
    username: 'Tester'
  };

  const testModel2 = TestModel2.deserialize<TestModel2>(obj);
  const clonedTestModel2 = testModel2.clone();

  t.truthy(
    testModel2 !== clonedTestModel2,
    'The cloned model should be different from the model that was cloned'
  );

  t.truthy(
    clonedTestModel2.testModels.every(
      ctm => testModel2.testModels.indexOf(ctm) === -1
    ),
    'Object inside cloned object should be different from the model that was cloned'
  );
});
