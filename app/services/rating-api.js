import Ember from 'ember';
import config from '../config/environment';

export default Ember.Service.extend({
  urlPrefix: '//cors-anywhere.herokuapp.com/http://rating.chgk.info/',
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
    return this.checkCache(cacheKey) || this.loadURL(`tournaments.php?tournament_type=3&order=date_end&page=1`, 'html').then(html => {
      const doc = Ember.$(html);
      const table = doc.find('.tournaments_list_table');
      const rows = table.find('TBODY TR:not(".tournament_in_future")');
      if (!rows || !rows.length) {
        throw new Error('Не удалось получить список турниров');
      }
      let data = [];
      for (let i = 0; i < rows.length; i++) {
        const tds = Ember.$(rows[i]).children();
        if (tds.length < 7) {
          continue;
        }
        const date_end = tds[2].textContent.trim();
        const date_end_int = new Date(date_end.replace(/^(\d{2})\.(\d{2})\.(\d{2})$/, '20$3-$2-$1'));
        if (date_end_int > new Date()) {
          continue;
        }
        const idtournament = tds[0].textContent.trim();
        const name = tds[1].textContent.trim();
        const dl = Ember.$(tds[5]).find('.var-dl').text().trim();
        data.push({ idtournament, name, date_end, dl });
      }
      doc.remove();
      this.setCache(cacheKey, data);
      return data;
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
      if (!rows || !rows.length) {
        throw new Error('Не удалось получить статистику по командам');
      }
      let data = {
        name: doc.find('H1').text(),
        tours: table.find('THEAD TH[data-tour]').length,
        questions: parseInt(doc.find('.center_message em').text().replace(/[^0-9]+/g, '')),
        commandsTotal: parseInt(doc.find('#tournament_info').html().match(/Количество команд[^\d]+(\d+)/)[1]),
        commands: []
      }
      for (let i = 0; i < rows.length; i++) {
        const tds = Ember.$(rows[i]).children();
        const city = tds[2].textContent.trim();
        if (city.toLowerCase() === this.get('city').toLowerCase().trim()) {
          const id = tds[1].innerHTML.match(/team\/(\d+)/)[1];
          const stat = {
            id: id,
            city: city,
            name: tds[1].textContent.trim(),
            place: tds[3].textContent.trim(),
            total: tds[4].textContent.trim(),
            realName: Ember.$(tds[1]).find('A[title]').attr('title'),
            results: {}
          }
          for (let j = 1; j <= data.tours; j++) {
            if (!tds[j+5].dataset.mask) {
              throw new Error(`Нет данных за ${j} тур`);
            }
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
      if (!rows || !rows.length) {
        throw new Error('Не удалось получить статистику взятия');
      }
      let data = {}
      for (let i = 0; i < rows.length; i++) {
        let tds = Ember.$(rows[i]).children();
        data[tds[0].textContent.trim()] = {
          number: parseInt(tds[1].textContent.trim()),
          percent: parseFloat(tds[2].textContent.trim()).toFixed(1)
        }
      }
      doc.remove();
      this.setCache(cacheKey, data);
      return data;
    });
  },

  /**
  * Получить рейтинги и составы команд
  */
  getTournamentRating(id) {
    const cacheKey = `rating-${this.get('city')}-${id}`;
    return this.checkCache(cacheKey) || this.loadURL(`tournament/${id}/`, 'html').then(html => {
      const doc = Ember.$(html);
      const table = doc.find('#teams_table');
      const rows = table.find('TBODY TR');
      if (!rows || !rows.length) {
        throw new Error('Не удалось получить статистику по командам');
      }
      let data = {}
      for (let i = 0; i < rows.length; i++) {
        const tds = Ember.$(rows[i]).children();
        const city = tds[2].textContent.trim();
        if (city.toLowerCase() === this.get('city').toLowerCase().trim()) {
          const id = tds[1].innerHTML.match(/team\/(\d+)/)[1];
          const stat = {
            bonus: Ember.$(tds[9]).find('A').text().trim(),
            people: Ember.$(tds[3]).find('.team_details').html().replace(/\s+/g, ' ').replace(/<br[^>]*>/g, "\n").replace(/<[^>]+>/g, '').replace(/\s*\n\s*/g, "\n").trim()
          }
          data[id] = stat;
        }
      }
      doc.remove();
      this.setCache(cacheKey, data);
      return data;
    });
  }
});
