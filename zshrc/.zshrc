# Lines configured by zsh-newuser-install
HISTFILE=~/.histfile
HISTSIZE=5000
SAVEHIST=10000
setopt autocd extendedglob nomatch notify
unsetopt beep
bindkey -e
# End of lines configured by zsh-newuser-install

# Word separators for ZLE word commands (default: *?_-.[]~=/&;!#$%^(){}<>)
# These terminate a word, and a trailing one is deleted with the preceding word.
WORDCHARS='*?~=&;!#$%^'

# Ctrl+Backspace (kitty sends ^W) kills the word/subword behind the cursor
bindkey '^W' backward-kill-word

# Home / End (kitty emits \e[H / \e[F; other terms use \eOH / \~)
bindkey '^[[H'  beginning-of-line
bindkey '^[[F'  end-of-line
bindkey '^[OH'  beginning-of-line
bindkey '^[OF'  end-of-line
bindkey '^[[1~' beginning-of-line
bindkey '^[[4~' end-of-line

# Ctrl+Left / Ctrl+Right as word jump (xterm-style and variants)
bindkey '^[[1;5D' backward-word
bindkey '^[[1;5C' forward-word
bindkey '^[[5D'   backward-word
bindkey '^[[5C'   forward-word
bindkey '^[Od'    backward-word
bindkey '^[Oc'    forward-word

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
export DIGIKEY_CLIENT_SECRET="$(secret-tool lookup service digikey client secret)"
export DIGIKEY_CLIENT_ID="$(secret-tool lookup service digikey client id)" 
export DIGIKEY_SITE="AU"
export DIGIKEY_CURRENCY="AU"

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


eval "$(direnv hook zsh)"
