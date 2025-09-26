if status is-interactive
    set -U fish_prompt_pwd_dir_length 0
    set -U fish_greeting ""
    fish_add_path -g $HOME/.local/bin
end

if uwsm check may-start
    exec uwsm start hyprland-uwsm.desktop
end

alias gf='git fetch -vfpPt --all --update-shallow -j 5'

direnv hook fish | source

~/.local/bin/mise activate fish | source
