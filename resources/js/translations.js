import { usePage } from '@inertiajs/react';

export function __ (key, replacements = {}) {
    const { translations } = usePage().props;
    let translation = translations[key] || key;

    Object.keys(replacements).forEach(r => {
        translation = translation.replace(`:${r}`, replacements[r]);
    });

    return translation;
}
