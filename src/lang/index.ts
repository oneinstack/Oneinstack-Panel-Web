import { createI18n } from 'vue-i18n';
import zh from './modules/zh'; // 中文
import en from './modules/en'; // 英文
import id from './modules/id'; // 印度尼西亚语
import hi from './modules/hi'; // 印地语
import es from './modules/es'; // 西班牙语
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
