/**
 * Hero video: tries to autoplay, falls back to the first click or key press
 * when the browser blocks autoplay, and drives the play/pause button.
 */

const INTERACTION_EVENTS = ['click', 'keydown'];

/** Shows the pause icon while the video plays and the play icon otherwise. */
function syncButton(video, button, icon) {
  const isPlaying = !video.paused;
  button.setAttribute('aria-pressed', String(isPlaying));
  icon.setAttribute('href', `assets/icons.svg#${isPlaying ? 'pause' : 'play'}`);
}

/** Retries playback on the first interaction and stops listening once it works. */
function startOnFirstInteraction(video) {
  const controller = new AbortController();

  async function start() {
    try {
      await video.play();
      controller.abort();
    } catch (error) {
      // Stay subscribed and try again on the next interaction.
      console.error(error);
    }
  }

  for (const type of INTERACTION_EVENTS) {
    document.addEventListener(type, start, { signal: controller.signal });
  }
}

async function init() {
  const video = document.querySelector('.hero__video');
  const button = document.querySelector('[data-action="toggle-video"]');
  const icon = button?.querySelector('use');
  if (!video || !button || !icon) return;

  const sync = () => syncButton(video, button, icon);
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  sync();

  button.addEventListener('click', async () => {
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      console.error(error);
    }
  });

  try {
    await video.play();
  } catch {
    startOnFirstInteraction(video);
  }
}

init();