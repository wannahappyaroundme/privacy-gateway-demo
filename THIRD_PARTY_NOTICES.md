# Third-Party Notices

## Privacy Demo Sans

The two local WOFF2 files are Modified Versions of the Korean region-specific subset of Noto Sans CJK KR 2.004. They are distributed under the SIL Open Font License 1.1 in `FONT-LICENSE.txt`. The modified CSS family name is `Privacy Demo Sans`; the upstream family name is not used as the primary family name.

- Upstream release: `Noto Sans CJK 2.004`, tag `Sans2.004`
- Upstream tag commit: `523d033d6cb47f4a80c58a35753646f5c3608a78`
- Upstream release asset: `17_NotoSansKR.zip`
- Source URL: `https://github.com/notofonts/noto-cjk/releases/download/Sans2.004/17_NotoSansKR.zip`
- Source download date: `2026-07-18`
- Asset SHA-256: `ac7eeb4e2b0d41de8ff31b2d6e1e2a41caf253fd5cefb380bfa1f40f1747b612`
- Source Regular OTF SHA-256: `69975a0ac8472717870aefeab0a4d52739308d90856b9955313b2ad5e0148d68`
- Source Bold OTF SHA-256: `5a6ceb287ed2fc6cfc6213144ebea68cbd94b20fc9eb873d8486493bf02d9bda`
- License SHA-256: `6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2`
- Conversion date: `2026-07-20`
- Conversion tool: `fonttools 4.60.2`
- WOFF2 encoder dependency: `Brotli 1.1.0`, installed only in the temporary conversion environment
- Rendered glyph source: every string value in `src/content/copy.ts` and `src/demo/fixtures/synthetic-consultation-v1.json`, deduplicated as UTF-8 code points

Repository-owned conversion helpers:

- `scripts/fonts/make-privacy-demo-glyphs.py`: `4950cd86d0db3d1729e64cff207a18eac47db8a2d3b490e8ba22c69beb5ca454`
- `scripts/fonts/rename-privacy-demo-font.py`: `bc44f1ddac3bebc0e6dde531613efaf58e4f88ba264f36857eb8af778ac1089d`

The helper files are durable equivalents of the temporary conversion helpers used for this build. They remove the original machine-specific repository path while preserving the glyph collection, family-name rewriting, and deterministic table ordering.

Portable tool setup:

```text
python3 -m venv /tmp/privacy-demo-font-build/venv
/tmp/privacy-demo-font-build/venv/bin/python -m pip install fonttools==4.60.2 Brotli==1.1.0
```

Place the two verified source OTF files at the exact input paths shown below, verify their SHA-256 values against this notice, then run the exact glyph-list command:

```text
python3 scripts/fonts/make-privacy-demo-glyphs.py src/content/copy.ts src/demo/fixtures/synthetic-consultation-v1.json /tmp/privacy-demo-font-build/privacy-demo-glyphs.txt
```

Exact Regular preparation and subset commands:

```text
/tmp/privacy-demo-font-build/venv/bin/python scripts/fonts/rename-privacy-demo-font.py /tmp/privacy-demo-font-build/NotoSansKR-Regular.otf /tmp/privacy-demo-font-build/PrivacyDemoSans-Regular.otf "Privacy Demo Sans" Regular
/tmp/privacy-demo-font-build/venv/bin/pyftsubset /tmp/privacy-demo-font-build/PrivacyDemoSans-Regular.otf --text-file=/tmp/privacy-demo-font-build/privacy-demo-glyphs.txt --output-file=public/fonts/PrivacyDemoSans-Regular.woff2 --flavor=woff2 --layout-features='*' --no-hinting --desubroutinize --name-IDs='*' --name-legacy --name-languages='*' --glyph-names --symbol-cmap --legacy-cmap --notdef-glyph --notdef-outline --recommended-glyphs
```

Exact Bold preparation and subset commands:

```text
/tmp/privacy-demo-font-build/venv/bin/python scripts/fonts/rename-privacy-demo-font.py /tmp/privacy-demo-font-build/NotoSansKR-Bold.otf /tmp/privacy-demo-font-build/PrivacyDemoSans-Bold.otf "Privacy Demo Sans" Bold
/tmp/privacy-demo-font-build/venv/bin/pyftsubset /tmp/privacy-demo-font-build/PrivacyDemoSans-Bold.otf --text-file=/tmp/privacy-demo-font-build/privacy-demo-glyphs.txt --output-file=public/fonts/PrivacyDemoSans-Bold.woff2 --flavor=woff2 --layout-features='*' --no-hinting --desubroutinize --name-IDs='*' --name-legacy --name-languages='*' --glyph-names --symbol-cmap --legacy-cmap --notdef-glyph --notdef-outline --recommended-glyphs
```

Output SHA-256:

- `PrivacyDemoSans-Regular.woff2`: `51b2c04f4dedf8dc8a74b014eef4302514d45286caa2c93be571f4d5ace64be9`
- `PrivacyDemoSans-Bold.woff2`: `50798777d301140ffd88bbe393c3d7896a8715d1dba3d53ac13030058431619b`

The source zip, source OTF files, temporary renamed OTF files, and temporary glyph list are not committed.

<!-- BEGIN GENERATED NPM DEPENDENCIES -->

## NPM Dependencies

아래 301개 항목은 고정된 package-lock.json과 설치 가능한 패키지의 라이선스 자료에서 생성했습니다. 현재 운영체제에 설치되지 않는 선택 패키지는 잠금 파일의 SPDX 선언과 무결성 값을 기록합니다.

