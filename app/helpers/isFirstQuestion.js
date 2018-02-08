import Ember from 'ember';

export function isFirstQuestion(params/*, hash*/) {
  const question = parseInt(params[0]);
  const questions = params[1];
  let firstNumbers = [1];
  let sum = 0;
  for (let i = 0; i < questions.length - 1; i++) {
    sum += questions[i];
    firstNumbers.push(sum + 1);
  }
  return firstNumbers.indexOf(question) !== -1;
}

export default Ember.Helper.helper(isFirstQuestion);
