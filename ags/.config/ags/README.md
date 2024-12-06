# Starter Config

if suggestions don't work, first make sure
you have TypeScript LSP working in your editor

if you do not want typechecking only suggestions

```json
// tsconfig.json
"checkJs": false
```

types are symlinked to:
/usr/share/com.github.Aylur.ags/types

## Build

```sh
npm run build
```
or
```sh
bun run build
```
or
```sh
out=build
mkdir -p $out

bun run esbuild \
  --bundle ./main.ts \
  --outfile=$out/main.js \
  --format=esm \
  --external:resource://\* \
  --external:gi://\*

bun run esbuild --bundle ./greeter/greeter.ts --outfile=$out/greeter.js --format=esm --external:resource://\* --external:gi://\*

cp -r assets $out
cp -r style $out
cp -r greeter $out
cp -r widget $out
```
