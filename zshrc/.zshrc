# Lines configured by zsh-newuser-install
HISTFILE=~/.histfile
HISTSIZE=1000
SAVEHIST=5000
setopt autocd extendedglob nomatch notify
unsetopt beep
bindkey -e
# End of lines configured by zsh-newuser-install
# The following lines were added by compinstall
zstyle :compinstall filename '/home/benri/.zshrc'

autoload -Uz compinit
compinit
# End of lines added by compinstall

# Config management
export CONFIGDIR="$HOME/.config"
export XDG_CONFIG_DIR="$CONFIGDIR"
export STOW_DIR="$HOME/.dotfiles"
export EDITOR="nvim"

source $HOME/.zsh_aliases

eval "$(starship init zsh)"

export PATH=$PATH:$HOME/.local/bin
export PATH=$PATH:$HOME/.local/share/nvim/mason/bin/

source /usr/share/zsh-antidote/antidote.zsh
antidote load

function cheat () {
	curl -sS "cheat.sh/$1" | less -R
}

function nvim-git-root() {
    local file_path="${1:-.}"

    # Convert to absolute path
    if [[ "$file_path" != /* ]]; then
        file_path="$(cd "$(dirname "$file_path")" && pwd)/$(basename "$file_path")"
    fi

    # Find the git root
    local git_root
    git_root=$(git -C "$(dirname "$file_path")" rev-parse --show-toplevel 2>/dev/null)

    if [[ -z "$git_root" ]]; then
        git_root=$(dirname "$file_path")
    fi

    # Open nvim from the git root
    cd "$git_root" && nvim "$file_path"
}

# yazi intergration
function y() {
	local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
	command yazi "$@" --cwd-file="$tmp"
	IFS= read -r -d '' cwd < "$tmp"
	[ "$cwd" != "$PWD" ] && [ -d "$cwd" ] && builtin cd -- "$cwd"
	command rm -f -- "$tmp"
}

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm use --silent stable
