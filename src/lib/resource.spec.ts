import test from 'ava';
import { ModelProp } from './model';
import { EmbeddedDef, Resource } from './resource';

export class Address extends Resource<{}, 'self'> {
  @ModelProp()
  city: string;
  @ModelProp()
  country: string;
  @ModelProp()
  description: string;
  @ModelProp()
  postalCode: string;
  @ModelProp()
  street: string;
}

@EmbeddedDef({ addresses: () => Address })
export class User extends Resource<{ addresses: Address[] }, 'self'> {
  @ModelProp()
  name: string;
}

test('Resource.deserialize()', t => {
  const userObj = {
    _embedded: {
      addresses: [
        {
          _links: {
            self: { href: '/users/123/addresses/1' }
          },
          city: 'Warsaw',
          country: 'Poland',
          description: 'Company',
          postalCode: '01-248',
          street: 'Puławska 9933'
        }
      ]
    },
    name: 'Tester'
  };

  const user = User.deserialize<User>(userObj);
  t.truthy(user, `should be defined`);
  t.truthy(user instanceof User, `should be instance of User`);
  t.truthy(user instanceof Resource, `should be instance of Resource`);
  t.truthy(user.name === userObj.name, `should be ${userObj.name}`);
  t.truthy(!!user._embedded, `should be defined`);
  t.truthy(!!user._embedded.addresses, `should be defined`);
  t.truthy(
    user._embedded.addresses instanceof Array,
    `should be instance of Array`
  );
  t.truthy(
    user._embedded.addresses.length === userObj._embedded.addresses.length,
    `should be ${userObj._embedded.addresses.length} length`
  );
  t.truthy(
    user._embedded.addresses.every(addr => addr instanceof Address),
    `every address should be instance of Address`
  );
});
