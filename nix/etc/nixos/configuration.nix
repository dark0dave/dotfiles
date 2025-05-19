# https://search.nixos.org/options and in the NixOS manual (`nixos-help`).
{ config, lib, pkgs, ... }:
let
  unstableTarball =
    fetchTarball
      https://github.com/NixOS/nixpkgs/archive/nixos-unstable.tar.gz;
in
{
  nixpkgs.config.allowUnfree = true;
  imports =
    [
      ./hardware-configuration.nix
   ];
  # Use the systemd-boot EFI boot loader.
  networking.hostName = "nixos";
  networking.wireless.enable = false;  # Enables wireless support via wpa_supplicant.
  networking.networkmanager.enable = true;  # Easiest to use and most distros use this by default.
  networking.enableIPv6 = false;
  networking.networkmanager.dns = "default";
  networking.resolvconf.enable = false;
  networking.networkmanager.ethernet.macAddress = "random";
  nixpkgs.config = {
    packageOverrides = pkgs: {
      unstable = import unstableTarball {
        config = config.nixpkgs.config;
      };
    };
  };
  time.timeZone = "Europe/London";
  # Configure network proxy if necessary
  # networking.proxy.default = "http://user:password@proxy:port/";
  # networking.proxy.noProxy = "127.0.0.1,localhost,internal.domain";
  # Select internationalisation properties.
  i18n.defaultLocale = "en_US.UTF-8";
  # https://search.nixos.org/options?channel=24.11&from=0&size=50&sort=relevance&type=packages&query=fonts
  fonts = {
    fontDir.enable = true;
    enableDefaultPackages = true;
    packages = with pkgs; [
      dejavu_fonts
      freefont_ttf
      gyre-fonts # TrueType substitutes for standard PostScript fonts
      liberation_ttf
      unifont
      noto-fonts-color-emoji
      corefonts
      ubuntu_font_family
      powerline-fonts
      font-awesome
      source-code-pro
      noto-fonts
      noto-fonts-cjk-sans
      nerdfonts
    ];

    fontconfig = {
      enable = true;
      useEmbeddedBitmaps = true;
      defaultFonts = {
        monospace = [
          "Noto Mono for Powerline"
        ];
        sansSerif = [
          "Noto Sans"
        ];
        serif = [
          "Noto Serif"
        ];
        emoji = [
          "Noto Color Emoji"
        ];
      };
    };
  };
  # console = {
  #  font = "Lat2-Terminus16";
  #  keyMap = "us";
  #  useXkbConfig = true; # use xkb.options in tty.
  # };
  # Enable the X11 windowing system.
  xdg.icons.enable = true;
  # https://wiki.nixos.org/wiki/Category:Desktop_environment
  services.xserver.displayManager.lightdm.enable = true;
  services.xserver = { 
    enable = true;
    desktopManager = {
      xterm.enable = false;
      xfce.enable = true;
    };
  };
  # Thunar
  programs.xfconf.enable = true;
  programs.thunar.enable = true;
  programs.thunar.plugins = with pkgs.xfce; [
    thunar-archive-plugin
    thunar-media-tags-plugin
    thunar-volman
  ];
  services.gvfs.enable = true; # Mount, trash, and other functionalities
  services.tumbler.enable = true; # Thumbnail support for images
  services.displayManager.defaultSession = "xfce";
  xdg.portal = {
    enable = true;
    extraPortals = [ pkgs.xdg-desktop-portal-gtk ];
  };
  # Dark theme
  # https://gitlab.gnome.org/GNOME/gsettings-desktop-schemas/-/blob/main/schemas/org.gnome.desktop.interface.gschema.xml.in?ref_type=heads
  environment.etc = {
    "xdg/gtk-2.0/gtkrc".text = "gtk-error-bell=0";
    "xdg/gtk-3.0/settings.ini".text = ''
      [Settings]
      gtk-error-bell=false
      gtk-application-prefer-dark-theme=1
      gtk-theme='Material-Black-Cherry'
      icon-theme='Sweet-Red-Filled'
      monospace-font-name='Noto Mono for Powerline 12'
      clock-show-seconds=true
      color-scheme='prefer-dark'
      cursor-theme='oreo_spark_red_bordered_cursors'
    '';
    "xdg/gtk-4.0/settings.ini".text = ''
      [Settings]
      gtk-error-bell=false
      gtk-application-prefer-dark-theme=1
      gtk-theme='Material-Black-Cherry'
      icon-theme='Sweet-Red-Filled'
      monospace-font-name='Noto Mono for Powerline 12'
      clock-show-seconds=true
      color-scheme='prefer-dark'
      cursor-theme='oreo_spark_red_bordered_cursors'
    '';
  };
  # Configure keymap in X11
  services.xserver.xkb.layout = "us";
  # services.xserver.xkb.options = "eurosign:e,caps:escape";
  # Enable CUPS to print documents.
  # services.printing.enable = true;
  # Enable sound.
  # hardware.pulseaudio.enable = true;
  # OR
  services.pipewire = {
    enable = true;
    pulse.enable = true;
  };
  # Enable touchpad support (enabled default in most desktopManager).
  # services.libinput.enable = true;
  # Define a user account. Don't forget to set a password with ‘passwd’.
  users.users.x = {
    isNormalUser = true;
    createHome = false;
    uid = 1000;
    home = "/home/x";
    extraGroups = [ "wheel" "networkmanager" ]; # Enable ‘sudo’ for the user.
    packages = with pkgs; [
      tree
    ];
  };
  programs.dconf.profiles.gdm.databases = [{
   settings."org/gnome/settings-daemon/plugins/power" = {
    # 30 seconds until automatic suspend
    idle-delay = lib.gvariant.mkInt32 0;
    sleep-inactive-ac-timeout = lib.gvariant.mkInt32 0;
    sleep-inactive-ac-type = "nothing";
   };
  }];
  services.tor.enable = true;
  services.tor.client.enable = true;
  services.flatpak.enable = true;
  environment.pathsToLink = [ "/share/xdg-desktop-portal" "/share/applications" ];
  services.mullvad-vpn.package = pkgs.unstable.mullvad-vpn;
  services.mullvad-vpn.enable = true;
  programs.zsh.enable = true;
  virtualisation.containers.enable = true;
  virtualisation = {
    podman = {
      enable = true;
      # Create a `docker` alias for podman, to use it as a drop-in replacement
      dockerCompat = true;
      # Required for containers under podman-compose to be able to talk to each other.
      defaultNetwork.settings.dns_enabled = true;
    };
  };

  users.users.myuser = {
    isNormalUser = true;
    extraGroups = [ "podman" ];
  };

  # List packages installed in system profile. To search, run:
  # $ nix search wget
  environment.systemPackages = with pkgs; [
    amberol
    btop
    caffeine-ng
    candy-icons
    cifs-utils
    citrix_workspace
    direnv
    element-desktop
    ffmpeg
    freetube
    gh
    gimp
    gitFull
    gparted
    helix
    kitty
    unstable.legcord
    libreoffice-fresh
    librewolf
    lsof
    material-design-icons
    oreo-cursors-plus
    p7zip-rar
    podman
    popcorntime
    protonmail-desktop
    rename
    rofi-unwrapped
    signal-desktop
    stow
    sweet-folders
    texliveFull
    unstable.deskflow
    unstable.limo
    unstable.nexusmods-app
    vlc
    vscodium
    wezterm
    wget
    xarchiver
    yt-dlp
    zim
  ];
  services.ollama = {
    enable = true;
    acceleration = "rocm";
    environmentVariables = {
      HCC_AMDGPU_TARGET = "gfx110"; # used to be necessary, but doesn't seem to anymore
    };
    rocmOverrideGfx = "11.0.2";
  };
  environment.shells = with pkgs; [ zsh ];
  users.defaultUserShell = pkgs.zsh;
  programs.steam = {
    enable = true;
    remotePlay.openFirewall = true; # Open ports in the firewall for Steam Remote Play
    dedicatedServer.openFirewall = true; # Open ports in the firewall for Source Dedicated Server
    localNetworkGameTransfers.openFirewall = true; # Open ports in the firewall for Steam Local Network Game Transfers
  };
  programs.steam.gamescopeSession.enable = true;
  # Some programs need SUID wrappers, can be configured further or are
  # started in user sessions.
  programs.mtr.enable = true;
  programs.gnupg.agent = {
    enable = true;
    enableSSHSupport = true;
  };

  # List services that you want to enable:
  # Enable the OpenSSH daemon.
  services.openssh.enable = false;
  # Open ports in the firewall.
  networking.firewall.allowedTCPPorts = [ 24800 ];
  # networking.firewall.allowedUDPPorts = [ ];
  # Or disable the firewall altogether.
  networking.firewall.enable = true;
  # Copy the NixOS configuration file and link it from the resulting system
  # (/run/current-system/configuration.nix). This is useful in case you
  # accidentally delete configuration.nix.
  system.copySystemConfiguration = true;
  # This option defines the first version of NixOS you have installed on this particular machine,
  # and is used to maintain compatibility with application data (e.g. databases) created on older NixOS versions.
  #
  # Most users should NEVER change this value after the initial install, for any reason,
  # even if you've upgraded your system to a new NixOS release.
  #
  # This value does NOT affect the Nixpkgs version your packages and OS are pulled from,
  # so changing it will NOT upgrade your system - see https://nixos.org/manual/nixos/stable/#sec-upgrading for how
  # to actually do that.
  #
  # This value being lower than the current NixOS release does NOT mean your system is
  # out of date, out of support, or vulnerable.
  #
  # Do NOT change this value unless you have manually inspected all the changes it would make to your configuration,
  # and migrated your data accordingly.
  #
  # For more information, see `man configuration.nix` or https://nixos.org/manual/nixos/stable/options#opt-system.stateVersion .
  system.stateVersion = "24.11";
}
