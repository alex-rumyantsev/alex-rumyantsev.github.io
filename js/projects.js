/**
 * Projects list: loads public repositories from the GitHub REST API and
 * renders them as cards before the placeholder card.
 */

const DATA_URL = 'data/projects.json';
const PLACEHOLDER_URL = 'assets/placeholder.svg';

let repositories = [];
let query = '';

let activeLanguage = null;

/** True when no language is chosen or the repository uses the chosen one. */
function matchesLanguage(repository) {
  return activeLanguage === null || repository.language === activeLanguage;
}

/** True when the repository name, description or language contains the typed text. */
function matchesQuery(repository) {
  const text = [repository.name, repository.description, repository.language]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(query.trim().toLowerCase());
}

/** Builds one project card from a repository object. */
function createCard(repository, dateFormat) {
  const card = document.createElement('article');
  card.className = 'project-card';
  card.dataset.repository = repository.name;

  const preview = document.createElement('img');
  preview.className = 'project-card__preview';
  preview.src = repository.preview ?? PLACEHOLDER_URL;
  preview.alt = '';
  preview.loading = 'lazy';
  preview.addEventListener(
    'error',
    () => {
      preview.src = PLACEHOLDER_URL;
    },
    { once: true },
  );
  card.append(preview);

  const body = document.createElement('div');
  body.className = 'project-card__body';

  const title = document.createElement('h3');
  if (repository.url) {
    const link = document.createElement('a');
    link.href = repository.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = repository.name;
    title.append(link);
  } else {
    title.textContent = repository.name;
  }
  body.append(title);

  if (repository.description) {
    const description = document.createElement('p');
    description.textContent = repository.description;
    body.append(description);
  }

  if (repository.language) {
    const tags = document.createElement('ul');
    tags.className = 'project-card__tags';
    const tag = document.createElement('li');
    tag.textContent = repository.language;
    tags.append(tag);
    body.append(tags);
  }

  const updated = document.createElement('time');
  updated.className = 'project-card__updated';
  updated.dateTime = repository.pushed_at;
  updated.textContent = dateFormat.format(new Date(repository.pushed_at));
  body.append(updated);

  card.append(body);
  return card;
}

/** Replaces the rendered cards, newest push first. */
function render() {
  const grid = document.querySelector('.projects__grid');
  if (!grid || repositories.length === 0) return;

  const dateFormat = new Intl.DateTimeFormat(document.documentElement.lang, {
    dateStyle: 'medium',
  });
  const cards = [...repositories]
    .filter((repository) => matchesQuery(repository) && matchesLanguage(repository))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .map((repository) => createCard(repository, dateFormat));

  grid.querySelectorAll('[data-repository]').forEach((card) => card.remove());
  grid.prepend(...cards);
}

/** Opens and closes the search field and filters the cards while typing. */
function initSearch() {
  const button = document.querySelector('[data-action="search"]');
  const input = document.querySelector('.projects__search');
  if (!button || !input) return;

  button.addEventListener('click', () => {
    input.hidden = !input.hidden;
    if (input.hidden) {
      input.value = '';
      query = '';
      render();
    } else {
      input.focus();
    }
  });

  input.addEventListener('input', () => {
    query = input.value;
    render();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      button.click();
      button.focus();
    }
  });
}

/** Builds the language menu and filters the cards by the chosen language. */
function initFilter() {
  const wrapper = document.querySelector('.projects__filter');
  const button = document.querySelector('[data-action="filter"]');
  const menu = document.getElementById('filter-menu');
  if (!wrapper || !button || !menu) return;

  const languages = [...new Set(repositories.map((repository) => repository.language))]
    .filter(Boolean)
    .sort();
  wrapper.hidden = languages.length === 0;

  function setMenuOpen(isOpen) {
    menu.hidden = !isOpen;
    button.setAttribute('aria-expanded', String(isOpen));
  }

  menu.replaceChildren(
    ...languages.map((language) => {
      const listItem = document.createElement('li');
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'filter-option';
      option.dataset.language = language;
      option.textContent = language;
      option.setAttribute('aria-pressed', 'false');
      listItem.append(option);
      return listItem;
    }),
  );

  menu.addEventListener('click', (event) => {
    const option = event.target.closest('.filter-option');
    if (!option) return;

    // Choosing the active language again clears the filter.
    activeLanguage = activeLanguage === option.dataset.language ? null : option.dataset.language;
    menu.querySelectorAll('.filter-option').forEach((item) => {
      item.setAttribute('aria-pressed', String(item.dataset.language === activeLanguage));
    });
    setMenuOpen(false);
    render();
  });

  button.addEventListener('click', () => setMenuOpen(menu.hidden));

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) setMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
}

/** Opens the view menu and switches the grid between the available views. */
function initViews() {
  const wrapper = document.querySelector('.projects__views');
  const button = document.querySelector('[data-action="view"]');
  const menu = document.getElementById('view-menu');
  const grid = document.querySelector('.projects__grid');
  if (!wrapper || !button || !menu || !grid) return;

  const buttonIcon = button.querySelector('use');

  function setMenuOpen(isOpen) {
    menu.hidden = !isOpen;
    button.setAttribute('aria-expanded', String(isOpen));
  }

  menu.addEventListener('click', (event) => {
    const option = event.target.closest('[data-view]');
    if (!option) return;

    grid.dataset.view = option.dataset.view;
    menu.querySelectorAll('[data-view]').forEach((item) => {
      item.setAttribute('aria-pressed', String(item === option));
    });
    // The main button shows the icon of the current view.
    buttonIcon.setAttribute('href', `assets/icons.svg#${option.dataset.view}`);
    setMenuOpen(false);
  });

  button.addEventListener('click', () => setMenuOpen(menu.hidden));

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) setMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
}

async function init() {
  initSearch();
  initViews();
  
  // Re-render so the dates follow the selected language.
  document.addEventListener('site:language-change', render);

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Cannot load projects (HTTP ${response.status})`);
    }
    repositories = await response.json();
  } catch (error) {
    // The placeholder card stays as the fallback.
    console.error(error);
    return;
  }

  initFilter();
  render();
}

init();