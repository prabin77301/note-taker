window.addEventListener('DOMContentLoaded', async () => {
  const textarea = document.getElementById('note');
  const saveBtn = document.getElementById('save');
  const saveAsBtn = document.getElementById('save-as'); 
  const statusEl = document.getElementById('status');

  const savedNote = await window.electronAPI.loadNote();
  textarea.value = savedNote;

  let lastSavedText = savedNote;
  let currentFilePath = null;

  saveBtn.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.smartSave(textarea.value, currentFilePath);
    lastSavedText = textarea.value;
    currentFilePath = result.filePath;
    statusEl.textContent = `Saved to: ${result.filePath}`;
     alert('Note saved successfully!');
  } catch (err) {
    console.error('Save failed:', err);
    statusEl.textContent = 'Save failed!';
  }
});

 saveAsBtn.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.saveAs(textarea.value);

    if (result.success) {
      currentFilePath = result.filePath;
      lastSavedText = textarea.value;
      statusEl.textContent = `Saved to: ${result.filePath}`;
    } else {
      statusEl.textContent = 'Save As cancelled.';
    }
  } catch (err) {
    console.error('Save As failed:', err);
    statusEl.textContent = 'Save As failed!';
  }
});

  const newNoteBtn = document.getElementById('new-note');

  newNoteBtn.addEventListener('click', async () => {
    if (textarea.value === lastSavedText) {
      textarea.value = '';
      lastSavedText = '';
      statusEl.textContent = 'New note started.';
      return;
    }

    const result = await window.electronAPI.newNote();

    if (result.confirmed) {
      textarea.value = '';
      lastSavedText = '';
      statusEl.textContent = 'New note started.';
    } else {
      statusEl.textContent = 'New note cancelled.';
    }
  });

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

  window.electronAPI.onMenuAction('menu-new-note', () => {
    newNoteBtn.click();
  });

  window.electronAPI.onMenuAction('menu-open-file', () => {
    openFileBtn.click();
  });

  window.electronAPI.onMenuAction('menu-save', () => {
    saveBtn.click();
  });

  window.electronAPI.onMenuAction('menu-save-as', () => {
    saveAsBtn.click();
  });
});