import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('public/assets/generated',{recursive:true});
const palette={navy:'#071521',ice:'#79b9d8',amber:'#f2a51f',spruce:'#294f45',snow:'#f2e7d0'};
await writeFile('public/assets/generated/palette.json',JSON.stringify(palette,null,2));
console.log('Generated original asset palette and metadata.');
