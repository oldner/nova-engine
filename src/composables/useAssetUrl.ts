import { ref, watchEffect, toValue, type MaybeRefOrGetter } from 'vue';
import { readFile } from '@tauri-apps/plugin-fs';

const assetCache = new Map<string, string>();

export function useAssetUrl(pathSource: MaybeRefOrGetter<string | undefined | null>) {
    const url = ref<string>('');
    const error = ref<any>(null);

    watchEffect(async () => {
        const path = toValue(pathSource);

        if (!path) {
            url.value = '';
            return;
        }

        if (assetCache.has(path)) {
            url.value = assetCache.get(path)!;
            return;
        }

        try {
            // Read file as binary Uint8Array
            const contents = await readFile(path);
            const blob = new Blob([contents]);
            const objectUrl = URL.createObjectURL(blob);

            assetCache.set(path, objectUrl);
            url.value = objectUrl;
        } catch (e) {
            console.error('Failed to load asset blob:', path, e);
            error.value = e;
        }
    });

    return { url, error };
}
