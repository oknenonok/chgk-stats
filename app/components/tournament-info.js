import Ember from 'ember';

export default Ember.Component.extend({
  id: null,

  api: Ember.inject.service('rating-api'),

  stats: null,
  percentage: null,
  rating: null,
  statsError: null,
  percentageError: null,
  ratingError: null,

  actions: {
    refresh() {
      this.loadStats();
    }
  },

  loadStats: Ember.on('didInsertElement', function() {
    this.set('stats', null);
    this.set('percentage', null);
    this.set('rating', null);

    this.get('api').getTournamentStats(this.get('id')).then(data => {
      this.set('stats', data);
      document.title = data.name;
    }).catch(e => {
      this.set('statsError', e);
    });

    this.get('api').getTournamentPercentage(this.get('id')).then(data => {
      this.set('percentage', data);
    }).catch(e => {
      this.set('percentageError', e);
    });

    this.get('api').getTournamentRating(this.get('id')).then(data => {
      this.set('rating', data);
    }).catch(e => {
      this.set('ratingError', e);
    });
  })
});
