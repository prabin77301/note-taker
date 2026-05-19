window.addEventListener('DOMContentLoaded', async () => {

    const textarea = document.getElementById('note');
    const titleInput = document.getElementById('note-title');
    const saveBtn = document.getElementById('save');
    const saveAsBtn = document.getElementById('save-as');
    const openFileBtn = document.getElementById('open-file');
    const newNoteBtn = document.getElementById('new-note');
    const noteList = document.getElementById('note-list');
    const statusEl = document.getElementById('save_status');

    // State
    let notes = [];
    let currentNoteId = null;
    let lastSavedContent = '';
    let debounceTimer = null;

    const savedNote = await window.electronAPI.loadNote();
    textarea.value = savedNote || '';

    let lastSavedText = savedNote || '';
    let currentFilePath = null;

    // Render notes list
    function renderNoteList() {
        noteList.innerHTML = '';

        notes.forEach(note => {
            const item = document.createElement('div');

            item.className =
                'note-item' +
                (note.id === currentNoteId ? ' active' : '');

            item.innerHTML = `
                <button class="note-item-delete" data-id="${note.id}">x</button>
                <div class="note-item-title">
                    ${note.title || 'Untitled'}
                </div>
                <div class="note-item-date">
                    ${new Date(note.updatedAt).toLocaleDateString()}
                </div>
            `;

            // Open note
            item.addEventListener('click', async (e) => {
                if (e.target.classList.contains('note-item-delete')) return;
                await switchNote(note.id);
            });

            // Delete note
            item.querySelector('.note-item-delete')
                .addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await deleteNote(note.id);
                });

            noteList.appendChild(item);
        });
    }

    // Switch notes
    async function switchNote(id) {

        if (textarea.value !== lastSavedContent) {
            const result = await window.electronAPI.newNote();

            if (!result.confirmed) return;
        }

        const note = notes.find(n => n.id === id);

        if (!note) return;

        currentNoteId = note.id;

        titleInput.value = note.title || '';
        textarea.value = note.content || '';

        lastSavedContent = note.content || '';

        statusEl.textContent = '';

        renderNoteList();
    }

    // Save current note
    async function saveCurrentNote() {

        if (!currentNoteId) return;

        const note = {
            id: currentNoteId,
            title: titleInput.value || 'Untitled',
            content: textarea.value
        };

        await window.electronAPI.saveNoteJson(note);

        lastSavedContent = textarea.value;

        const index = notes.findIndex(
            n => n.id === currentNoteId
        );

        if (index !== -1) {
            notes[index] = {
                ...notes[index],
                ...note,
                updatedAt: new Date().toISOString()
            };
        }

        renderNoteList();

        statusEl.textContent =
            `Saved at ${new Date().toLocaleTimeString()}`;
    }

    // Delete note
    async function deleteNote(id) {

        const result = await window.electronAPI.newNote();

        if (!result.confirmed) return;

        await window.electronAPI.deleteNote(id);

        notes = notes.filter(n => n.id !== id);

        if (currentNoteId === id) {
            currentNoteId = null;

            titleInput.value = '';
            textarea.value = '';

            lastSavedContent = '';

            statusEl.textContent = 'Note deleted.';
        }

        renderNoteList();
    }

    // Save button
    saveBtn.addEventListener('click', async () => {

        await saveCurrentNote();

        try {

            const result = await window.electronAPI.smartSave(
                textarea.value,
                currentFilePath
            );

            lastSavedText = textarea.value;
            currentFilePath = result.filePath;

            statusEl.textContent =
                `Saved to: ${result.filePath}`;

        } catch (err) {

            console.error('Save failed:', err);

            statusEl.textContent = 'Save failed!';
        }
    });

    // Save As button
    saveAsBtn.addEventListener('click', async () => {
      statusEl.textContent = 'Saved Successfully!';

        try {

            const result =
                await window.electronAPI.saveAs(
                    textarea.value
                );

            if (result.success) {

                currentFilePath = result.filePath;

                lastSavedText = textarea.value;

                statusEl.textContent =
                    `Saved to: ${result.filePath}`;

            } else {

                statusEl.textContent =
                    'Save As cancelled.';
            }

        } catch (err) {

            console.error('Save As failed:', err);

            statusEl.textContent = 'Save As failed!';
        }
    });

    // New note
    newNoteBtn.addEventListener('click', async () => {

        if (textarea.value !== lastSavedContent) {

            const result =
                await window.electronAPI.newNote();

            if (!result.confirmed) return;
        }

        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await window.electronAPI.saveNoteJson(newNote);

        notes.unshift(newNote);

        currentNoteId = newNote.id;

        titleInput.value = '';
        textarea.value = '';

        lastSavedContent = '';

        renderNoteList();

        titleInput.focus();

        statusEl.textContent = 'New note created.';
    });

    // Open file
    openFileBtn.addEventListener('click', async () => {

        const result =
            await window.electronAPI.openFile();

        if (result.success) {

            textarea.value = result.content;

            lastSavedText = result.content;

            currentFilePath = result.filePath;

            statusEl.textContent =
                `Opened: ${result.filePath}`;

        } else {

            statusEl.textContent = 'Open cancelled.';
        }
    });

    // Auto-save content
    textarea.addEventListener('input', () => {

        statusEl.textContent = 'Unsaved changes...';

        clearTimeout(debounceTimer);

        debounceTimer =
            setTimeout(saveCurrentNote, 5000);
    });

    // Auto-save title
    titleInput.addEventListener('input', () => {

        clearTimeout(debounceTimer);

        debounceTimer =
            setTimeout(saveCurrentNote, 5000);
    });

    // Load notes
    notes = await window.electronAPI.getNotes();

    if (notes.length > 0) {

        const mostRecent = notes.reduce((a, b) =>
            new Date(a.updatedAt) >
            new Date(b.updatedAt)
                ? a
                : b
        );

        await switchNote(mostRecent.id);

    } else {

        newNoteBtn.click();
    }

    renderNoteList();

    // Menu actions
    window.electronAPI.onMenuAction(
        'menu-new-note',
        () => {
            newNoteBtn.click();
        }
    );

    window.electronAPI.onMenuAction(
        'menu-open-file',
        () => {
            openFileBtn.click();
        }
    );

    window.electronAPI.onMenuAction(
        'menu-save',
        () => {
            saveBtn.click();
        }
    );

    window.electronAPI.onMenuAction(
        'menu-save-as',
        () => {
            saveAsBtn.click();
        }
    );
});