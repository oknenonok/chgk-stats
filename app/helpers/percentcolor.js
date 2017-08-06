import Ember from 'ember';

export function percentcolor(params/*, hash*/) {
  const percentage = Math.pow(params[0] / 100, 0.7);
  const property = params[1];

  let red = Math.round((1 - percentage) * 255);
  let green = Math.round(percentage * 255);
  return Ember.String.htmlSafe(`${property}: rgba(${red}, ${green}, 0, 0.5)`);
}

export default Ember.Helper.helper(percentcolor);
