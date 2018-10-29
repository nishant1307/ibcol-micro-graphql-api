const _ = require('lodash');

const translate = (translatable, locale) => {

  // console.log('translate', translatable, locale);

  if (typeof (translatable) === 'string')
    return translatable;

  if (_.isEmpty(translatable))
    return "";

  let translated = _.find(translatable, { locale });


  // console.log('translated', translated);

  if (locale !== process.env.LOCALE_DEFAULT) {
    if (_.isEmpty(translated)) {
      translated = _.find(translatable, {
        locale: process.env.LOCALE_DEFAULT
      });
    } else {
      if (_.isEmpty(translated.translation)) {
        translated = _.find(translatable, {
          locale: process.env.LOCALE_DEFAULT
        });
      }
    }
  }
    

  return translated === undefined ? "" : translated.translation;

}

module.exports = translate;