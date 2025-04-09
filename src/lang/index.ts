import { createI18n } from 'vue-i18n';
import zh from './modules/zh';
import en from './modules/en';
import id from './modules/id';
import hi from './modules/hi';
import es from './modules/es';
const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem('lang') || 'zh',
    fallbackLocale: 'zh',
    globalInjection: true,
    messages: {
        zh,
        en,
        id,
        hi,
        es,
    },
    warnHtmlMessage: false,
});

export default i18n;
