import Ember from 'ember';

export default Ember.Component.extend({
  id: null,

  api: Ember.inject.service('rating-api'),

  loading: false,
  stats: null,
  percentage: null,

  actions: {
    refresh() {
      this.set('stats', null);
      this.set('percentage', null);
      this.loadStats();
    }
  },

  loadStats: Ember.on('didInsertElement', function() {
    this.get('api').getTournamentStats(this.get('id')).then(data => {
      this.set('stats', data);
    });
    this.get('api').getTournamentPercentage(this.get('id')).then(data => {
      this.set('percentage', data);
    });
  })
});
