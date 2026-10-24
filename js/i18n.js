/**
 * Site language switching.
 *
 * Translations live in locales/<code>.json. Elements are marked in the HTML:
 *   data-i18n="key"             replaces the element's text
 *   data-i18n-alt="key"         replaces the alt attribute
 *   data-i18n-aria-label="key"  replaces the aria-label attribute
 */

const SUPPORTED_LANGUAGES = ['en', 'ru', 'zh'];
const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'language';

let currentTranslations = null;

/** Returns the language saved earlier in this browser, or null. */
function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

/** Remembers the visitor's choice for the next visit. */
function saveLanguage(language) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable (for example, in private mode). Ignore.
  }
}

/** Downloads and parses locales/<language>.json. */
async function loadTranslations(language) {
  const response = await fetch(`locales/${language}.json`);
  if (!response.ok) {
    throw new Error(`Cannot load "${language}" translations (HTTP ${response.status})`);
  }
  return response.json();
}

/** Writes the translated texts into every marked element on the page. */
function applyTranslations(translations, root = document) {
  const targets = [
    {
      selector: '[data-i18n]',
      dataKey: 'i18n',
      apply: (element, text) => {
        element.textContent = text;
      },
    },
    {
      selector: '[data-i18n-alt]',
      dataKey: 'i18nAlt',
      apply: (element, text) => element.setAttribute('alt', text),
    },
    {
      selector: '[data-i18n-aria-label]',
      dataKey: 'i18nAriaLabel',
      apply: (element, text) => element.setAttribute('aria-label', text),
    },
    {
      selector: '[data-i18n-placeholder]',
      dataKey: 'i18nPlaceholder',
      apply: (element, text) => element.setAttribute('placeholder', text),
    },
  ];

  for (const { selector, dataKey, apply } of targets) {
    root.querySelectorAll(selector).forEach((element) => {
      const key = element.dataset[dataKey];
      if (key in translations) {
        apply(element, translations[key]);
      } else {
        console.warn(`Missing translation key: "${key}"`);
      }
    });
  }
}

/** Shows the page in the given language. */
export async function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(`Unsupported language: "${language}"`);
  }
  const translations = await loadTranslations(language);
  currentTranslations = translations;
  applyTranslations(translations);
  document.documentElement.lang = language;
  document.dispatchEvent(
    new CustomEvent('site:language-change', { detail: { language } }),
  );
}

/** Translates the marked elements inside a part of the page that was added later. */
export function translate(root) {
  if (currentTranslations) applyTranslations(currentTranslations, root);
}

/** Shows the page in the given language and remembers the choice. */
export async function selectLanguage(language) {
  await setLanguage(language);
  saveLanguage(language);
}

/** On page load: use the saved language, or the default one. */
async function init() {
  try {
    await setLanguage(getSavedLanguage() ?? DEFAULT_LANGUAGE);
  } catch (error) {
    // The English text written in the HTML stays as the fallback.
    console.error(error);
  }
}

init();