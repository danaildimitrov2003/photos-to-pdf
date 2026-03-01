/**
 * Pre-register bundled fonts with the FontFace API.
 *
 * CSS @font-face handles DOM text rendering, but Canvas 2D needs fonts
 * to be explicitly loaded into document.fonts before fillText() can use
 * them. This loads the same files referenced in App.css @font-face rules
 * so both CSS and Canvas are covered.
 */

interface BundledFont {
  family: string;
  url: string;
}

const BUNDLED_FONTS: BundledFont[] = [
  { family: 'Chopin Script', url: '/fonts/ChopinScript.ttf' },
  { family: 'Papyrus', url: '/fonts/Papyrus.ttf' },
];

export async function preloadBundledFonts(): Promise<void> {
  const results = await Promise.allSettled(
    BUNDLED_FONTS.map(async ({ family, url }) => {
      const face = new FontFace(family, `url(${url})`);
      const loaded = await face.load();
      document.fonts.add(loaded);
      console.log(`[fontLoader] Loaded bundled font: "${family}"`);
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    failed.forEach((r) => {
      if (r.status === 'rejected') {
        console.warn(`[fontLoader] Failed to load font:`, r.reason);
      }
    });
  }
  console.log(`[fontLoader] ${succeeded}/${BUNDLED_FONTS.length} bundled fonts loaded`);
}
