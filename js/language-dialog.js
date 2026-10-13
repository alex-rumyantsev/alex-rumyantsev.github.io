/**
 * Language dialog: opens from the footer button, filters the list while the
 * visitor types, switches the site language on selection, and keeps the
 * footer button in sync with the current language.
 */

import { selectLanguage } from './i18n.js';

function init() {
  const dialog = document.getElementById('language-dialog');
  const openButton = document.querySelector('.lang-button');
  if (!dialog || !openButton) return;

  const search = dialog.querySelector('.language-dialog__search');
  const list = dialog.querySelector('.language-dialog__list');
  const options = [...dialog.querySelectorAll('.language-option')];
  const buttonName = openButton.querySelector('.lang-button__name');
  const buttonRegion = openButton.querySelector('.lang-button__region');

  /** Shows only the options that match the typed text. */
  function filterOptions(query) {
    const normalizedQuery = query.trim().toLowerCase();
    for (const option of options) {
      const searchableText = `${option.textContent} ${option.dataset.search}`.toLowerCase();
      option.closest('li').hidden = !searchableText.includes(normalizedQuery);
    }
  }

  /** Copies the selected option's name and region onto the footer button. */
  function updateButton(language) {
    const option = options.find((item) => item.dataset.language === language);
    if (!option) return;
    buttonName.textContent = option.querySelector('.language-option__name').textContent;
    buttonRegion.textContent = option.querySelector('.language-option__region').textContent;
  }

  openButton.addEventListener('click', () => {
    search.value = '';
    filterOptions('');
    dialog.showModal();
  });

  search.addEventListener('input', () => filterOptions(search.value));

  list.addEventListener('click', async (event) => {
    const option = event.target.closest('.language-option');
    if (!option) return;

    try {
      await selectLanguage(option.dataset.language);
    } catch (error) {
      // Keep the dialog open so the visitor can try again.
      console.error(error);
      return;
    }
    dialog.close();
  });

  // A click outside the dialog's box lands on the backdrop and closes it.
  dialog.addEventListener('click', (event) => {
    const box = dialog.getBoundingClientRect();
    const isInside =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;
    if (!isInside) dialog.close();
  });

  document.addEventListener('site:language-change', (event) => {
    updateButton(event.detail.language);
  });
}

init();