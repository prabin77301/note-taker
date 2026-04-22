window.addEventListener('DOMContentLoaded', async () => {
  const textarea = document.getElementById('note');
  const saveBtn = document.getElementById('save');

  // Load saved note on startup
  const savedNote = await window.electronAPI.loadNote();
  textarea.value = savedNote;
  let lastSavedText = savedNote; // Track last saved state

  saveBtn.addEventListener('click', async () => {
    await window.electronAPI.saveNote(textarea.value);
    alert('Note saved successfully!');
    lastSavedText = textarea.value;
  });
  // NEW: Save As button
  const saveAsBtn = document.getElementById('save-as');

  saveAsBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.saveAs(textarea.value);
    if (result.success) {
      lastSavedText = textarea.value;
      statusEl.textContent = `Saved to: ${result.filePath}`;
    } else {
      statusEl.textContent = 'Save As cancelled.';

    }
    // NEW: New Note button


  });
  const newNoteBtn = document.getElementById('new-note');

  newNoteBtn.addEventListener('click', async () => {
    // If no unsaved changes, clear immediately
    if (textarea.value === lastSavedText) {
      textarea.value = '';
      lastSavedText = '';
      statusEl.textContent = 'New note started.';
      return;
    }

    // If there are unsaved changes, ask the user first
    const result = await window.electronAPI.newNote();

    if (result.confirmed) {
      textarea.value = '';
      lastSavedText = '';
      statusEl.textContent = 'New note started.';
    } else {
      statusEl.textContent = 'New note cancelled.';
    }});});
  
  // NEW: Open File button
 const openFileBtn = document.getElementById('open-file');

 openFileBtn.addEventListener('click', async () => {
  const result = await window.electronAPI.openFile();
  if (result.success) {
    textarea.value = result.content;
    lastSavedText = result.content;
    currentFilePath = result.filePath;
    statusEl.textContent = `Opened: ${result.filePath}`;
  } else {
    statusEl.textContent = 'Open cancelled.';
  }
});




