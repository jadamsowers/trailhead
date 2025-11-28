#!/usr/bin/env bash

set -e

echo ">>> Detecting Homebrew Python path..."

# Detect Homebrew prefix
if [[ -d "/opt/homebrew/bin" ]]; then
    BREW_PREFIX="/opt/homebrew"
elif [[ -d "/usr/local/bin" ]]; then
    BREW_PREFIX="/usr/local"
else
    echo "❌ Homebrew installation not found!"
    exit 1
fi

PY="$BREW_PREFIX/bin/python3"
PIP="$BREW_PREFIX/bin/pip3"

if [[ ! -x "$PY" ]]; then
    echo "❌ python3 not found at $PY"
    exit 1
fi

echo ">>> Homebrew Python found at $PY"

# Create ~/bin if missing
mkdir -p "$HOME/bin"

echo ">>> Creating symlinks in ~/bin ..."
ln -sf "$PY" "$HOME/bin/python"
ln -sf "$PIP" "$HOME/bin/pip"

echo "✔️  Created:"
echo "   $HOME/bin/python -> $PY"
echo "   $HOME/bin/pip    -> $PIP"

# Ensure ~/bin is in PATH
if ! grep -q 'export PATH="$HOME/bin:$PATH"' "$HOME/.zshrc"; then
    echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.zshrc"
    echo ">>> Added ~/bin to PATH in ~/.zshrc"
else
    echo ">>> ~/bin already in PATH"
fi

echo ">>> Reloading shell configuration..."
source "$HOME/.zshrc"

echo ">>> Done! Verifying..."

echo -n "python -> "; which python
python --version

echo -n "pip -> "; which pip
pip --version

echo "🎉 Python and pip are now pr

