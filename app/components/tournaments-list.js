import Ember from 'ember';

export default Ember.Component.extend({
  api: Ember.inject.service('rating-api'),

  tournaments: [],
  loadError: null,

  loadList: Ember.on('didInsertElement', function() {
    this.get('api').getTournaments().then(data => {
      this.set('tournaments', data);
    }).catch(e => {
      this.set('loadError', e);
    });
  })
});
