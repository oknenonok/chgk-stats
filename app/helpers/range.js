import Ember from 'ember';

export function range(params/*, hash*/) {
  const start = params[0];
  const count = params[1];

  let ret = [];
  for(let i = 0; i < count; i++) {
    ret.push(i+start);
  }
  return ret;
}

export default Ember.Helper.helper(range);
