import 'emoji-log';
import {browser} from 'webextension-polyfill-ts';

browser.runtime.onInstalled.addListener((): void => {
  console.emoji('🦄', 'extension installed');
});

browser.contextMenus.create({
  id: 'copyHierarchicalJsonLog',
  title: 'Copy hierarchical JSON log',
  contexts: ['selection'],
});

function copy(text: string): void {
  const copyFrom = document.createElement('textarea');
  copyFrom.textContent = text;
  document.body.appendChild(copyFrom);
  copyFrom.select();
  document.execCommand('copy');
  copyFrom.blur();
  document.body.removeChild(copyFrom);
}

function getJsonText(input: unknown): string | undefined {
  if (typeof input !== 'string') {
    return undefined;
  }
  const startIndex = input.indexOf('{');
  const endIndex = input.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1) {
    return undefined;
  }
  return input.substring(startIndex, endIndex + 1);
}

browser.contextMenus.onClicked.addListener(async () => {
  const results = await browser.tabs.executeScript({
    code: 'window.getSelection().toString();',
  });

  const jsonText = getJsonText(results[0]);
  if (!jsonText) {
    return;
  }

  console.log('Received JSON:', jsonText);
  const json = JSON.parse(jsonText);
  if (typeof json.body === 'string') {
    json.body = JSON.parse(json.body);
  }
  copy(JSON.stringify(json, null, 2));

  const notificationId = await browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('assets/icons/favicon-48.png'),
    title: 'Copied',
    message: 'Copied hierarchical JSON log',
  });
  setTimeout(() => {
    browser.notifications.clear(notificationId);
  }, 200);
});
