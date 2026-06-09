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

alias nvimc='zsh -c "cd $(echo $STOW_DIR) && nvim"'
alias stowall='stow */'
alias unstow='stow -D'

eval "$(starship init zsh)"

export PATH=$PATH:$HOME/.local/bin

source /usr/share/zsh-antidote/antidote.zsh

antidote load


# yazi intergration
function y() {
	local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
	command yazi "$@" --cwd-file="$tmp"
	IFS= read -r -d '' cwd < "$tmp"
	[ "$cwd" != "$PWD" ] && [ -d "$cwd" ] && builtin cd -- "$cwd"
	command rm -f -- "$tmp"
}
