# Lines configured by zsh-newuser-install
HISTFILE=~/.histfile
HISTSIZE=5000
SAVEHIST=10000
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


export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm use --silent stable
