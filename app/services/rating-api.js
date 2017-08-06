import Ember from 'ember';
import config from '../config/environment';

export default Ember.Service.extend({
  urlPrefix: 'http://cors-anywhere.herokuapp.com/http://rating.chgk.info/',
  cache: {},
  cacheTime: 30, // минуты жизни кеша

  /**
  * По какому городу показывать статистику
  */
  city: Ember.computed({
    get() {
      return localStorage.getItem('rating-city') || config.defaultCity;
    },
    set(key, value) {
      localStorage.setItem('rating-city', value);
      return value;
    }
  }),

  /**
  * Загрузить данные по урлу
  */
  loadURL(url, dataType = 'json') {
    const cacheKey = `http-${url}`;
    return this.checkCache(cacheKey) || new Ember.RSVP.Promise((resolve, reject) => {
      Ember.$.ajax({
        url: `${this.get('urlPrefix')}${url}`,
        type: 'GET',
        dataType: dataType,
      }).done((data) => {
        this.setCache(cacheKey, data);
        resolve(data);
      }).fail((jqXHR, textStatus, errorThrown) => {
        reject(errorThrown);
      });
    });
  },

  /**
  * Получить данные из локального кеша
  */
  checkCache(key) {
    if (this.get('cache')[key] && (this.get('cache')[key].timestamp >= (new Date()).getTime() - this.get('cacheTime')*60000)) {
      return Ember.RSVP.resolve(this.get('cache')[key].data);
    }
    return null;
  },

  /**
  * Сохранить данные в локальный кеш
  */
  setCache(key, data) {
    this.get('cache')[key] = {
      timestamp: (new Date()).getTime(),
      data: data,
    }
  },

  /**
  * Получить список всех турниров
  */
  getTournaments() {
    const cacheKey = 'tournaments';
    return this.checkCache(cacheKey) || this.loadURL('api/tournaments.json').then(data => {
      let result = data.items.filter(item => {
        return item.type_name === 'Синхрон' && (new Date(item.date_end) <= new Date());
      });
      this.setCache(cacheKey, result);
      return result;
    });
  },

  /**
  * Получить статистику команд по турниру
  */
  getTournamentStats(id) {
    const cacheKey = `stats-${this.get('city')}-${id}`;
    return this.checkCache(cacheKey) || this.loadURL(`tournament/${id}/tours/`, 'html').then(html => {
      const doc = Ember.$(html);
      const table = doc.find('#teams_table');
      const rows = table.find('TBODY TR');
      let data = {
        name: doc.find('H1').text(),
        tours: table.find('THEAD TH[data-tour]').length,
        questions: parseInt(doc.find('.center_message em').text().replace(/[^0-9]+/g, '')),
        commands: []
      }
      for (let i = 0; i < rows.length; i++) {
        let tds = Ember.$(rows[i]).children();
        let city = tds[2].textContent.trim();
        if (city.toLowerCase() === this.get('city').toLowerCase().trim()) {
          let stat = {
            city: city,
            name: tds[1].textContent.trim(),
            place: tds[3].textContent.trim(),
            total: tds[4].textContent.trim(),
            realName: Ember.$(tds[1]).find('A[title]').attr('title'),
            results: {}
          }
          for (let j = 1; j <= data.tours; j++) {
            stat.results[j] = JSON.parse(tds[j+5].dataset.mask);
          }
          data.commands.push(stat);
        }
      }
      doc.remove();
      this.setCache(cacheKey, data);
      return data;
    });
  },

  /**
  * Получить проценты взятия вопросов по турниру
  */
  getTournamentPercentage(id) {
    const cacheKey = `percentage-${id}`;
    return this.checkCache(cacheKey) || this.loadURL(`tournament/${id}/statistics/`, 'html').then(html => {
      const doc = Ember.$(html);
      const table = doc.find('#question_statistics_table');
      const rows = table.find('TBODY TR');
      let data = {}
      for (let i = 0; i < rows.length; i++) {
        let tds = Ember.$(rows[i]).children();
        data[tds[0].textContent.trim()] = parseFloat(tds[2].textContent.trim()).toFixed(1);
      }
      doc.remove();
      this.setCache(cacheKey, data);
      return data;
    });
  }
});
