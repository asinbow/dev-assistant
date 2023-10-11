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

browser.contextMenus.create({
  id: 'copyStackTraceFromJsonLog',
  title: 'Copy stack trace from JSON log',
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

async function copyJsonLog(
  message: string,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  toText: (json: any) => string
): Promise<void> {
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
  copy(toText(json));

  const notificationId = await browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('assets/icons/favicon-48.png'),
    title: 'Copied',
    message,
  });
  setTimeout(() => {
    browser.notifications.clear(notificationId);
  }, 200);
}

browser.contextMenus.onClicked.addListener(async ({menuItemId}) => {
  try {
    if (menuItemId === 'copyHierarchicalJsonLog') {
      await copyJsonLog('Copied hierarchical JSON log', (json) => JSON.stringify(json, null, 2));
    }

    if (menuItemId === 'copyStackTraceFromJsonLog') {
      await copyJsonLog(
        'Copied stack trace from JSON log',
        (json) => json.body.stack_trace
      );
    }
  } catch (error) {
    console.error(error);
    const notificationId = await browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('assets/icons/favicon-48.png'),
      title: 'Error',
      message: error.message,
    });
    setTimeout(() => {
      browser.notifications.clear(notificationId);
    }, 500);
  }
});
