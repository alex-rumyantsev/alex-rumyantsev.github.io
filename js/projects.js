/**
 * Projects list: loads public repositories from the GitHub REST API and
 * renders them as cards before the placeholder card.
 */

const API_URL = 'https://api.github.com/users/alex-rumyantsev/repos?per_page=100';

let repositories = [];

/** Builds one project card from a repository object. */
function createCard(repository, dateFormat) {
  const card = document.createElement('article');
  card.className = 'project-card';
  card.dataset.repository = repository.name;

  const title = document.createElement('h3');
  const link = document.createElement('a');
  link.href = repository.html_url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = repository.name;
  title.append(link);
  card.append(title);

  if (repository.description) {
    const description = document.createElement('p');
    description.textContent = repository.description;
    card.append(description);
  }

  if (repository.language) {
    const tags = document.createElement('ul');
    tags.className = 'project-card__tags';
    const tag = document.createElement('li');
    tag.textContent = repository.language;
    tags.append(tag);
    card.append(tags);
  }

  const updated = document.createElement('time');
  updated.className = 'project-card__updated';
  updated.dateTime = repository.pushed_at;
  updated.textContent = dateFormat.format(new Date(repository.pushed_at));
  card.append(updated);

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
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .map((repository) => createCard(repository, dateFormat));

  grid.querySelectorAll('[data-repository]').forEach((card) => card.remove());
  grid.prepend(...cards);
}

async function init() {
  // Re-render so the dates follow the selected language.
  document.addEventListener('site:language-change', render);

  try {
    const response = await fetch(API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) {
      throw new Error(`Cannot load repositories (HTTP ${response.status})`);
    }
    repositories = await response.json();
  } catch (error) {
    // The placeholder card stays as the fallback.
    console.error(error);
    return;
  }

  render();
}

init();