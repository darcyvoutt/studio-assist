import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';
import { getName } from '@tauri-apps/api/app';

/**
 *
 * Note: There is a known issue with this API in which only works with Alert type.
 * The Banners which is default does not work when app is in focus.
 * Reference: https://github.com/tauri-apps/tauri/issues/5362
 *
 * @param {string} body - Message to display in notification
 * @returns
 */

export async function notify(body) {
  if (!await isPermissionGranted()) {
    const permissionResult = await requestPermission();

    if (permissionResult !== 'granted') {
      return;
    }
  }

  const appName = await getName();

  sendNotification({ body: body, title: appName });
}