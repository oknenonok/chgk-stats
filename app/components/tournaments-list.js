import Ember from 'ember';

export default Ember.Component.extend({
  api: Ember.inject.service('rating-api'),

  loading: false,
  tournaments: [],

  loadList: Ember.on('didInsertElement', function() {
    this.set('loading', true);
    this.get('api').getTournaments().then(data => {
      this.set('tournaments', data);
    }).finally(() => {
      this.set('loading', false);
    });
  })
});