| 패키지 | 구분 | 라이선스 | 라이선스 파일·SHA-256 | 저작권 또는 작성자 고지 |
| --- | --- | --- | --- | --- |
| `@adobe/css-tools@4.5.0` | 개발 | MIT | `LICENSE`, `326ff3850062286003ff4cbdaa8f61764e128f9a6532431bccf97e4e2bd75059` | Copyright (c) 2012 TJ Holowaychuk &lt;tj@vision-media.ca&gt;; Copyright (c) 2022 Jean-Philippe Zolesio &lt;holblin@gmail.com&gt; |
| `@asamuzakjp/css-color@5.1.11` | 개발 | MIT | `LICENSE`, `bd4539377980dd797fc6a51d90e664e52b2b2625b2158f01d4c68b5fe107eacb` | Copyright (c) 2024 asamuzaK (Kazz) |
| `@asamuzakjp/dom-selector@7.1.1` | 개발 | MIT | `LICENSE`, `7cdf9db3b91cc77b9ec947ad0c7126140f00e34528b67c3a58e9fc1a98055e14` | Copyright (c) 2023 asamuzaK (Kazz) |
| `@asamuzakjp/generational-cache@1.0.1` | 개발 | MIT | `LICENSE`, `b4206276487160066d7006579da64b1e104f0db639897d5b91babdd0df8165e1` | Copyright (c) 2026 asamuzaK (Kazz) |
| `@asamuzakjp/nwsapi@2.3.9` | 개발 | MIT | `LICENSE`, `9b0ffd74f2cde7528141cc314ece705490d11054805da4a01ee6149498951b8f` | Copyright (c) 2007-2019 Diego Perini (http://www.iport.it/) |
| `@axe-core/playwright@4.12.1` | 개발 | MPL-2.0 | `LICENSE`, `812e9d96e900a093ae4d1d3f22c5f82f568a0a0461c3007a99d00573d41c5461` | Author: @axe-core/playwright |
| `@babel/code-frame@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/compat-data@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/core@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/generator@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/helper-compilation-targets@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/helper-globals@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/helper-module-imports@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/helper-module-transforms@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/helper-string-parser@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/helper-validator-identifier@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/helper-validator-option@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/helpers@7.29.7` | 개발 | MIT | `LICENSE`, `4be9d87b56a306293223b490c0d0b245e9e94f39884147bf051a6c7b825aeb30` | Copyright (c) 2014-present Sebastian McKenzie and other contributors; Copyright (c) 2014-present, Facebook, Inc. (ONLY ./src/helpers/regenerator* files) |
| `@babel/parser@7.29.7` | 개발 | MIT | `LICENSE`, `2e97627cb278aa7556fb9e8817368302301a595b6c7582512b8d74c57b773652` | Copyright (C) 2012-2014 by various contributors (see AUTHORS) |
| `@babel/runtime@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/template@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/traverse@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@babel/types@7.29.7` | 개발 | MIT | `LICENSE`, `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| `@bramus/specificity@2.4.2` | 개발 | MIT | `LICENSE`, `ae842a63dd9bc829c95a2ec22dda25a08e422a368b71dbca67a45cde7c4a4b81` | Copyright (c) 2022 Bramus Van Damme - https://www.bram.us/ |
| `@csstools/color-helpers@6.1.0` | 개발 | MIT-0 | `LICENSE.md`, `947e32047a166cd05f04e45938d172b412c07cbee0b9735afd14bae30e02c2f6` | Copyright © CSSTools Contributors |
| `@csstools/css-calc@3.2.1` | 개발 | MIT | `LICENSE.md`, `d00d032f517721b45c56c70c46bf904ebb71ad313df4d4db7722266b38069665` | Copyright 2022 Romain Menke, Antonio Laguna &lt;antonio@laguna.es&gt;; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `@csstools/css-color-parser@4.1.9` | 개발 | MIT | `LICENSE.md`, `d00d032f517721b45c56c70c46bf904ebb71ad313df4d4db7722266b38069665` | Copyright 2022 Romain Menke, Antonio Laguna &lt;antonio@laguna.es&gt;; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `@csstools/css-parser-algorithms@4.0.0` | 개발 | MIT | `LICENSE.md`, `d00d032f517721b45c56c70c46bf904ebb71ad313df4d4db7722266b38069665` | Copyright 2022 Romain Menke, Antonio Laguna &lt;antonio@laguna.es&gt;; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `@csstools/css-syntax-patches-for-csstree@1.1.6` | 개발 | MIT-0 | `LICENSE.md`, `947e32047a166cd05f04e45938d172b412c07cbee0b9735afd14bae30e02c2f6` | Copyright © CSSTools Contributors |
| `@csstools/css-tokenizer@4.0.0` | 개발 | MIT | `LICENSE.md`, `d00d032f517721b45c56c70c46bf904ebb71ad313df4d4db7722266b38069665` | Copyright 2022 Romain Menke, Antonio Laguna &lt;antonio@laguna.es&gt;; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `@emnapi/core@1.11.1` | 실행 | MIT | `package-lock.json#packages`, `f11bc8e72d48ce258ce2082a8a7b2348ef955b7432d64b3c1cbbf618ac7f11c7` | SPDX declaration: MIT; Registry integrity: sha512-RSvbQmHzdKzNsLYa/wHrbc3KN4sYLKAdPZxqiM2HATqv/SBk2/ENSHpvXGaLOMcsAyz0poEGqkmmKYG3OWiJEQ== |
| `@emnapi/runtime@1.11.1` | 실행 | MIT | `package-lock.json#packages`, `fb31f515cd85b73b9bcf3e6be2b2e03f3241d7b793a8d785dfec624acabbd1dd` | SPDX declaration: MIT; Registry integrity: sha512-vgj7R3y3Wgx24IQaGPA/R6YFXLHVMOZ0uVEyIQPaWs+rd1AzfEMXlAC22FYwO1XkKR6NPsq7mUandH8oIRdZFw== |
| `@emnapi/wasi-threads@1.2.2` | 실행 | MIT | `package-lock.json#packages`, `7693765268f52f7063070437e729bcf781c6adcf2517ae03ce18df5fe5803d52` | SPDX declaration: MIT; Registry integrity: sha512-c95qOXkHdydNKhscBTebqEC1CVAZpyqOfVfBzQ1qgzyl3gfeldUjIggDbIZgDKsHLgnsM+igH7TJ/eAasaVuMA== |
| `@eslint-community/eslint-utils@4.9.1` | 개발 | MIT | `LICENSE`, `fcf6eabf68ca96988a6b506b4fdc6cc32535d80eb2e11c79724af5ac6f50262b` | Copyright (c) 2018 Toru Nagashima |
| `@eslint-community/regexpp@4.12.2` | 개발 | MIT | `LICENSE`, `fcf6eabf68ca96988a6b506b4fdc6cc32535d80eb2e11c79724af5ac6f50262b` | Copyright (c) 2018 Toru Nagashima |
| `@eslint/config-array@0.23.5` | 개발 | Apache-2.0 | `LICENSE`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `@eslint/config-helpers@0.6.0` | 개발 | Apache-2.0 | `LICENSE`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `@eslint/core@1.2.1` | 개발 | Apache-2.0 | `LICENSE`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `@eslint/js@10.0.1` | 개발 | MIT | `LICENSE`, `3b6be04f862a077a4b97929dbf247299360824d9365f8603c263769303ace18c` | Copyright OpenJS Foundation and other contributors, &lt;www.openjsf.org&gt; |
| `@eslint/object-schema@3.0.5` | 개발 | Apache-2.0 | `LICENSE`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `@eslint/plugin-kit@0.7.2` | 개발 | Apache-2.0 | `LICENSE`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `@exodus/bytes@1.15.1` | 개발 | MIT | `LICENSE`, `dbffd380d59504ba19fcf87ff5a1a33c37edf66d5b09966b0ad5368ab87bc2af` | Copyright (c) 2024-2025 Exodus Movement |
| `@humanfs/core@0.19.2` | 개발 | Apache-2.0 | `LICENSE`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `@humanfs/node@0.16.8` | 개발 | Apache-2.0 | `LICENSE`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `@humanfs/types@0.15.0` | 개발 | Apache-2.0 | `package-lock.json#packages`, `b00a403b82c65e044255592907c64710edcfc3cb98c578a00a46e546b78ae60b` | SPDX declaration: Apache-2.0; Registry integrity: sha512-ZZ1w0aoQkwuUuC7Yf+7sdeaNfqQiiLcSRbfI08oAxqLtpXQr9AIVX7Ay7HLDuiLYAaFPu8oBYNq/QIi9URHJ3Q== |
| `@humanwhocodes/module-importer@1.0.1` | 개발 | Apache-2.0 | `LICENSE`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `@humanwhocodes/retry@0.4.3` | 개발 | Apache-2.0 | `LICENSE`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `@jridgewell/gen-mapping@0.3.13` | 실행 | MIT | `LICENSE`, `769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c` | Copyright 2024 Justin Ridgewell &lt;justin@ridgewell.name&gt; |
| `@jridgewell/remapping@2.3.5` | 실행 | MIT | `LICENSE`, `769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c` | Copyright 2024 Justin Ridgewell &lt;justin@ridgewell.name&gt; |
| `@jridgewell/resolve-uri@3.1.2` | 실행 | MIT | `LICENSE`, `b8778b155bfde5a28b023a558753c0fa058a52bb9de35c343c250be1bbcdedab` | Copyright 2019 Justin Ridgewell &lt;jridgewell@google.com&gt; |
| `@jridgewell/sourcemap-codec@1.5.5` | 실행 | MIT | `LICENSE`, `769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c` | Copyright 2024 Justin Ridgewell &lt;justin@ridgewell.name&gt; |
| `@jridgewell/trace-mapping@0.3.31` | 실행 | MIT | `LICENSE`, `769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c` | Copyright 2024 Justin Ridgewell &lt;justin@ridgewell.name&gt; |
| `@napi-rs/wasm-runtime@1.1.6` | 실행 | MIT | `package-lock.json#packages`, `6e203bcaf6cd494a35fa289dbf355e8d11fbc4288b17a16d1a05a6a5f9b482fe` | SPDX declaration: MIT; Registry integrity: sha512-ZLv/JdUfkvOy9eCnnBaGfiO+XimbjebAeO+MRQqD/B+FR1tnRN0tpKSJHRbE8sFfS6aqsXZ67TQjfwfsxULVbg== |
| `@oxc-project/types@0.139.0` | 실행 | MIT | `LICENSE`, `95ced5ecf1133fbf41d409b5555c86c344f83f3b019926057ddbc07cfdcc27b3` | Copyright (c) 2024-present VoidZero Inc. &amp; Contributors; Copyright (c) 2023 Boshen |
| `@playwright/test@1.61.1` | 개발 | Apache-2.0 | `LICENSE`, `45873d00a0dd243596deb4aa23b2493b3d1f0671921bf2538ea431d7380220eb` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of, |
| `@rolldown/binding-android-arm64@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `873393443f72162215181df015bf2814c8c6aaeb8d82e0ed1fe95744d577b5f1` | SPDX declaration: MIT; Registry integrity: sha512-lZg8fqIv2v7FF237bwMgzGZEJvGL79/s5knJ/i6FmsGF4XXlzccZ4jb+TrFIxtSSxFtIpdsgrPZeMk1I9AFcyQ== |
| `@rolldown/binding-darwin-arm64@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `711afd6d1c4a2708b4c22955c87bae46639ca40e552941cb2a4a86ba08aa8592` | SPDX declaration: MIT; Registry integrity: sha512-51Bnx9pNiMRKSUNtBfySkNJ9vMU9Hh3I1ozDd6gyPPYzaXCfnptUcEZxXGYFn+ul2dtcMUiqGR1Yai2K10uoTw== |
| `@rolldown/binding-darwin-x64@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `7b09103f0f504b76e219c1c8783380cc954a63616cc1e3a0d7f9d1051f4213d3` | SPDX declaration: MIT; Registry integrity: sha512-Tm+gbfC0aHu1tBA/JvKQh32S0K6YgCHkiAF4/W6xX0K0RmNuc94VeK419dJoE65R5aRxmo+noZQSWrAMF6yb6g== |
| `@rolldown/binding-freebsd-x64@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `46db1085ec5e8c80ee8548714bbccbd723c41bdda2385d46a7ee35eb515ecde2` | SPDX declaration: MIT; Registry integrity: sha512-JMzDKCCXq93YccG5gz3hvOs1oXRKAf0XYpfOS88e+wZrC8Iugj6j68867vrYZkvpDDpKn/KoKORThmchMpF6TA== |
| `@rolldown/binding-linux-arm-gnueabihf@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `08fc80c03cb091cc193bc9210285e6bc7572bde8ef6a2101c1647a44954890c2` | SPDX declaration: MIT; Registry integrity: sha512-uML21j2K5TfPGutKxub+M+nLjZIrWjXQ5Grx4lCe/nimTj9B4L63zHpjXLl4y0L3mcm2htEQIb06oCG/szerNw== |
| `@rolldown/binding-linux-arm64-gnu@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `d4f9f185f0803a44040114d47eed02c1e830ad92e306e1163ff778eacf37372c` | SPDX declaration: MIT; Registry integrity: sha512-navSiuTMogvnQoZoM/v+l3ZWo50/NTwSHSzheABx/RCnmUPaKwq9qSo4Br2OYRs21+Fz8uFqITZM3H4opOB0/Q== |
| `@rolldown/binding-linux-arm64-musl@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `4662c054aa6c13ebb215386f74b434760d3fd7b7d0029cfb2fe9415093502ce6` | SPDX declaration: MIT; Registry integrity: sha512-lAryqH7IteztmCXQXk0etKj4wBQ7Gx5S6LjKhsgp9zb8I5bsuvU/2llH1hDQcjsFeqIsovMVN339/8pUDDBXxA== |
| `@rolldown/binding-linux-ppc64-gnu@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `60eb90f0ff7b7f05dc0d89a68a65cd660fb4d667d51c4a26a9da12eb197955c8` | SPDX declaration: MIT; Registry integrity: sha512-fsK/sNBnxzBlL4O1JNrZakVQxPspqpED5dLtNsZS9oOKmtSpdNIzxH2kkol5HYTWJN47sE20ztMJPxfZ89qGOg== |
| `@rolldown/binding-linux-s390x-gnu@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `6bb78ec84645c1ae8e91126d5230f01594102728086535a31a69793b234856bb` | SPDX declaration: MIT; Registry integrity: sha512-gLYb4BIadlfTOYT5gO503n8zQjXflgzpD0FcyKh0Mzx3rqCZKnHoJWV9xe1KXUJ5lx2JfcSHr/mhzS0PC/McAA== |
| `@rolldown/binding-linux-x64-gnu@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `5c2c8d69c28f1f47ed69944fbbdaab25db4371551d884a54502748c492514f3f` | SPDX declaration: MIT; Registry integrity: sha512-FjcpEKUyJygHgs1o50VYNvkt5+7Le/VEdYt0AkRpkL33MnyQfwr8l5mXwMmfmTbyMPr5vJLC+8/Gd9gXnwU1QQ== |
| `@rolldown/binding-linux-x64-musl@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `53bf74092f82ba126f8a7e73c9181232bdbf0f577fa0f99c4bfe16e2fd9b824e` | SPDX declaration: MIT; Registry integrity: sha512-Me+PfPI2TMeOQk0gYWfLQZtTktrmzbr8cDboqX83XKc7UrgAi55gF+2dUkWdxd19n55Essp2yeca+O9N5rBxHg== |
| `@rolldown/binding-openharmony-arm64@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `2c64e9ca3e88c43cb2e0cf3dd9333bf2c4e29a938540d54155ab7f39ec942f43` | SPDX declaration: MIT; Registry integrity: sha512-yc5WrLzXks6zCQfn9Oxr8pORKyl/pF+QjHmW/Qx3qu0oyrrNC+y2JLTU1E2rcWYAmzlnqngWXHQjy51VzW70Vw== |
| `@rolldown/binding-wasm32-wasi@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `6e205bc304d0b6e9683d18f7e46971e8d7d27ced5a82f68032e6347d4199eaa4` | SPDX declaration: MIT; Registry integrity: sha512-VbQGPX2b4r48TAMIM2cjgluIM1HYutm4pcTEJsle7iEP7sB1dFqtPLBVbdLAZCxy1txCcPxf4QFf4v8uvltPqA== |
| `@rolldown/binding-win32-arm64-msvc@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `6a7f7bca5bf5870ce16b5f56951d5d94e480eb4b61a22e1143b232ea9bd2d613` | SPDX declaration: MIT; Registry integrity: sha512-gHv82k63z4qpV5+Q1y/12KrK0ltWBukVDI8nZcbT7Tt/ZlOIVwppazneq0F93oDxTo3IgAMEDIoQh3E2n6mVsw== |
| `@rolldown/binding-win32-x64-msvc@1.1.5` | 실행 | MIT | `package-lock.json#packages`, `31e41a08cbcc8b19a3b7ba3ce229e5aa64b6320638ecbe073a2640ed4a44a593` | SPDX declaration: MIT; Registry integrity: sha512-tTZuDBPw85tEN5PQi1pnEBzDy0Z49HtScLAbD5t6hyeU92A95pRWaSMw1GZZi/RwgSgUIl0xrSlXIT/9QzvYSA== |
| `@rolldown/pluginutils@1.0.1` | 실행 | MIT | `LICENSE`, `e1919b3b98b8bf6c1b99fcc60a0ed46027c97ac947432e1278446c9606f50161` | Copyright (c) 2026-present, rolldown/plugins repository contributors |
| `@standard-schema/spec@1.1.0` | 개발 | MIT | `LICENSE`, `653b779005a3a4d64a7288c940f7b9a0e8f0b1e0375f6aa6af9473caf131e564` | Copyright (c) 2024 Colin McDonnell |
| `@tailwindcss/node@4.3.3` | 실행 | MIT | `LICENSE`, `60e0b68c0f35c078eef3a5d29419d0b03ff84ec1df9c3f9d6e39a519a5ae7985` | Copyright (c) Tailwind Labs, Inc. |
| `@tailwindcss/oxide-android-arm64@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `70da2ed5320a5eaeba80526973e19ee0648f88ead814bc75ed036f21d4a76f28` | SPDX declaration: MIT; Registry integrity: sha512-Y85A2gmPSkl5Ve5qR86GL4HT509cFqQh1aes9p3sSkyTPwt0Pppf3GkwGe4JPACcRYjgJIEhQgM6dBClnr0NYw== |
| `@tailwindcss/oxide-darwin-arm64@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `0dd3bdeeb58e2ee629c43615880fbd84e55c23725f92e2a8f54ef9742f3f5742` | SPDX declaration: MIT; Registry integrity: sha512-BiaWatpBcERQFDlOjRDpIVXuFK5PJez5SA4JMg6VYZdBYU+qKfV/vqjcIs+IYmtitf1xYQZTwXvU/8y4lfZUGw== |
| `@tailwindcss/oxide-darwin-x64@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `3a3781170f397ea346c45e632e4b131d652a7a35ea72687a36537c4afd96899b` | SPDX declaration: MIT; Registry integrity: sha512-fAeUqfV5ndhxRwai8cXGzdLvul9utWOmeTkv69unv4ZXixjn61Z+p9lCWdwOwA3TYboG3BwdVuN/RDjhBRl0mw== |
| `@tailwindcss/oxide-freebsd-x64@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `2e830c71dbbf47c6b9fd0fc4689b6cca4e8582a1b3ad7bf8faf233935ca93738` | SPDX declaration: MIT; Registry integrity: sha512-iyf5bV6+wnAlflVeEy7R25dupxTNECZN5QMI0qNT6eT+EgaGdZcKhGkr5SdoaWiLJ3spLqIY9VCeSGrwmtg4kw== |
| `@tailwindcss/oxide-linux-arm-gnueabihf@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `e2d8c05cc62a027c22157b82c92fe57de6dfb36694b58c297604c02a4bd9b88e` | SPDX declaration: MIT; Registry integrity: sha512-aAYUprJAJQWWbRrPvtjdroZ56Md+JM8pMiopS6xGEwDfLhqj+2ver2p4nU4Mb3CRqcMmNBjo8KkUgcxhkzVQGQ== |
| `@tailwindcss/oxide-linux-arm64-gnu@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `71ac6536e299657044507a120349f0b5b272618a8e769451ce0a06ea4630511a` | SPDX declaration: MIT; Registry integrity: sha512-nDxldcEENOxZRzC2uu9jrutZdAAQtb+8WWDCSnWL1zvBk1+FN+x6MtDViPB5AJMfttVCUhehGWus3XBPgatM/w== |
| `@tailwindcss/oxide-linux-arm64-musl@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `00302efdf50235711fc033d60457fff1121d32392da14da51dda5db62c958072` | SPDX declaration: MIT; Registry integrity: sha512-Md44bD6veX/PC5iyF8cDVnw4HBIANZepRZZ7a8DQOvkfo5WUBwcp6iAuCUz23u+4SUkhJlD3eL7hNdW8ezd/kA== |
| `@tailwindcss/oxide-linux-x64-gnu@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `9b28b560915c287fcd42112006e94c317ad5c3f0614b9832550d88f0813d6a6d` | SPDX declaration: MIT; Registry integrity: sha512-tx7us1muwOKAKWao2v/GaafFeQboE6aj88vC6ziN2NCGcRm8gWUhwjzg+YdVB1e4boAtdtma4L43onunI6NS4w== |
| `@tailwindcss/oxide-linux-x64-musl@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `fbf81f600bb99dd480048fad9f09323132ec71720d1e0d395518cb51dceb7353` | SPDX declaration: MIT; Registry integrity: sha512-SJxX60smvHgasZoBy11dX6YRjXJFovwWBoedhbQPOBzgFWBHGB+TVPWB9BxzR7TTxU8FQZAI2AyiNCMzFm8Img== |
| `@tailwindcss/oxide-wasm32-wasi@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `e1920f6c87d4cced4792ead3fee1b29237c4bfae5f713fafd5d181dd4c34e5bb` | SPDX declaration: MIT; Registry integrity: sha512-jx1+rPhY/5Ympkktd656HBWEBLxP7dH06losBLjjf5vgCODXvi9KhtftWcMIwTFIDqBr7cRnQkdLnAG+IOlGvQ== |
| `@tailwindcss/oxide-win32-arm64-msvc@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `921dbedfb8b42546b5638ab6cc929ac555741093349edb1da64094fbdab3737e` | SPDX declaration: MIT; Registry integrity: sha512-3rc292Ca2ceK6Ulcc/bAVnTs/3nDtoPhyEKlgPv+yQJQi/JS/AMJlqzxvlDacL1nekbrcf6bTqp/jV4qgnPxNQ== |
| `@tailwindcss/oxide-win32-x64-msvc@4.3.3` | 실행 | MIT | `package-lock.json#packages`, `0f1cfbb6a712c3f788dd0bc4b5f2d536e0eef091e53527d902d637412a1d638d` | SPDX declaration: MIT; Registry integrity: sha512-yJ0pwIVc/nYeGoV02WtsN8KYyLQv7kyI2wDnkezyJlGGjkd4QLwDGAwl47YpPJeuI0M0ObaXGSPjvWDPeTPggw== |
| `@tailwindcss/oxide@4.3.3` | 실행 | MIT | `LICENSE`, `60e0b68c0f35c078eef3a5d29419d0b03ff84ec1df9c3f9d6e39a519a5ae7985` | Copyright (c) Tailwind Labs, Inc. |
| `@tailwindcss/vite@4.3.3` | 실행 | MIT | `LICENSE`, `60e0b68c0f35c078eef3a5d29419d0b03ff84ec1df9c3f9d6e39a519a5ae7985` | Copyright (c) Tailwind Labs, Inc. |
| `@testing-library/dom@10.4.1` | 개발 | MIT | `LICENSE`, `bf8fd38056b7606deccfcadb4d8ca1c210082d8ef5513426d2650daedc30bed3` | Copyright (c) 2017 Kent C. Dodds |
| `@testing-library/jest-dom@6.9.1` | 개발 | MIT | `LICENSE`, `bf8fd38056b7606deccfcadb4d8ca1c210082d8ef5513426d2650daedc30bed3` | Copyright (c) 2017 Kent C. Dodds |
| `@testing-library/react@16.3.2` | 개발 | MIT | `LICENSE`, `9680978280d509520d2a7b51e93ffbf7d9ec2b9de4411a6989daba5b659048e0` | Copyright (c) 2017-Present Kent C. Dodds |
| `@tybys/wasm-util@0.10.3` | 실행 | MIT | `package-lock.json#packages`, `ec9322670cf89dea52c19c4583059177eed00440a6c64042f954f9172959f771` | SPDX declaration: MIT; Registry integrity: sha512-F3fo1MYrRJYL3zER0OUOmkutjr1Vp23m7OsSgp7nq4SP6OqX6C/56XFIPAl5bt3zaBRjmW7SGz3u/6LwFpYcOg== |
| `@types/aria-query@5.0.4` | 개발 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@types/chai@5.2.3` | 개발 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@types/deep-eql@4.0.2` | 개발 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@types/esrecurse@4.3.1` | 개발 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@types/estree@1.0.9` | 개발 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@types/json-schema@7.0.15` | 개발 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@types/node@20.19.43` | 실행 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@types/pngjs@6.0.5` | 개발 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@types/react-dom@19.2.3` | 개발 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@types/react@19.2.17` | 개발 | MIT | `LICENSE`, `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` | Copyright (c) Microsoft Corporation. |
| `@typescript-eslint/eslint-plugin@8.64.0` | 개발 | MIT | `LICENSE`, `2eb5c7a0bba9deb77a98c81bf6b9d3fb1c67118eebf968b6b1a787b3f8928ee0` | Copyright (c) 2019 typescript-eslint and other contributors |
| `@typescript-eslint/parser@8.64.0` | 개발 | MIT | `LICENSE`, `2eb5c7a0bba9deb77a98c81bf6b9d3fb1c67118eebf968b6b1a787b3f8928ee0` | Copyright (c) 2019 typescript-eslint and other contributors |
| `@typescript-eslint/project-service@8.64.0` | 개발 | MIT | `LICENSE`, `053a75a14b7508a897466b65e12797201a06b0e9b5066d1223da72cac99601b5` | Copyright (c) 2025 typescript-eslint and other contributors |
| `@typescript-eslint/scope-manager@8.64.0` | 개발 | MIT | `LICENSE`, `2eb5c7a0bba9deb77a98c81bf6b9d3fb1c67118eebf968b6b1a787b3f8928ee0` | Copyright (c) 2019 typescript-eslint and other contributors |
| `@typescript-eslint/tsconfig-utils@8.64.0` | 개발 | MIT | `LICENSE`, `053a75a14b7508a897466b65e12797201a06b0e9b5066d1223da72cac99601b5` | Copyright (c) 2025 typescript-eslint and other contributors |
| `@typescript-eslint/type-utils@8.64.0` | 개발 | MIT | `LICENSE`, `f3c51ace7f159b21566d72535e84ff354505ae7ffdca835dac81fcdafbf9e879` | Copyright (c) 2021 typescript-eslint and other contributors |
| `@typescript-eslint/types@8.64.0` | 개발 | MIT | `LICENSE`, `2eb5c7a0bba9deb77a98c81bf6b9d3fb1c67118eebf968b6b1a787b3f8928ee0` | Copyright (c) 2019 typescript-eslint and other contributors |
| `@typescript-eslint/typescript-estree@8.64.0` | 개발 | MIT | `LICENSE`, `2eb5c7a0bba9deb77a98c81bf6b9d3fb1c67118eebf968b6b1a787b3f8928ee0` | Copyright (c) 2019 typescript-eslint and other contributors |
| `@typescript-eslint/utils@8.64.0` | 개발 | MIT | `LICENSE`, `2eb5c7a0bba9deb77a98c81bf6b9d3fb1c67118eebf968b6b1a787b3f8928ee0` | Copyright (c) 2019 typescript-eslint and other contributors |
| `@typescript-eslint/visitor-keys@8.64.0` | 개발 | MIT | `LICENSE`, `2eb5c7a0bba9deb77a98c81bf6b9d3fb1c67118eebf968b6b1a787b3f8928ee0` | Copyright (c) 2019 typescript-eslint and other contributors |
| `@vitejs/plugin-react@6.0.3` | 개발 | MIT | `LICENSE`, `29b68325fe026047d13e187b44c33b2acacf7dc647dec4583702e59f235e13b5` | Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors |
| `@vitest/expect@4.1.10` | 개발 | MIT | `LICENSE`, `04575fc5bfae19a9b63100f8691f901a2e15a399011ac02db435a9ef27295551` | Copyright (c) 2021-Present VoidZero Inc. and Vitest contributors |
| `@vitest/mocker@4.1.10` | 개발 | MIT | `LICENSE`, `04575fc5bfae19a9b63100f8691f901a2e15a399011ac02db435a9ef27295551` | Copyright (c) 2021-Present VoidZero Inc. and Vitest contributors |
| `@vitest/pretty-format@4.1.10` | 개발 | MIT | `LICENSE`, `04575fc5bfae19a9b63100f8691f901a2e15a399011ac02db435a9ef27295551` | Copyright (c) 2021-Present VoidZero Inc. and Vitest contributors |
| `@vitest/runner@4.1.10` | 개발 | MIT | `LICENSE`, `04575fc5bfae19a9b63100f8691f901a2e15a399011ac02db435a9ef27295551` | Copyright (c) 2021-Present VoidZero Inc. and Vitest contributors |
| `@vitest/snapshot@4.1.10` | 개발 | MIT | `LICENSE`, `04575fc5bfae19a9b63100f8691f901a2e15a399011ac02db435a9ef27295551` | Copyright (c) 2021-Present VoidZero Inc. and Vitest contributors |
| `@vitest/spy@4.1.10` | 개발 | MIT | `LICENSE`, `04575fc5bfae19a9b63100f8691f901a2e15a399011ac02db435a9ef27295551` | Copyright (c) 2021-Present VoidZero Inc. and Vitest contributors |
| `@vitest/utils@4.1.10` | 개발 | MIT | `LICENSE`, `04575fc5bfae19a9b63100f8691f901a2e15a399011ac02db435a9ef27295551` | Copyright (c) 2021-Present VoidZero Inc. and Vitest contributors |
| `acorn-jsx@5.3.2` | 개발 | MIT | `LICENSE`, `cfa72b62b9ae173078823a3796b25c027a9071046a263beddf966df67018ce06` | Copyright (C) 2012-2017 by Ingvar Stepanyan |
| `acorn@8.17.0` | 개발 | MIT | `LICENSE`, `76a876cf886ff9be2a8b5e2e86514fed06223c8c9f0c1e9ee9606e93841e00b7` | Copyright (C) 2012-2022 by various contributors (see AUTHORS) |
| `ajv@6.15.0` | 개발 | MIT | `LICENSE`, `e85e131fa4ed25538ff1f4962ced1fb6f68b079bd9164a790597a0f30b8fd030` | Copyright (c) 2015-2017 Evgeny Poberezkin |
| `ansi-regex@5.0.1` | 개발 | MIT | `license`, `48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (sindresorhus.com) |
| `ansi-styles@5.2.0` | 개발 | MIT | `license`, `48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (sindresorhus.com) |
| `aria-query@5.3.0` | 개발 | Apache-2.0 | `LICENSE`, `c8df456c7ccba74b959087dff494d4ac2a12dfb0400c08b46b2494a08a000567` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright 2020 A11yance |
| `aria-query@5.3.2` | 개발 | Apache-2.0 | `LICENSE`, `c8df456c7ccba74b959087dff494d4ac2a12dfb0400c08b46b2494a08a000567` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright 2020 A11yance |
| `assertion-error@2.0.1` | 개발 | MIT | `LICENSE`, `2130216d5ab4c02134f8247f32999feda0abe1eaf028218baeac445c19ce4cea` | Copyright (c) 2013 Jake Luer jake@qualiancy.com (http://qualiancy.com) |
| `axe-core@4.12.1` | 개발 | MPL-2.0 | `LICENSE`, `af175b9d96ee93c21a036152e1b905b0b95304d4ae8c2c921c7609100ba8df7e` | Author: axe-core |
| `balanced-match@4.0.4` | 개발 | MIT | `LICENSE.md`, `d408f38ffa3355c5faec517153295338892eb0f1ea43f57874bb23c6075979b5` | Author: balanced-match |
| `baseline-browser-mapping@2.10.43` | 개발 | Apache-2.0 | `LICENSE.txt`, `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright [yyyy] [name of copyright owner] |
| `bidi-js@1.0.3` | 개발 | MIT | `LICENSE.txt`, `49d4d143fed599deb502a0fe6e02f49832f87e9a3a4cd0502e469596d50faa6d` | Copyright (c) 2021 Jason Johnston |
| `brace-expansion@5.0.7` | 개발 | MIT | `LICENSE`, `9c63a23124d68cd30cd316a94a1a0bca34f032786df6df69fc4b5f136bac8d2e` | Copyright Julian Gruber &lt;julian@juliangruber.com&gt; |
| `browserslist@4.28.6` | 개발 | MIT | `LICENSE`, `21c2679a63d7699c0e644409e2f17d0adbc7a965003feb06b3ff4b833d21f722` | Copyright 2014 Andrey Sitnik &lt;andrey@sitnik.es&gt; and other contributors; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `caniuse-lite@1.0.30001806` | 개발 | CC-BY-4.0 | `LICENSE`, `fd3a263fe19ed8faa9068b43abaebafc02c77897b0c6fc09abc04bb592e5f16e` | copyright and certain other rights. Our licenses are; copyright--then that use is not regulated by the license. Our |
| `chai@6.2.2` | 개발 | MIT | `LICENSE`, `b181da80336ff9dd1043fc8be1a764d7382363433319aa872e4d2cb5ce2a3066` | Copyright (c) 2017 Chai.js Assertion Library |
| `convert-source-map@2.0.0` | 개발 | MIT | `LICENSE`, `1fa6ee8bb95a81ae3d73a5bd074a3ac380ffec13697051063ca1a601921b91db` | Copyright 2013 Thorsten Lorenz. |
| `cross-spawn@7.0.6` | 개발 | MIT | `LICENSE`, `aaa78451b6fecd1b9c4594c796c133c0e90cad100372ff8bc6de615e9ef9adf1` | Copyright (c) 2018 Made With MOXY Lda &lt;hello@moxy.studio&gt; |
| `css-tree@3.2.1` | 개발 | MIT | `LICENSE`, `719a251ceca49c057ea90a1152af6546b767ec88e6d573bb6324454267b32c22` | Copyright (C) 2016-2026 by Roman Dvornov |
| `css.escape@1.5.1` | 개발 | MIT | `package-lock.json#packages`, `5d7c4f836bb3ce245667ea63e6c1db337bb51caecc3158c5e506dd8da9cfdd4f` | SPDX declaration: MIT; Registry integrity: sha512-YUifsXXuknHlUsmlgyY0PKzgPOr7/FjCePfHNt0jxm83wHZi44VDMQ7/fGNkjY3/jV1MC+1CmZbaHzugyeRtpg== |
| `csstype@3.2.3` | 개발 | MIT | `LICENSE`, `11d55bd4541c75ee7879547ac49089c489163dae49551389713c3d026cab383e` | Copyright (c) 2017-2018 Fredrik Nicol |
| `data-urls@7.0.0` | 개발 | MIT | `LICENSE.txt`, `528eec83cb836a0adda9f8fc3d6a2a70a710d6cc0be9a155f92212c8df28acfa` | Copyright © Domenic Denicola &lt;d@domenic.me&gt; |
| `debug@4.4.3` | 개발 | MIT | `LICENSE`, `3a61c6c96caf5c1d9b623fb9b04c822b783dfcb78aa7e49c76a3f643e6ed7f95` | Copyright (c) 2014-2017 TJ Holowaychuk &lt;tj@vision-media.ca&gt;; Copyright (c) 2018-2021 Josh Junon |
| `decimal.js@10.6.0` | 개발 | MIT | `package-lock.json#packages`, `5df4553321b18529866de22c1fcec461b4f9bcb13aa3d96a56c0ebb712c90deb` | SPDX declaration: MIT; Registry integrity: sha512-YpgQiITW3JXGntzdUmyUR1V812Hn8T1YVXhCu+wO3OpS4eU9l4YdD3qjyiKdV6mvV29zapkMeD390UVEf2lkUg== |
| `deep-is@0.1.4` | 개발 | MIT | `LICENSE`, `f2042f3634c4136d06b5139c9c6aefb81a3a462b514548bc1845953233dfba98` | Copyright (c) 2012, 2013 Thorsten Lorenz &lt;thlorenz@gmx.de&gt;; Copyright (c) 2012 James Halliday &lt;mail@substack.net&gt;; Copyright (c) 2009 Thomas Robinson &lt;280north.com&gt;; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `dequal@2.0.3` | 개발 | MIT | `license`, `306fa513e39b23a6e8747520de761809d206b99800ef41907b530226574c59ae` | Copyright (c) Luke Edwards &lt;luke.edwards05@gmail.com&gt; (lukeed.com) |
| `detect-libc@2.1.2` | 실행 | Apache-2.0 | `LICENSE`, `b40930bbcf80744c86c46a12bc9da056641d722716c378f5659b9e555ef833e1` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright {yyyy} {name of copyright owner} |
| `dom-accessibility-api@0.5.16` | 개발 | MIT | `LICENSE.md`, `0ffe67fe630169de46df2d29dc18f5857b4c98f0f95b0cd9e3c21fef51f9a9b8` | Copyright (c) 2020 Sebastian Silbermann |
| `dom-accessibility-api@0.6.3` | 개발 | MIT | `LICENSE.md`, `0ffe67fe630169de46df2d29dc18f5857b4c98f0f95b0cd9e3c21fef51f9a9b8` | Copyright (c) 2020 Sebastian Silbermann |
| `electron-to-chromium@1.5.392` | 개발 | ISC | `LICENSE`, `25ba5c59dad3e0dd8f9540beaa0f0a86a10e3aec35af5fdc8e88c5f6a5c0d8c6` | Copyright 2018 Kilian Valkhof |
| `enhanced-resolve@5.24.2` | 실행 | MIT | `LICENSE`, `9068a8782d2fb4c6e432cfa25334efa56f722822180570802bf86e71b6003b1e` | Copyright JS Foundation and other contributors |
| `entities@8.0.0` | 개발 | BSD-2-Clause | `LICENSE`, `cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164` | Copyright (c) Felix Böhm |
| `es-module-lexer@2.3.1` | 개발 | MIT | `LICENSE`, `8a4b6c44eebfb026d23719a348145a661a555568dbfdc11618ff2d0dd9306b00` | Copyright (C) 2018-2022 Guy Bedford |
| `escalade@3.2.0` | 개발 | MIT | `license`, `9a9edad7baae52622bddf3c15b2ef8a33d2c89f2d25408ad13e8a7481c6b0c97` | Copyright (c) Luke Edwards &lt;luke.edwards05@gmail.com&gt; (lukeed.com) |
| `escape-string-regexp@4.0.0` | 개발 | MIT | `license`, `5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (https://sindresorhus.com) |
| `eslint-plugin-react-hooks@7.1.1` | 개발 | MIT | `LICENSE`, `da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93` | Copyright (c) Meta Platforms, Inc. and affiliates. |
| `eslint-plugin-react-refresh@0.5.3` | 개발 | MIT | `LICENSE`, `fba570176c68f716676e04cad6c39fb56b763e44fc11be22fe6863ff19092a9b` | Copyright (c) Arnaud Barré (https://github.com/ArnaudBarre) |
| `eslint-scope@9.1.2` | 개발 | BSD-2-Clause | `LICENSE`, `d3a724e2ed749f172ff70b62a1d0631b7d4b0ea273782365a3464d4e2d6b6dbd` | Copyright JS Foundation and other contributors, https://js.foundation; Copyright (C) 2012-2013 Yusuke Suzuki (twitter: @Constellation) and other contributors. |
| `eslint-visitor-keys@3.4.3` | 개발 | Apache-2.0 | `LICENSE`, `d8bf34ff6d190640a01e7704ad78253fc181bc128949d71273fbbaa12f33c0b4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright contributors |
| `eslint-visitor-keys@5.0.1` | 개발 | Apache-2.0 | `LICENSE`, `d8bf34ff6d190640a01e7704ad78253fc181bc128949d71273fbbaa12f33c0b4` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of,; Copyright contributors |
| `eslint@10.7.0` | 개발 | MIT | `LICENSE`, `3b6be04f862a077a4b97929dbf247299360824d9365f8603c263769303ace18c` | Copyright OpenJS Foundation and other contributors, &lt;www.openjsf.org&gt; |
| `espree@11.2.0` | 개발 | BSD-2-Clause | `LICENSE`, `26c95937762a3dc17a3934a0a2773c70259ba4bf28dab713c225e4af8eb9d349` | Copyright (c) Open JS Foundation |
| `esquery@1.7.0` | 개발 | BSD-3-Clause | `license.txt`, `ac68116ae73740de4190892f334992e449a124600924ec761e64319d3aac9e6e` | Copyright (c) 2013, Joel Feenstra |
| `esrecurse@4.3.0` | 개발 | BSD-2-Clause | `package-lock.json#packages`, `aed1e6cf3404651ce46c8f9172ebc1792138f750eb6f1bb6965300faa0f8b9a4` | SPDX declaration: BSD-2-Clause; Registry integrity: sha512-KmfKL3b6G+RXvP8N1vr3Tq1kL/oCFgn2NYXEtqP8/L3pKapUA4G8cFVaoF3SU323CD4XypR/ffioHmkti6/Tag== |
| `estraverse@5.3.0` | 개발 | BSD-2-Clause | `package-lock.json#packages`, `0e423f67e4424d8d1b8ef0f91d8b2465890055e95516cfce98b2830c166a8480` | SPDX declaration: BSD-2-Clause; Registry integrity: sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA== |
| `estree-walker@3.0.3` | 개발 | MIT | `LICENSE`, `8a6dcbabe7179f9c8489c08a7d874d0f1e093ae7449e03756ccf87cb9d0e296e` | Copyright (c) 2015-20 [these people](https://github.com/Rich-Harris/estree-walker/graphs/contributors) |
| `esutils@2.0.3` | 개발 | BSD-2-Clause | `package-lock.json#packages`, `0d545e9da3407a8b21f5aa5df95d8776af4004b843df8f47b6db5e484d0ae00d` | SPDX declaration: BSD-2-Clause; Registry integrity: sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g== |
| `expect-type@1.4.0` | 개발 | Apache-2.0 | `LICENSE`, `7c6cc83c84eaa249a85bf12fe3eedd831bb50c696e8890b5248223ae68c7b408` | Copyright 2024 Misha Kaletsky; copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of, |
| `fast-deep-equal@3.1.3` | 개발 | MIT | `LICENSE`, `7bf9b2de73a6b356761c948d0e9eeb4be6c1270bd04c79cd489c1e400ffdfc1a` | Copyright (c) 2017 Evgeny Poberezkin |
| `fast-json-stable-stringify@2.1.0` | 개발 | MIT | `LICENSE`, `a833d366242c298cf1b10263516572fb8dcbe68eb5072cdcac2b4546e2b4eb36` | Copyright (c) 2017 Evgeny Poberezkin; Copyright (c) 2013 James Halliday; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `fast-levenshtein@2.0.6` | 개발 | MIT | `LICENSE.md`, `942a98cb8846a6354266193f173c1354615827fbb7d67f68399599dff12c4d6a` | Copyright (c) 2013 [Ramesh Nair](http://www.hiddentao.com/) |
| `fdir@6.5.0` | 실행 | MIT | `LICENSE`, `9a39f2aadab11a3697edd668ff2d8ad885b649737b7ab4d3bf12b34e5ada0c86` | Copyright 2023 Abdullah Atta |
| `file-entry-cache@8.0.0` | 개발 | MIT | `LICENSE`, `a0e2f73971f663b49d3c66cc6749fc88de0f475680ccf5b980a9cbcc0c52490f` | Copyright (c) Roy Riojas &amp; Jared Wray |
| `find-up@5.0.0` | 개발 | MIT | `license`, `5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (https://sindresorhus.com) |
| `flat-cache@4.0.1` | 개발 | MIT | `LICENSE`, `a6a23fb76d91d98669f5ed6eb58213df594ab2d56c9e981ae021b194e3d662a7` | Copyright (c) Roy Riojas and Jared Wray |
| `flatted@3.4.2` | 개발 | ISC | `LICENSE`, `148718606d34f467fd08a2176bb4c1ab275f999576f779368503d8d3e3642861` | Copyright (c) 2018-2020, Andrea Giammarchi, @WebReflection; copyright notice and this permission notice appear in all copies. |
| `framer-motion@12.42.2` | 실행 | MIT | `LICENSE.md`, `5ff46083b88563822b0560dd6221ab89d2f74bc97a52d4c97a75020fd62c6f32` | Copyright (c) 2018 Framer B.V. |
| `fsevents@2.3.2` | 개발 | MIT | `package-lock.json#packages`, `7bf00e1bf157ae88e5a4973eeb0b34c2438a7331f411c32472c010331f9b6e5f` | SPDX declaration: MIT; Registry integrity: sha512-xiqMQR4xAeHTuB9uWm+fFRcIOgKBMiOBP+eXiyT7jsgVCq1bkVygt00oASowB7EdtpOHaaPgKt812P9ab+DDKA== |
| `fsevents@2.3.3` | 실행 | MIT | `package-lock.json#packages`, `30e164ba008e191b4b32ee1a012f02324434ca829fed354a387e595750e9eddb` | SPDX declaration: MIT; Registry integrity: sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw== |
| `gensync@1.0.0-beta.2` | 개발 | MIT | `LICENSE`, `e3a956681ee067f971ac413994171b3d90ca801ec6324e76c9c55366cfe31cb0` | Copyright 2018 Logan Smyth &lt;loganfsmyth@gmail.com&gt; |
| `glob-parent@6.0.2` | 개발 | ISC | `LICENSE`, `fc68eb8f1c8e1d6b8be50f3c177927e24791cae7dc251e6253a012f37926a30c` | Copyright (c) 2015, 2019 Elan Shanker, 2021 Blaine Bublitz &lt;blaine.bublitz@gmail.com&gt;, Eric Schoffstall &lt;yo@contra.io&gt; and other contributors; copyright notice and this permission notice appear in all copies. |
| `globals@17.7.0` | 개발 | MIT | `license`, `5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (https://sindresorhus.com) |
| `graceful-fs@4.2.11` | 실행 | ISC | `LICENSE`, `f65c5d9f22a317b2a10803bd1868461ce6499c2ed7217bc80c0cc772a748789c` | Copyright (c) 2011-2022 Isaac Z. Schlueter, Ben Noordhuis, and Contributors; copyright notice and this permission notice appear in all copies. |
| `hermes-estree@0.25.1` | 개발 | MIT | `LICENSE`, `da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93` | Copyright (c) Meta Platforms, Inc. and affiliates. |
| `hermes-parser@0.25.1` | 개발 | MIT | `LICENSE`, `da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93` | Copyright (c) Meta Platforms, Inc. and affiliates. |
| `html-encoding-sniffer@6.0.0` | 개발 | MIT | `LICENSE.txt`, `528eec83cb836a0adda9f8fc3d6a2a70a710d6cc0be9a155f92212c8df28acfa` | Copyright © Domenic Denicola &lt;d@domenic.me&gt; |
| `ignore@5.3.2` | 개발 | MIT | `package-lock.json#packages`, `6b1ac8535de94d668f559b198dd2c359940c029d409ccf6bac58a91c635d2ee8` | SPDX declaration: MIT; Registry integrity: sha512-hsBTNUqQTDwkWtcdYI2i06Y/nUBEsNEDJKjWdigLvegy8kDuJAS8uRlpkkcQpyEXL0Z/pjDy5HBmMjRCJ2gq+g== |
| `ignore@7.0.6` | 개발 | MIT | `package-lock.json#packages`, `4fe0660c1a29242fcc7f902c0437d1fd0e65fdb4ac48302fe897cc05223f446a` | SPDX declaration: MIT; Registry integrity: sha512-BAg6QkE8W+TuQLrrw0Ugr7HegXduRuuj8/ti2kSOc+jz1dmx8/WNcjr6XGnq5YpDWxFwwaavqD0+jIUOKelTsw== |
| `imurmurhash@0.1.4` | 개발 | MIT | `package-lock.json#packages`, `00bde424889709114c17ada070647c7fca69306c0c9d4ab7ee6f98c97a560bc5` | SPDX declaration: MIT; Registry integrity: sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA== |
| `indent-string@4.0.0` | 개발 | MIT | `license`, `48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (sindresorhus.com) |
| `is-extglob@2.1.1` | 개발 | MIT | `LICENSE`, `73b5283588baa142c5baaef5f56d3e8fdea7a30b214e8c5737e87640f882453a` | Copyright (c) 2014-2016, Jon Schlinkert |
| `is-glob@4.0.3` | 개발 | MIT | `LICENSE`, `4cd903859549d4b20b571041f96dfae1136ed079c476126268f9d7cc1b611150` | Copyright (c) 2014-2017, Jon Schlinkert. |
| `is-potential-custom-element-name@1.0.1` | 개발 | MIT | `package-lock.json#packages`, `b8798fe619712678622713300b80f73e8bc211424e0339b55180fa55a3bcb9b0` | SPDX declaration: MIT; Registry integrity: sha512-bCYeRA2rVibKZd+s2625gGnGF/t7DSqDs4dP7CrLA1m7jKWz6pps0LpYLJN8Q64HtmPKJ1hrN3nzPNKFEKOUiQ== |
| `isexe@2.0.0` | 개발 | ISC | `LICENSE`, `4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b` | Copyright (c) Isaac Z. Schlueter and Contributors; copyright notice and this permission notice appear in all copies. |
| `jiti@2.7.0` | 실행 | MIT | `LICENSE`, `46231df5a7733c3f52f11b71f3df61813007745b62b09031acfb45fb42d75082` | Copyright (c) Pooya Parsa &lt;pooya@pi0.io&gt; |
| `js-tokens@4.0.0` | 개발 | MIT | `LICENSE`, `2213d91c606205c71eb051a199478cdc2adde945893404d7f1421436dd6d5cc1` | Copyright (c) 2014, 2015, 2016, 2017, 2018 Simon Lydell |
| `jsdom@29.1.1` | 개발 | MIT | `LICENSE.txt`, `242d37e7cab25cbafc36cc973ee88f9345fddf066afe4f72b7ac3d9ad4e24cce` | Copyright (c) 2010 Elijah Insua |
| `jsesc@3.1.0` | 개발 | MIT | `package-lock.json#packages`, `ece191c59d1773b40c8f847ecd9e82ab1449860bc2cff8fb09b97dd4c7b07d2f` | SPDX declaration: MIT; Registry integrity: sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA== |
| `json-buffer@3.0.1` | 개발 | MIT | `LICENSE`, `715f1f0f2eb7688e53e4e958acdc7fc9e365ae3eaf26efc2604b93cc65fdc3f5` | Copyright (c) 2013 Dominic Tarr |
| `json-schema-traverse@0.4.1` | 개발 | MIT | `LICENSE`, `7bf9b2de73a6b356761c948d0e9eeb4be6c1270bd04c79cd489c1e400ffdfc1a` | Copyright (c) 2017 Evgeny Poberezkin |
| `json-stable-stringify-without-jsonify@1.0.1` | 개발 | MIT | `LICENSE`, `435a6722c786b0a56fbe7387028f1d9d3f3a2d0fb615bb8fee118727c3f59b7b` | COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `json5@2.2.3` | 개발 | MIT | `LICENSE.md`, `53e59feb13058722d977c699eb0407c7bce2f93c949b681bbd2ff31698535927` | Copyright (c) 2012-2018 Aseem Kishore, and [others]. |
| `keyv@4.5.4` | 개발 | MIT | `package-lock.json#packages`, `fc3bfee91b30f215401bbc75330a3954aba2b571531e14ceba9a4dd619094d59` | SPDX declaration: MIT; Registry integrity: sha512-oxVHkHR/EJf2CNXnWxRLW6mg7JyCCUcG0DtEGmL2ctUo1PNTin1PUil+r/+4r5MpVgC/fn1kjsx7mjSujKqIpw== |
| `levn@0.4.1` | 개발 | MIT | `LICENSE`, `b9eb082c39fe245e38793699074c394c43a722c51fce031c3c165cb92a31035c` | Copyright (c) George Zahariev |
| `lightningcss-android-arm64@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `b8fc6eae205002a8dee338de3a02340a24808a80b8450b6badd063fbf7849547` | SPDX declaration: MPL-2.0; Registry integrity: sha512-YK7/ClTt4kAK0vo6w3X+Pnm0D2cf2vPHbhOXdoNti1Ga0al1P4TBZhwjATvjNwLEBCnKvjJc2jQgHXH0NEwlAg== |
| `lightningcss-darwin-arm64@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `0112a99d6c866563f5624b67fe02dcb6af400712f9e47b1002b79f5142a04f7c` | SPDX declaration: MPL-2.0; Registry integrity: sha512-RzeG9Ju5bag2Bv1/lwlVJvBE3q6TtXskdZLLCyfg5pt+HLz9BqlICO7LZM7VHNTTn/5PRhHFBSjk5lc4cmscPQ== |
| `lightningcss-darwin-x64@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `f3c83d64c846eb36efe7c13c6dca4ff5b8082af6caeaa213e37f2dc79d7b107d` | SPDX declaration: MPL-2.0; Registry integrity: sha512-U+QsBp2m/s2wqpUYT/6wnlagdZbtZdndSmut/NJqlCcMLTWp5muCrID+K5UJ6jqD2BFshejCYXniPDbNh73V8w== |
| `lightningcss-freebsd-x64@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `da371d6e2af0cb2b00ef879ac9341f2cce22769bab7da3ed31b6b31efa7f1692` | SPDX declaration: MPL-2.0; Registry integrity: sha512-JCTigedEksZk3tHTTthnMdVfGf61Fky8Ji2E4YjUTEQX14xiy/lTzXnu1vwiZe3bYe0q+SpsSH/CTeDXK6WHig== |
| `lightningcss-linux-arm-gnueabihf@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `50be4aa4573c95d9661c3bdef85d42c7580a05a1ffeb4a0791d75de55a953195` | SPDX declaration: MPL-2.0; Registry integrity: sha512-x6rnnpRa2GL0zQOkt6rts3YDPzduLpWvwAF6EMhXFVZXD4tPrBkEFqzGowzCsIWsPjqSK+tyNEODUBXeeVHSkw== |
| `lightningcss-linux-arm64-gnu@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `f71b085f13b98b720987f197614bb160cc06452d4ccf33326b2dcff297d91860` | SPDX declaration: MPL-2.0; Registry integrity: sha512-0nnMyoyOLRJXfbMOilaSRcLH3Jw5z9HDNGfT/gwCPgaDjnx0i8w7vBzFLFR1f6CMLKF8gVbebmkUN3fa/kQJpQ== |
| `lightningcss-linux-arm64-musl@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `ddf0b19d1b8e370c74edcde84bd7db6eb90f3135a7c1386faa4c149d7dc23947` | SPDX declaration: MPL-2.0; Registry integrity: sha512-UpQkoenr4UJEzgVIYpI80lDFvRmPVg6oqboNHfoH4CQIfNA+HOrZ7Mo7KZP02dC6LjghPQJeBsvXhJod/wnIBg== |
| `lightningcss-linux-x64-gnu@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `58de41d4ac3ccba3d442a587c5be8e3914d8765a098ae5f3f552e1fc2e653edf` | SPDX declaration: MPL-2.0; Registry integrity: sha512-V7Qr52IhZmdKPVr+Vtw8o+WLsQJYCTd8loIfpDaMRWGUZfBOYEJeyJIkqGIDMZPwPx24pUMfwSxxI8phr/MbOA== |
| `lightningcss-linux-x64-musl@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `8900b6b1b8395cbec1453973a575c307e907feef8c857483bfeafe9515072ff7` | SPDX declaration: MPL-2.0; Registry integrity: sha512-bYcLp+Vb0awsiXg/80uCRezCYHNg1/l3mt0gzHnWV9XP1W5sKa5/TCdGWaR/zBM2PeF/HbsQv/j2URNOiVuxWg== |
| `lightningcss-win32-arm64-msvc@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `f85efce2586637af47ddf60e9c0de9def1eea907d1286888f6e5562302742f26` | SPDX declaration: MPL-2.0; Registry integrity: sha512-8SbC8BR40pS6baCM8sbtYDSwEVQd4JlFTOlaD3gWGHfThTcABnNDBda6eTZeqbofalIJhFx0qKzgHJmcPTnGdw== |
| `lightningcss-win32-x64-msvc@1.32.0` | 실행 | MPL-2.0 | `package-lock.json#packages`, `a157defb5f1a8c5c6990a266a6f3bd2312199586d83ab51495a869106b533d17` | SPDX declaration: MPL-2.0; Registry integrity: sha512-Amq9B/SoZYdDi1kFrojnoqPLxYhQ4Wo5XiL8EVJrVsB8ARoC1PWW6VGtT0WKCemjy8aC+louJnjS7U18x3b06Q== |
| `lightningcss@1.32.0` | 실행 | MPL-2.0 | `LICENSE`, `5eba353fe5076ac3432177f8ab1cf75e3afcd0584251e37c3bfead5f447d040e` | Author: lightningcss |
| `locate-path@6.0.0` | 개발 | MIT | `license`, `5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (https://sindresorhus.com) |
| `lru-cache@11.5.2` | 개발 | BlueOak-1.0.0 | `LICENSE.md`, `8a1af140fdfbf5afd3df27f7e662f989c5b963a300020dfafce42033cae9e004` | copyright in it. |
| `lru-cache@5.1.1` | 개발 | ISC | `LICENSE`, `4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b` | Copyright (c) Isaac Z. Schlueter and Contributors; copyright notice and this permission notice appear in all copies. |
| `lz-string@1.5.0` | 개발 | MIT | `LICENSE`, `433fc9dfe659dbfb1e91eed8351f13651e97bfa3ac6d03394c3d63f61d4bbc80` | Copyright (c) 2013 pieroxy |
| `magic-string@0.30.21` | 실행 | MIT | `LICENSE`, `1cbe51b907662f6cb1492b16c359384a595180bf0e4d101603ed525e75c4e484` | Copyright 2018 Rich Harris |
| `mdn-data@2.27.1` | 개발 | CC0-1.0 | `LICENSE`, `36ffd9dc085d529a7e60e1276d73ae5a030b020313e6c5408593a6ae2af39673` | Copyright and Related Rights in the Work and the meaning and intended legal; Copyright and Related Rights in the Work or (ii) assert any associated claims |
| `min-indent@1.0.1` | 개발 | MIT | `license`, `9638fa87f845af6cecc56fab498c1f74f4a98522d3b53377bedcbdb44b5a8dcc` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (sindresorhus.com), James Kyle &lt;me@thejameskyle.com&gt; (thejameskyle.com) |
| `minimatch@10.2.5` | 개발 | BlueOak-1.0.0 | `LICENSE.md`, `2c7c5d22ed5a8ee968c64757710979afcd77438c48b4a265b94e615babd8a901` | copyright in it. |
| `motion-dom@12.42.2` | 실행 | MIT | `LICENSE.md`, `1bf0dc3f7727723e5a032ed12164a47cf92c05204cb1a3485f123c24e2833ed1` | Copyright (c) 2024 [Motion](https://motion.dev) B.V. |
| `motion-utils@12.39.0` | 실행 | MIT | `LICENSE.md`, `1bf0dc3f7727723e5a032ed12164a47cf92c05204cb1a3485f123c24e2833ed1` | Copyright (c) 2024 [Motion](https://motion.dev) B.V. |
| `motion@12.42.2` | 실행 | MIT | `LICENSE.md`, `1bf0dc3f7727723e5a032ed12164a47cf92c05204cb1a3485f123c24e2833ed1` | Copyright (c) 2024 [Motion](https://motion.dev) B.V. |
| `ms@2.1.3` | 개발 | MIT | `license.md`, `1662fae9b5314d11cf51284e2dcd1f006a354f7343f08712a730fcff9a359801` | Copyright (c) 2020 Vercel, Inc. |
| `nanoid@3.3.16` | 실행 | MIT | `LICENSE`, `da4db1480d9beea3483a2eda5c53b22238d0827d57da162b48f122e04d2d9987` | Copyright 2017 Andrey Sitnik &lt;andrey@sitnik.ru&gt;; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `natural-compare@1.4.0` | 개발 | MIT | `package-lock.json#packages`, `f48c705422fa563840df77a37ab410d99c13ba4a46a5011823e6b8465dcf5739` | SPDX declaration: MIT; Registry integrity: sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw== |
| `node-releases@2.0.51` | 개발 | MIT | `LICENSE`, `3706296ed611888111ceccc1dff4712844dea4bde0b185c82d718c3b69895abe` | Copyright (c) 2017 Sergey Rubanov (https://github.com/chicoxyzzy) |
| `obug@2.1.4` | 개발 | MIT | `LICENSE`, `ee48679d379ca6b4493d5e231094d85f818dd9be40b1a4f234fb7ff657ee35d9` | Copyright © 2025-PRESENT Kevin Deng (https://github.com/sxzz); Copyright (c) 2014-2017 TJ Holowaychuk &lt;tj@vision-media.ca&gt;; Copyright (c) 2018-2021 Josh Junon |
| `optionator@0.9.4` | 개발 | MIT | `LICENSE`, `b9eb082c39fe245e38793699074c394c43a722c51fce031c3c165cb92a31035c` | Copyright (c) George Zahariev |
| `p-limit@3.1.0` | 개발 | MIT | `license`, `5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (https://sindresorhus.com) |
| `p-locate@5.0.0` | 개발 | MIT | `license`, `5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (https://sindresorhus.com) |
| `parse5@8.0.1` | 개발 | MIT | `LICENSE`, `8c535800331e1e4439835555b3f9edc7fe9dee2fab0d8bbbd5a982e8b8343d4d` | Copyright (c) 2013-2019 Ivan Nikulin (ifaaan@gmail.com, https://github.com/inikulin) |
| `path-exists@4.0.0` | 개발 | MIT | `license`, `48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (sindresorhus.com) |
| `path-key@3.1.1` | 개발 | MIT | `license`, `48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (sindresorhus.com) |
| `pathe@2.0.3` | 개발 | MIT | `LICENSE`, `52e92576851154bad7737e90cc72818936f43665cb0e3f7428ed8edc8cc5709b` | Copyright (c) Pooya Parsa &lt;pooya@pi0.io&gt; - Daniel Roe &lt;daniel@roe.dev&gt;; Copyright Joyent, Inc. and other Node contributors.; Copyright (c) 2023-present Fabio Spampinato |
| `picocolors@1.1.1` | 실행 | ISC | `LICENSE`, `6582629e2979466878f6014313dcc2f3756c9616148682227ce3063dde310750` | Copyright (c) 2021-2024 Oleksii Raspopov, Kostiantyn Denysov, Anton Verinov; copyright notice and this permission notice appear in all copies. |
| `picomatch@4.0.5` | 실행 | MIT | `LICENSE`, `d0cd141b0c322fded5dfad1d4645bb2fedfc05b7321fe1009469638190d59ef9` | Copyright (c) 2017-present, Jon Schlinkert. |
| `pixelmatch@7.2.0` | 개발 | ISC | `LICENSE`, `cfec0482fb785fe27e3b368a2d9e84bf7a61b275e83ec582bf288e98cd530bb0` | Copyright (c) 2025, Mapbox |
| `playwright-core@1.61.1` | 개발 | Apache-2.0 | `LICENSE`, `45873d00a0dd243596deb4aa23b2493b3d1f0671921bf2538ea431d7380220eb` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of, |
| `playwright@1.61.1` | 개발 | Apache-2.0 | `LICENSE`, `45873d00a0dd243596deb4aa23b2493b3d1f0671921bf2538ea431d7380220eb` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of, |
| `pngjs@7.0.0` | 개발 | MIT | `LICENSE`, `be75ef59c5cf59715588a17a82dff7dd3e83c4dba3c458676bb9311e05fbedc5` | Author: pngjs |
| `postcss@8.5.19` | 실행 | MIT | `LICENSE`, `5be1f3465bba68a626777f984878814aaf35e7ef8e9fd314d469bcf887050fb8` | Copyright 2013 Andrey Sitnik &lt;andrey@sitnik.es&gt;; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `prelude-ls@1.2.1` | 개발 | MIT | `LICENSE`, `b9eb082c39fe245e38793699074c394c43a722c51fce031c3c165cb92a31035c` | Copyright (c) George Zahariev |
| `prettier@3.9.5` | 개발 | MIT | `LICENSE`, `b0f2417199889f1c0d28ec4e0244eacf1a15de5819d61f641dd7d8f45153ac9c` | Copyright © James Long and contributors |
| `pretty-format@27.5.1` | 개발 | MIT | `LICENSE`, `52412d7bc7ce4157ea628bbaacb8829e0a9cb3c58f57f99176126bc8cf2bfc85` | Copyright (c) Facebook, Inc. and its affiliates. |
| `punycode@2.3.1` | 개발 | MIT | `package-lock.json#packages`, `727909d89bc4d56fba513f0b62840c21bb11175e8e633290bc4f9c6f3d9cbc26` | SPDX declaration: MIT; Registry integrity: sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg== |
| `react-dom@19.2.7` | 실행 | MIT | `LICENSE`, `da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93` | Copyright (c) Meta Platforms, Inc. and affiliates. |
| `react-is@17.0.2` | 개발 | MIT | `LICENSE`, `52412d7bc7ce4157ea628bbaacb8829e0a9cb3c58f57f99176126bc8cf2bfc85` | Copyright (c) Facebook, Inc. and its affiliates. |
| `react@19.2.7` | 실행 | MIT | `LICENSE`, `da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93` | Copyright (c) Meta Platforms, Inc. and affiliates. |
| `redent@3.0.0` | 개발 | MIT | `license`, `48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (sindresorhus.com) |
| `require-from-string@2.0.2` | 개발 | MIT | `license`, `6ee0feb1f6ef996ff5a68600f8cf98909cf412d39ef3cdceaefd87d636fa1b7f` | Copyright (c) Vsevolod Strukchinsky &lt;floatdrop@gmail.com&gt; (github.com/floatdrop) |
| `rolldown@1.1.5` | 실행 | MIT | `LICENSE`, `23ecfff35a5a2e80d92142f75228912c3b1abc4b5a8337a821ff4397e2f9f734` | Copyright (c) 2024-present VoidZero Inc. &amp; Contributors |
| `saxes@6.0.0` | 개발 | ISC | `package-lock.json#packages`, `198540add1c28f935c5edf73bf2f2b2344ac54f126810568d00dbc7c27eed6bc` | SPDX declaration: ISC; Registry integrity: sha512-xAg7SOnEhrm5zI3puOOKyy1OMcMlIJZYNJY7xLBwSze0UjhPLnWfj2GF2EpT0jmzaJKIWKHLsaSSajf35bcYnA== |
| `scheduler@0.27.0` | 실행 | MIT | `LICENSE`, `da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93` | Copyright (c) Meta Platforms, Inc. and affiliates. |
| `semver@6.3.1` | 개발 | ISC | `LICENSE`, `4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b` | Copyright (c) Isaac Z. Schlueter and Contributors; copyright notice and this permission notice appear in all copies. |
| `semver@7.8.5` | 개발 | ISC | `LICENSE`, `4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b` | Copyright (c) Isaac Z. Schlueter and Contributors; copyright notice and this permission notice appear in all copies. |
| `shebang-command@2.0.0` | 개발 | MIT | `license`, `69dee148a2cc470554dfa7142e830662062394d0fe67cddd379aba90dc60d6b3` | Copyright (c) Kevin Mårtensson &lt;kevinmartensson@gmail.com&gt; (github.com/kevva) |
| `shebang-regex@3.0.0` | 개발 | MIT | `license`, `48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (sindresorhus.com) |
| `siginfo@2.0.0` | 개발 | ISC | `LICENSE`, `3bdddf0b9b08aaa2fe4365b803fc958ed32c0597ca0bd727be8d9fcb8b248d18` | Copyright (c) 2017, Emil Bay &lt;github@tixz.dk&gt;; copyright notice and this permission notice appear in all copies. |
| `source-map-js@1.2.1` | 실행 | BSD-3-Clause | `LICENSE`, `6cb0631f71c7749763fd3dd1d5bee52dd1070ec17f2edc1710079ad070bd2fbd` | Copyright (c) 2009-2011, Mozilla Foundation and contributors |
| `stackback@0.0.2` | 개발 | MIT | `package-lock.json#packages`, `5bec882a9277ea05b42e8288a05ff968a769395b5afd2e34892d12fce40e6dfd` | SPDX declaration: MIT; Registry integrity: sha512-1XMJE5fQo1jGH6Y/7ebnwPOBEkIEnT4QF32d5R1+VXdXveM0IBMJt8zfaxX1P3QhVwrYe+576+jkANtSS2mBbw== |
| `std-env@4.2.0` | 개발 | MIT | `LICENCE`, `a6f36438e46fb911859f3b9c4cad045ba64e1af3d8f4512c60258fa2d7552d28` | Copyright (c) Pooya Parsa &lt;pooya@pi0.io&gt; |
| `strip-indent@3.0.0` | 개발 | MIT | `license`, `48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (sindresorhus.com) |
| `symbol-tree@3.2.4` | 개발 | MIT | `LICENSE`, `9ea1eccdabe469767a9edb9249a840b2461cf91b2434bf8a3e2fc1f414311cb1` | Copyright (c) 2015 Joris van der Wel |
| `tailwindcss@4.3.3` | 실행 | MIT | `LICENSE`, `60e0b68c0f35c078eef3a5d29419d0b03ff84ec1df9c3f9d6e39a519a5ae7985` | Copyright (c) Tailwind Labs, Inc. |
| `tapable@2.3.3` | 실행 | MIT | `LICENSE`, `824ef6c33ae5ecbbab65d37f2b37da2bfc81d76cf7676ec0f59d00a0a38bdb75` | Copyright JS Foundation and other contributors |
| `tinybench@2.9.0` | 개발 | MIT | `LICENSE`, `cebc084d54e6dd99e53292ddb4bc1cdb63d9bfcd9ce438fe3aa6eb106d79e2ea` | Copyright (c) 2022 Tinylibs |
| `tinyexec@1.2.4` | 개발 | MIT | `LICENSE`, `f95f668fe64081ddb4153b322e34fdd719b991285ed08177d5ad7133b7988d92` | Copyright (c) 2024 Tinylibs |
| `tinyglobby@0.2.17` | 실행 | MIT | `LICENSE`, `22c68811e174cbbfb3813d4135918df4f540959c14d872e601d9abe83d3cde8f` | Copyright (c) 2024 Madeline Gurriarán |
| `tinyrainbow@3.1.0` | 개발 | MIT | `LICENCE`, `cebc084d54e6dd99e53292ddb4bc1cdb63d9bfcd9ce438fe3aa6eb106d79e2ea` | Copyright (c) 2022 Tinylibs |
| `tldts-core@7.4.9` | 개발 | MIT | `LICENSE`, `c64182d48160db948b6aa97a984f1a32974ce4d2053900361264cd33853796cb` | Copyright (c) 2017 Thomas Parisot, 2018 Rémi Berson |
| `tldts@7.4.9` | 개발 | MIT | `LICENSE`, `c64182d48160db948b6aa97a984f1a32974ce4d2053900361264cd33853796cb` | Copyright (c) 2017 Thomas Parisot, 2018 Rémi Berson |
| `tough-cookie@6.0.2` | 개발 | BSD-3-Clause | `LICENSE`, `22ec6791c91ba42c0516a05f4cbdde019aae4687f8a38c5ca7e8a69ee68f851d` | Copyright (c) 2015, Salesforce.com, Inc. |
| `tr46@6.0.0` | 개발 | MIT | `LICENSE.md`, `499d6d466d064e0460427967a344e2a32fcb86ea8c6cd1a285ec4f1fa03fba67` | Copyright (c) Sebastian Mayr |
| `ts-api-utils@2.5.0` | 개발 | MIT | `LICENSE.md`, `76c9d5f5ea942054715c026f33f8717c9e24603196a3737b8899afa216bcbdab` | Author: JoshuaKGoldberg |
| `tslib@2.8.1` | 실행 | 0BSD | `LICENSE.txt`, `210b19e543130388c68654b7497e967119ce17145f66ab7d85688fbd70f08751` | Copyright (c) Microsoft Corporation. |
| `type-check@0.4.0` | 개발 | MIT | `LICENSE`, `b9eb082c39fe245e38793699074c394c43a722c51fce031c3c165cb92a31035c` | Copyright (c) George Zahariev |
| `typescript-eslint@8.64.0` | 개발 | MIT | `LICENSE`, `2eb5c7a0bba9deb77a98c81bf6b9d3fb1c67118eebf968b6b1a787b3f8928ee0` | Copyright (c) 2019 typescript-eslint and other contributors |
| `typescript@6.0.2` | 개발 | Apache-2.0 | `LICENSE.txt`, `a7d00bfd54525bc694b6e32f64c7ebcf5e6b7ae3657be5cc12767bce74654a47` | Author: Microsoft Corp. |
| `undici-types@6.21.0` | 실행 | MIT | `LICENSE`, `a6db8096b2707bc0102d256917d4d33f298ba36d8c3f25de067a2b5bb379db27` | Copyright (c) Matteo Collina and Undici contributors |
| `undici@7.28.0` | 개발 | MIT | `LICENSE`, `a6db8096b2707bc0102d256917d4d33f298ba36d8c3f25de067a2b5bb379db27` | Copyright (c) Matteo Collina and Undici contributors |
| `update-browserslist-db@1.2.3` | 개발 | MIT | `LICENSE`, `c414dde36704bd9c8a76c7aa2921b19270ff9abeb478ea0050250d16cf29b0f6` | Copyright 2022 Andrey Sitnik &lt;andrey@sitnik.ru&gt; and other contributors; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `uri-js@4.4.1` | 개발 | BSD-2-Clause | `LICENSE`, `0af366eff4c01ec147c9c61ea9e8ffad64a4294754c9d79355f3fd1b97cb2fb9` | Copyright 2011 Gary Court. All rights reserved. |
| `vite@8.1.5` | 실행 | MIT | `LICENSE.md`, `b1d741c26b53de1bbc0d4d7d3365b79888f9fe511527544a8a7b8e24dec43147` | Copyright (c) 2019-present, VoidZero Inc. and Vite contributors |
| `vitest@4.1.10` | 개발 | MIT | `LICENSE.md`, `881d660c26831481b697e39724d4a35c9f86e07b67156d4aeb693a0b39910435` | Copyright (c) 2021-Present VoidZero Inc. and Vitest contributors |
| `w3c-xmlserializer@5.0.0` | 개발 | MIT | `LICENSE.md`, `ab654de803cdaa9e2819ab2e934bdf7f757e308649ec231d78e80e92425cdc34` | Copyright © Sebastian Mayr |
| `webidl-conversions@8.0.1` | 개발 | BSD-2-Clause | `LICENSE.md`, `a889cc4dbee2ae172c179856b25d75b0b7a5a136e1b97109b9b590b2ff1a879c` | Copyright (c) 2014, Domenic Denicola |
| `whatwg-mimetype@5.0.0` | 개발 | MIT | `LICENSE.txt`, `528eec83cb836a0adda9f8fc3d6a2a70a710d6cc0be9a155f92212c8df28acfa` | Copyright © Domenic Denicola &lt;d@domenic.me&gt; |
| `whatwg-url@16.0.1` | 개발 | MIT | `LICENSE.txt`, `db480f236292a093e77a83c35431a8496624e1e664a3547768a9ce2bdde39877` | Copyright (c) Sebastian Mayr |
| `which@2.0.2` | 개발 | ISC | `LICENSE`, `4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b` | Copyright (c) Isaac Z. Schlueter and Contributors; copyright notice and this permission notice appear in all copies. |
| `why-is-node-running@2.3.0` | 개발 | MIT | `LICENSE`, `6a134e51aa31496c15a741592fc5d782b2dbf8d8b6b8524e15c8520ae0cd6374` | Copyright (c) 2016 Mathias Buus |
| `word-wrap@1.2.5` | 개발 | MIT | `LICENSE`, `73b5283588baa142c5baaef5f56d3e8fdea7a30b214e8c5737e87640f882453a` | Copyright (c) 2014-2016, Jon Schlinkert |
| `xml-name-validator@5.0.0` | 개발 | Apache-2.0 | `LICENSE.txt`, `a6cba85bc92e0cff7a450b1d873c0eaa2e9fc96bf472df0247a26bec77bf3ff9` | copyright notice that is included in or attached to the work; copyright license to reproduce, prepare Derivative Works of, |
| `xmlchars@2.2.0` | 개발 | MIT | `LICENSE`, `45d196313c2647d313cc65ca9b093d2d6974b64d35ee7346f2c60c9d518dff2c` | Copyright Louis-Dominique Dubeau and contributors to xmlchars; COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER |
| `yallist@3.1.1` | 개발 | ISC | `LICENSE`, `4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b` | Copyright (c) Isaac Z. Schlueter and Contributors; copyright notice and this permission notice appear in all copies. |
| `yocto-queue@0.1.0` | 개발 | MIT | `license`, `5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3` | Copyright (c) Sindre Sorhus &lt;sindresorhus@gmail.com&gt; (https://sindresorhus.com) |
| `zod-validation-error@4.0.2` | 개발 | MIT | `LICENSE`, `03cc9a630489a2544b799548a0e8b134f382fe09fa06dc22b339091b28b8f4a8` | Copyright 2022 Causaly, Inc &lt;front-end@causaly.com&gt; |
| `zod@4.4.3` | 실행 | MIT | `LICENSE`, `3f1189b28e3866e0d979968d466b78f813f76827cfdca1fbb124cc0a5c8841f8` | Copyright (c) 2025 Colin McDonnell |

<!-- END GENERATED NPM DEPENDENCIES -->
