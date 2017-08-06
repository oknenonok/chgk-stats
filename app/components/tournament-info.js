import Ember from 'ember';

export default Ember.Component.extend({
  id: null,

  api: Ember.inject.service('rating-api'),

  stats: null,
  percentage: null,
  statsError: null,
  percentageError: null,

  actions: {
    refresh() {
      this.loadStats();
    }
  },

  loadStats: Ember.on('didInsertElement', function() {
    this.set('stats', null);
    this.set('percentage', null);

    this.get('api').getTournamentStats(this.get('id')).then(data => {
      this.set('stats', data);
    }).catch(e => {
      this.set('statsError', e);
    });

    this.get('api').getTournamentPercentage(this.get('id')).then(data => {
      this.set('percentage', data);
    }).catch(e => {
      this.set('percentageError', e);
    });
  })
});
