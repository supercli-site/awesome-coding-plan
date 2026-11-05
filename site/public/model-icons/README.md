# TokenPlan local brand assets

49 SVGs are unmodified assets from **@lobehub/icons-static-svg 1.102.0**, published by [LobeHub](https://github.com/lobehub/lobe-icons) under the included [MIT license](./LICENSE). They were compared byte-for-byte with the official npm archive locally. Pinned package: https://registry.npmjs.org/@lobehub/icons-static-svg/-/icons-static-svg-1.102.0.tgz .

Six additional assets are official website favicons, located from each site's HTML icon declarations:

- Augment: https://augmentcode.com/favicon.svg
- Factory: https://factory.ai/favicon.svg
- Zed: https://zed.dev/favicon_black_64.png
- 百度 Comate: https://comate.baidu.com/favicon.ico
- Thinking Machines Lab: https://thinkingmachines.ai/images/favicon-32x32.png
- Multiverse Computing: https://multiversecomputing.com/icon.png

These six official brand assets are **not covered by LobeHub's MIT license**. No open-source redistribution license is asserted for them. They are retained for the authorized local review; any later public redistribution requires separate review of the owners' brand usage terms. Names and trademarks belong to their owners; display does not imply endorsement.

The machine-readable source URL, license note and SHA-256 for every asset live in the site's `src/ui/icon-sources.json`. CI checks the bytes against that manifest and rejects unsafe SVG content or external resource references. Runtime paths are local and no remote icon service is contacted.

Stable platform IDs map to their confirmed company or named product/service marks. For example AWS is the Kiro seller, Google is the Gemini seller, Cognition's named product mark is Devin, and Xiaomi MiMo uses the MiMo product mark without claiming it is Xiaomi's corporate logo. The platform label always remains visible. API models use anchored model-family matching: ERNIE uses Wenxin, HY uses Hunyuan, and Doubao Seed uses Doubao. Generic descriptions such as “multiple providers” deliberately show the clearly labeled seller mark instead of inventing a model logo. Ranking entries without an independent model mark use the verified creator mark visibly labeled “厂商标识”; unknown creators without an official verified icon use a neutral dot, a reason tracked in `icon-manifest.json`, and retain the full name and measurements. CI fails for unexplained unknown creator gaps.

The SVGs preserve geometry and native colors and sit on white chips in both site themes. Augment's official favicon has an embedded dark-mode white path; a matching CSS inversion restores contrast against that chip when the operating system uses dark mode. The local image bytes are unchanged.
