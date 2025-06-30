@echo off
echo Cleaning NX native temp cache...
for /d %%G in ("%TEMP%\nx-native-file-cache-*") do (
    echo Deleting %%G
    rmdir /s /q "%%G"
)

echo Removing node_modules...
rmdir /s /q node_modules

echo Deleting pnpm-lock.yaml...
del /f /q pnpm-lock.yaml

echo Pruning pnpm store...
pnpm store prune

echo Reinstalling dependencies with --force...
pnpm install --force

echo Done.
pause
