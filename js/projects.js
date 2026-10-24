/**
 * Projects list: loads public repositories from the GitHub REST API and
 * renders them as cards before the placeholder card.
 */

import { translate } from './i18n.js';

const DATA_URL = 'data/projects.json';
const PLACEHOLDER_URL = 'assets/placeholder.svg';

let repositories = [];
let query = '';

let activeLanguage = null;

/** True when no language is chosen or the repository uses the chosen one. */
function matchesLanguage(repository) {
  return activeLanguage === null || repository.language === activeLanguage;
}
let activeIndex = 0;

/** Stores each card's distance from the front card in the CSS variable --offset. */
function updateStack() {
  const cards = [...document.querySelectorAll('.projects__grid [data-repository]')];
  activeIndex = Math.min(activeIndex, Math.max(cards.length - 1, 0));
  cards.forEach((card, index) => {
    card.style.setProperty('--offset', String(index - activeIndex));
    card.toggleAttribute('data-active', index === activeIndex);
  });
}

/** True when the repository name, description or language contains the typed text. */
function matchesQuery(repository) {
  const text = [repository.name, repository.description, repository.language]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(query.trim().toLowerCase());
}

/** Opens project pages in the same tab and outside sites in a new one. */
function setLinkTarget(link, url) {
  link.href = url;
  if (/^https?:/.test(url)) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
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
    setLinkTarget(link, repository.url);
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

  if (repository.stars > 0) {
    const stars = document.createElement('span');
    stars.className = 'project-card__stars';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', 'assets/icons.svg#star');
    icon.append(use);

    stars.append(icon, repository.stars.toLocaleString(document.documentElement.lang));
    body.append(stars);
  }

  const updated = document.createElement('time');
  updated.className = 'project-card__updated';
  updated.dateTime = repository.pushed_at;
  updated.textContent = dateFormat.format(new Date(repository.pushed_at));
  body.append(updated);
  if (repository.url) {
    const open = document.createElement('a');
    open.className = 'project-card__open';
    open.dataset.i18n = 'projects.open';
    open.textContent = 'View project';
    setLinkTarget(open, repository.url);
    body.append(open);
  }

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

  updateStack();
  translate(grid);
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
    grid.tabIndex = option.dataset.view === 'main' ? 0 : -1;
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

/** Number of project cards currently shown. */
function getCardCount() {
  return document.querySelectorAll('.projects__grid [data-repository]').length;
}

/** Brings the card with the given index to the front. */
function goTo(index) {
  activeIndex = index;
  updateStack();
}

/** In the main view, the wheel and the arrow keys move through the projects. */
function initGallery() {
  const grid = document.querySelector('.projects__grid');
  if (!grid) return;

  let lockedUntil = 0;

  grid.addEventListener(
    'wheel',
    (event) => {
      if (grid.dataset.view !== 'main' || event.ctrlKey) return;
      if (!event.target.closest('.project-card__preview')) return;

      const direction = Math.sign(event.deltaY);
      const next = activeIndex + direction;
      // At either end the page scrolls as usual.
      if (direction === 0 || next < 0 || next >= getCardCount()) return;

      event.preventDefault();
      if (event.timeStamp < lockedUntil) return;
      lockedUntil = event.timeStamp + 400;
      goTo(next);
    },
    { passive: false },
  );

  grid.addEventListener('keydown', (event) => {
    if (grid.dataset.view !== 'main') return;

    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    const next = activeIndex + (step ?? 0);
    if (!step || next < 0 || next >= getCardCount()) return;

    event.preventDefault();
    goTo(next);
  });

  // Touch: swiping left over the front image shows the next project.
  let swipeStartX = null;

  grid.addEventListener('pointerdown', (event) => {
    if (grid.dataset.view !== 'main' || event.pointerType !== 'touch') return;
    if (!event.target.closest('.project-card__preview')) return;
    swipeStartX = event.clientX;
  });

  grid.addEventListener('pointerup', (event) => {
    if (swipeStartX === null) return;

    const distance = event.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(distance) < 40) return;

    const next = activeIndex + (distance < 0 ? 1 : -1);
    if (next < 0 || next >= getCardCount()) return;
    goTo(next);
  });

  grid.addEventListener('pointercancel', () => {
    swipeStartX = null;
  });
}

async function init() {
  initSearch();
  initViews();
  initGallery();
  
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