// DOM overlays: the title wall (museum name + epigraph, the first thing seen),
// the BYO-key panel for the optional living curator, and the untethered warning.
// All plain DOM, all dismissable, all keyboard-free of frameworks.

import type { Codex } from '../codex/types';

function div(cls: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = cls;
  return d;
}

export interface TitleCallbacks {
  onEnter(): void;
  onUntethered(): void;
  onKeyPanel(): void;
  hasKey: boolean;
}

/** The title wall. Returns a remove() to dismiss it once the visitor enters. */
export function showTitleWall(codex: Codex, cb: TitleCallbacks): () => void {
  const overlay = div('overlay');

  const name = document.createElement('h1');
  name.className = 'museum-name';
  name.textContent = codex.museumName;

  const epi = document.createElement('p');
  epi.className = 'epigraph';
  epi.textContent = `“${codex.epigraph}”`;

  const founded = div('founded');
  founded.textContent = `Founded ${codex.founded} · ${codex.movements.length} movements · ${codex.artists.length} artists`;

  const enter = document.createElement('button');
  enter.className = 'enter';
  enter.textContent = 'Enter the museum';
  enter.addEventListener('click', cb.onEnter);

  const sub = div('sub-actions');
  const unteth = document.createElement('button');
  unteth.className = 'linkish';
  unteth.textContent = 'Enter untethered (a museum that will not exist again)';
  unteth.addEventListener('click', cb.onUntethered);

  const key = document.createElement('button');
  key.className = 'linkish';
  key.textContent = cb.hasKey ? 'Curator key: connected' : 'Add your own curator (API key)';
  key.addEventListener('click', cb.onKeyPanel);

  sub.append(unteth, key);
  overlay.append(name, epi, founded, enter, sub);
  document.body.append(overlay);

  return () => overlay.remove();
}

export interface KeyCallbacks {
  current: string | null;
  onSave(key: string | null): void;
  onClose(): void;
}

/** The optional Anthropic key panel. Stored in localStorage only, never sent
 *  anywhere but Anthropic. Clearly explains the keyless default still works. */
export function showKeyPanel(cb: KeyCallbacks): void {
  const overlay = div('overlay');
  const panel = div('panel');

  panel.innerHTML = `
    <h2>The Living Curator</h2>
    <p>Optional. Paste an Anthropic API key and a bespoke Codex and bespoke
    placards will be written for this museum, in the browser, on entry. The key
    is stored only in this browser's localStorage and is sent only to Anthropic.
    Leave it empty and the museum still generates everything, keyless and offline.</p>
  `;

  const input = document.createElement('input');
  input.type = 'password';
  input.placeholder = 'sk-ant-...';
  input.value = cb.current ?? '';
  panel.append(input);

  const note = document.createElement('p');
  note.className = 'warn';
  note.style.fontSize = '12px';
  note.textContent = 'Never commit this key. It lives only in your browser.';
  panel.append(note);

  const row = div('row');
  const save = document.createElement('button');
  save.className = 'enter';
  save.style.fontSize = '13px';
  save.textContent = 'Save';
  save.addEventListener('click', () => {
    cb.onSave(input.value.trim() || null);
    overlay.remove();
  });
  const clear = document.createElement('button');
  clear.className = 'linkish';
  clear.textContent = 'Remove key';
  clear.addEventListener('click', () => {
    cb.onSave(null);
    overlay.remove();
  });
  const close = document.createElement('button');
  close.className = 'linkish';
  close.textContent = 'Cancel';
  close.addEventListener('click', () => {
    cb.onClose();
    overlay.remove();
  });
  row.append(save, clear, close);
  panel.append(row);

  overlay.append(panel);
  document.body.append(overlay);
}
