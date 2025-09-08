if status is-interactive
    set -U fish_prompt_pwd_dir_length 0
    set -U fish_greeting ""
    fish_add_path -g $HOME/.local/bin
end

~/.local/bin/mise activate fish | source
