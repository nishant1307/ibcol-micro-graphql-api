const _ = require('lodash');

const updateTranslatable = ({data = [], update, locale}) => {

  _.remove(data, (o) => { return o.locale === locale })

  data.push({
    locale, translation: update
  })

  console.log('updateTranslatable', data);

  return data;

}

module.exports = updateTranslatable;