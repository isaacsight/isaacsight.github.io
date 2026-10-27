// Respect visitor preferences; navigation and project reading work without JavaScript.
document.querySelectorAll('details').forEach(section => {
  section.addEventListener('toggle', () => {
    section.classList.toggle('is-open', section.open);
  });
});
