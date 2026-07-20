import { access } from 'node:fs/promises';
for(const path of ['public/assets/icon.svg','docs/images/gameplay-concept.png'])await access(path);
console.log('Required original assets are present.');
