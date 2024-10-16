// lib/session.ts
import GLib from "gi://GLib?version=2.0";
Object.assign(globalThis, {
  OPTIONS: `${GLib.get_user_cache_dir()}/ags/options.json`,
  TMP: `${GLib.get_tmp_dir()}/asztal`,
  USER: GLib.get_user_name()
});
Utils.ensureDirectory(TMP);
App.addIcons(`${App.configDir}/assets`);

// lib/option.ts
import {Variable as Variable2} from "resource:///com/github/Aylur/ags/variable.js";
function getOptions(object, path = "") {
  return Object.keys(object).flatMap((key) => {
    const obj = object[key];
    const id = path ? path + "." + key : key;
    if (obj instanceof Variable2) {
      obj.id = id;
      return obj;
    }
    if (typeof obj === "object")
      return getOptions(obj, id);
    return [];
  });
}
function mkOptions(cacheFile, object) {
  for (const opt of getOptions(object))
    opt.init(cacheFile);
  Utils.ensureDirectory(cacheFile.split("/").slice(0, -1).join("/"));
  const configFile = `${TMP}/config.json`;
  const values = getOptions(object).reduce((obj, { id, value }) => ({ [id]: value, ...obj }), {});
  Utils.writeFileSync(JSON.stringify(values, null, 2), configFile);
  Utils.monitorFile(configFile, () => {
    const cache = JSON.parse(Utils.readFile(configFile) || "{}");
    for (const opt of getOptions(object)) {
      if (JSON.stringify(cache[opt.id]) !== JSON.stringify(opt.value))
        opt.value = cache[opt.id];
    }
  });
  function sleep(ms = 0) {
    return new Promise((r) => setTimeout(r, ms));
  }
  async function reset([opt, ...list] = getOptions(object), id = opt?.reset()) {
    if (!opt)
      return sleep().then(() => []);
    return id ? [id, ...await sleep(50).then(() => reset(list))] : await sleep().then(() => reset(list));
  }
  return Object.assign(object, {
    configFile,
    array: () => getOptions(object),
    async reset() {
      return (await reset()).join("\n");
    },
    handler(deps, callback) {
      for (const opt of getOptions(object)) {
        if (deps.some((i) => opt.id.startsWith(i)))
          opt.connect("changed", callback);
      }
    }
  });
}

class Opt extends Variable2 {
  static {
    Service.register(this);
  }
  constructor(initial, { persistent = false } = {}) {
    super(initial);
    this.initial = initial;
    this.persistent = persistent;
  }
  initial;
  id = "";
  persistent;
  toString() {
    return `${this.value}`;
  }
  toJSON() {
    return `opt:${this.value}`;
  }
  getValue = () => {
    return super.getValue();
  };
  init(cacheFile) {
    const cacheV = JSON.parse(Utils.readFile(cacheFile) || "{}")[this.id];
    if (cacheV !== undefined)
      this.value = cacheV;
    this.connect("changed", () => {
      const cache = JSON.parse(Utils.readFile(cacheFile) || "{}");
      cache[this.id] = this.value;
      Utils.writeFileSync(JSON.stringify(cache, null, 2), cacheFile);
    });
  }
  reset() {
    if (this.persistent)
      return;
    if (JSON.stringify(this.value) !== JSON.stringify(this.initial)) {
      this.value = this.initial;
      return this.id;
    }
  }
}
var opt = (initial, opts) => new Opt(initial, opts);

// lib/variables.ts
import GLib3 from "gi://GLib";
var clock = Variable(GLib3.DateTime.new_now_local(), {
  poll: [1000, () => GLib3.DateTime.new_now_local()]
});
var uptime = Variable(0, {
  poll: [
    60000,
    "cat /proc/uptime",
    (line) => Number.parseInt(line.split(".")[0]) / 60
  ]
});
var distro = {
  id: GLib3.get_os_info("ID"),
  logo: GLib3.get_os_info("LOGO")
};

// lib/icons.ts
var substitutes = {
  "transmission-gtk": "transmission",
  "blueberry.py": "blueberry",
  Caprine: "facebook-messenger",
  "com.raggesilver.BlackBox-symbolic": "terminal-symbolic",
  "org.wezfurlong.wezterm-symbolic": "terminal-symbolic",
  "audio-headset-bluetooth": "audio-headphones-symbolic",
  "audio-card-analog-usb": "audio-speakers-symbolic",
  "audio-card-analog-pci": "audio-card-symbolic",
  "preferences-system": "emblem-system-symbolic",
  "com.github.Aylur.ags-symbolic": "controls-symbolic",
  "com.github.Aylur.ags": "controls-symbolic"
};
var icons_default = {
  missing: "image-missing-symbolic",
  nix: {
    nix: "nix-snowflake-symbolic"
  },
  app: {
    terminal: "terminal-symbolic"
  },
  fallback: {
    executable: "application-x-executable",
    notification: "dialog-information-symbolic",
    video: "video-x-generic-symbolic",
    audio: "audio-x-generic-symbolic"
  },
  ui: {
    close: "window-close-symbolic",
    colorpicker: "color-select-symbolic",
    info: "info-symbolic",
    link: "external-link-symbolic",
    lock: "system-lock-screen-symbolic",
    menu: "open-menu-symbolic",
    refresh: "view-refresh-symbolic",
    search: "system-search-symbolic",
    settings: "emblem-system-symbolic",
    themes: "preferences-desktop-theme-symbolic",
    tick: "object-select-symbolic",
    time: "hourglass-symbolic",
    toolbars: "toolbars-symbolic",
    warning: "dialog-warning-symbolic",
    avatar: "avatar-default-symbolic",
    arrow: {
      right: "pan-end-symbolic",
      left: "pan-start-symbolic",
      down: "pan-down-symbolic",
      up: "pan-up-symbolic"
    }
  },
  audio: {
    mic: {
      muted: "microphone-disabled-symbolic",
      low: "microphone-sensitivity-low-symbolic",
      medium: "microphone-sensitivity-medium-symbolic",
      high: "microphone-sensitivity-high-symbolic"
    },
    volume: {
      muted: "audio-volume-muted-symbolic",
      low: "audio-volume-low-symbolic",
      medium: "audio-volume-medium-symbolic",
      high: "audio-volume-high-symbolic",
      overamplified: "audio-volume-overamplified-symbolic"
    },
    type: {
      headset: "audio-headphones-symbolic",
      speaker: "audio-speakers-symbolic",
      card: "audio-card-symbolic"
    },
    mixer: "mixer-symbolic"
  },
  powerprofile: {
    balanced: "power-profile-balanced-symbolic",
    "power-saver": "power-profile-power-saver-symbolic",
    performance: "power-profile-performance-symbolic"
  },
  asusctl: {
    profile: {
      Balanced: "power-profile-balanced-symbolic",
      Quiet: "power-profile-power-saver-symbolic",
      Performance: "power-profile-performance-symbolic"
    },
    mode: {
      Integrated: "processor-symbolic",
      Hybrid: "controller-symbolic"
    }
  },
  battery: {
    charging: "battery-flash-symbolic",
    warning: "battery-empty-symbolic"
  },
  bluetooth: {
    enabled: "bluetooth-active-symbolic",
    disabled: "bluetooth-disabled-symbolic"
  },
  brightness: {
    indicator: "display-brightness-symbolic",
    keyboard: "keyboard-brightness-symbolic",
    screen: "display-brightness-symbolic"
  },
  powermenu: {
    sleep: "weather-clear-night-symbolic",
    reboot: "system-reboot-symbolic",
    logout: "system-log-out-symbolic",
    shutdown: "system-shutdown-symbolic"
  },
  recorder: {
    recording: "media-record-symbolic"
  },
  notifications: {
    noisy: "org.gnome.Settings-notifications-symbolic",
    silent: "notifications-disabled-symbolic",
    message: "chat-bubbles-symbolic"
  },
  trash: {
    full: "user-trash-full-symbolic",
    empty: "user-trash-symbolic"
  },
  mpris: {
    shuffle: {
      enabled: "media-playlist-shuffle-symbolic",
      disabled: "media-playlist-consecutive-symbolic"
    },
    loop: {
      none: "media-playlist-repeat-symbolic",
      track: "media-playlist-repeat-song-symbolic",
      playlist: "media-playlist-repeat-symbolic"
    },
    playing: "media-playback-pause-symbolic",
    paused: "media-playback-start-symbolic",
    stopped: "media-playback-start-symbolic",
    prev: "media-skip-backward-symbolic",
    next: "media-skip-forward-symbolic"
  },
  system: {
    cpu: "org.gnome.SystemMonitor-symbolic",
    ram: "drive-harddisk-solidstate-symbolic",
    temp: "temperature-symbolic"
  },
  color: {
    dark: "dark-mode-symbolic",
    light: "light-mode-symbolic"
  }
};

// lib/utils.ts
import Gdk2 from "gi://Gdk";
import GLib4 from "gi://GLib?version=2.0";
function icon(name, fallback = icons_default.missing) {
  if (!name)
    return fallback || "";
  if (GLib4.file_test(name, GLib4.FileTest.EXISTS))
    return name;
  const icon2 = substitutes[name] || name;
  if (Utils.lookUpIcon(icon2))
    return icon2;
  print(`no icon substitute "${icon2}" for "${name}", fallback: "${fallback}"`);
  return fallback;
}
async function bash(strings, ...values) {
  const cmd = typeof strings === "string" ? strings : strings.flatMap((str, i) => str + `${values[i] ?? ""}`).join("");
  return Utils.execAsync(["bash", "-c", cmd]).catch((err) => {
    console.error(cmd, err);
    return "";
  });
}
async function sh(cmd) {
  return Utils.execAsync(cmd).catch((err) => {
    console.error(typeof cmd === "string" ? cmd : cmd.join(" "), err);
    return "";
  });
}
function forMonitors(widget) {
  const n = Gdk2.Display.get_default()?.get_n_monitors() || 1;
  return range(n, 0).flatMap(widget);
}
function range(length, start = 1) {
  return Array.from({ length }, (_, i) => i + start);
}
function dependencies(...bins) {
  const missing = bins.filter((bin) => Utils.exec({
    cmd: `which ${bin}`,
    out: () => false,
    err: () => true
  }));
  if (missing.length > 0) {
    console.warn(Error(`missing dependencies: ${missing.join(", ")}`));
    Utils.notify(`missing dependencies: ${missing.join(", ")}`);
  }
  return missing.length === 0;
}
function launchApp(app) {
  const exe = app.executable.split(/\s+/).filter((str) => !str.startsWith("%") && !str.startsWith("@")).join(" ");
  bash(`${exe} &`);
  app.frequency += 1;
}
function createSurfaceFromWidget(widget) {
  const cairo = imports.gi.cairo;
  const alloc = widget.get_allocation();
  const surface = new cairo.ImageSurface(cairo.Format.ARGB32, alloc.width, alloc.height);
  const cr = new cairo.Context(surface);
  cr.setSourceRGBA(255, 255, 255, 0);
  cr.rectangle(0, 0, alloc.width, alloc.height);
  cr.fill();
  widget.draw(cr);
  return surface;
}

// options.ts
var options = mkOptions(OPTIONS, {
  autotheme: opt(false),
  wallpaper: {
    resolution: opt(1920),
    market: opt("random")
  },
  theme: {
    dark: {
      primary: {
        bg: opt("#51a4e7"),
        fg: opt("#141414")
      },
      error: {
        bg: opt("#e55f86"),
        fg: opt("#141414")
      },
      bg: opt("#171717"),
      fg: opt("#eeeeee"),
      widget: opt("#eeeeee"),
      border: opt("#eeeeee")
    },
    light: {
      primary: {
        bg: opt("#426ede"),
        fg: opt("#eeeeee")
      },
      error: {
        bg: opt("#b13558"),
        fg: opt("#eeeeee")
      },
      bg: opt("#fffffa"),
      fg: opt("#080808"),
      widget: opt("#080808"),
      border: opt("#080808")
    },
    blur: opt(0),
    scheme: opt("dark"),
    widget: { opacity: opt(94) },
    border: {
      width: opt(1),
      opacity: opt(96)
    },
    shadows: opt(true),
    padding: opt(7),
    spacing: opt(12),
    radius: opt(11)
  },
  transition: opt(200),
  font: {
    size: opt(13),
    name: opt("Ubuntu Nerd Font")
  },
  bar: {
    flatButtons: opt(true),
    position: opt("top"),
    corners: opt(50),
    transparent: opt(false),
    layout: {
      start: opt([
        "launcher",
        "workspaces",
        "taskbar",
        "expander",
        "messages"
      ]),
      center: opt([
        "date"
      ]),
      end: opt([
        "media",
        "expander",
        "systray",
        "colorpicker",
        "screenrecord",
        "system",
        "battery",
        "powermenu"
      ])
    },
    launcher: {
      icon: {
        colored: opt(true),
        icon: opt(icon(distro.logo, icons_default.ui.search))
      },
      label: {
        colored: opt(false),
        label: opt(" Applications")
      },
      action: opt(() => App.toggleWindow("launcher"))
    },
    date: {
      format: opt("%c"),
      action: opt(() => App.toggleWindow("datemenu"))
    },
    battery: {
      bar: opt("regular"),
      charging: opt("#00D787"),
      percentage: opt(true),
      blocks: opt(7),
      width: opt(50),
      low: opt(30)
    },
    workspaces: {
      workspaces: opt(7)
    },
    taskbar: {
      iconSize: opt(0),
      monochrome: opt(true),
      exclusive: opt(false)
    },
    messages: {
      action: opt(() => App.toggleWindow("datemenu"))
    },
    systray: {
      ignore: opt([
        "KDE Connect Indicator"
      ])
    },
    media: {
      monochrome: opt(true),
      preferred: opt(""),
      direction: opt("right"),
      format: opt("{artists} - {title}"),
      length: opt(40)
    },
    powermenu: {
      monochrome: opt(false),
      action: opt(() => App.toggleWindow("powermenu"))
    }
  },
  launcher: {
    width: opt(0),
    margin: opt(80),
    nix: {
      pkgs: opt("nixpkgs/nixos-unstable"),
      max: opt(8)
    },
    sh: {
      max: opt(16)
    },
    apps: {
      iconSize: opt(62),
      max: opt(6),
      favorites: opt([
        [
          "firefox",
          "wezterm",
          "org.gnome.Nautilus",
          "org.gnome.Calendar"
        ]
      ])
    }
  },
  overview: {
    scale: opt(9),
    workspaces: opt(7),
    monochromeIcon: opt(true)
  },
  powermenu: {
    sleep: opt("systemctl suspend"),
    reboot: opt("systemctl reboot"),
    logout: opt("pkill Hyprland"),
    shutdown: opt("shutdown now"),
    layout: opt("line"),
    labels: opt(true)
  },
  quicksettings: {
    avatar: {
      image: opt(`/var/lib/AccountsService/icons/${Utils.USER}`),
      size: opt(70)
    },
    width: opt(380),
    position: opt("right"),
    networkSettings: opt("gtk-launch gnome-control-center"),
    media: {
      monochromeIcon: opt(true),
      coverSize: opt(100)
    }
  },
  datemenu: {
    position: opt("center"),
    weather: {
      interval: opt(60000),
      unit: opt("metric"),
      key: opt(JSON.parse(Utils.readFile(`${App.configDir}/.weather`) || "{}")?.key || ""),
      cities: opt(JSON.parse(Utils.readFile(`${App.configDir}/.weather`) || "{}")?.cities || [])
    }
  },
  osd: {
    progress: {
      vertical: opt(true),
      pack: {
        h: opt("end"),
        v: opt("center")
      }
    },
    microphone: {
      pack: {
        h: opt("center"),
        v: opt("end")
      }
    }
  },
  notifications: {
    position: opt(["top", "right"]),
    blacklist: opt([]),
    width: opt(440)
  },
  hyprland: {
    gaps: opt(2.4),
    inactiveBorder: opt("#282828"),
    gapsWhenOnly: opt(false)
  }
});
globalThis["options"] = options;
var options_default = options;

// style/style.ts
async function resetCss() {
  if (!dependencies("sass", "fd"))
    return;
  try {
    const vars = `${TMP}/variables.scss`;
    const scss = `${TMP}/main.scss`;
    const css = `${TMP}/main.css`;
    const fd = await bash(`fd ".scss" ${App.configDir}`);
    const files = fd.split(/\s+/);
    const imports2 = [vars, ...files].map((f) => `@import '${f}';`);
    await Utils.writeFile(variables2().join("\n"), vars);
    await Utils.writeFile(imports2.join("\n"), scss);
    await bash`sass ${scss} ${css}`;
    App.applyCss(css, true);
  } catch (error) {
    error instanceof Error ? logError(error) : console.error(error);
  }
}
var deps = [
  "font",
  "theme",
  "bar.corners",
  "bar.flatButtons",
  "bar.position",
  "bar.battery.charging",
  "bar.battery.blocks"
];
var {
  dark,
  light,
  blur,
  scheme,
  padding,
  spacing,
  radius,
  shadows,
  widget,
  border
} = options_default.theme;
var popoverPaddingMultiplier = 1.6;
var t = (dark2, light2) => scheme.value === "dark" ? `${dark2}` : `${light2}`;
var $ = (name, value) => `\$${name}: ${value};`;
var variables2 = () => [
  $("bg", blur.value ? `transparentize(${t(dark.bg, light.bg)}, ${blur.value / 100})` : t(dark.bg, light.bg)),
  $("fg", t(dark.fg, light.fg)),
  $("primary-bg", t(dark.primary.bg, light.primary.bg)),
  $("primary-fg", t(dark.primary.fg, light.primary.fg)),
  $("error-bg", t(dark.error.bg, light.error.bg)),
  $("error-fg", t(dark.error.fg, light.error.fg)),
  $("scheme", scheme),
  $("padding", `${padding}pt`),
  $("spacing", `${spacing}pt`),
  $("radius", `${radius}px`),
  $("transition", `${options_default.transition}ms`),
  $("shadows", `${shadows}`),
  $("widget-bg", `transparentize(${t(dark.widget, light.widget)}, ${widget.opacity.value / 100})`),
  $("hover-bg", `transparentize(${t(dark.widget, light.widget)}, ${widget.opacity.value * 0.9 / 100})`),
  $("hover-fg", `lighten(${t(dark.fg, light.fg)}, 8%)`),
  $("border-width", `${border.width}px`),
  $("border-color", `transparentize(${t(dark.border, light.border)}, ${border.opacity.value / 100})`),
  $("border", "$border-width solid $border-color"),
  $("active-gradient", `linear-gradient(to right, ${t(dark.primary.bg, light.primary.bg)}, darken(${t(dark.primary.bg, light.primary.bg)}, 4%))`),
  $("shadow-color", t("rgba(0,0,0,.6)", "rgba(0,0,0,.4)")),
  $("text-shadow", t("2pt 2pt 2pt $shadow-color", "none")),
  $("box-shadow", t("2pt 2pt 2pt 0 $shadow-color, inset 0 0 0 $border-width $border-color", "none")),
  $("popover-border-color", `transparentize(${t(dark.border, light.border)}, ${Math.max((border.opacity.value - 1) / 100, 0)})`),
  $("popover-padding", `\$padding * ${popoverPaddingMultiplier}`),
  $("popover-radius", radius.value === 0 ? "0" : "$radius + $popover-padding"),
  $("font-size", `${options_default.font.size}pt`),
  $("font-name", options_default.font.name),
  $("charging-bg", options_default.bar.battery.charging),
  $("bar-battery-blocks", options_default.bar.battery.blocks),
  $("bar-position", options_default.bar.position),
  $("hyprland-gaps-multiplier", options_default.hyprland.gaps),
  $("screen-corner-multiplier", `${options_default.bar.corners.value * 0.01}`)
];
Utils.monitorFile(`${App.configDir}/style`, resetCss);
options_default.handler(deps, resetCss);
await resetCss();

// service/wallpaper.ts
var WP = `${Utils.HOME}/.config/background`;
var Cache = `${Utils.HOME}/Pictures/Wallpapers/Bing`;

class Wallpaper extends Service {
  static {
    Service.register(this, {}, {
      wallpaper: ["string"]
    });
  }
  #blockMonitor = false;
  #wallpaper() {
    if (!dependencies("swww"))
      return;
    sh("hyprctl cursorpos").then((pos) => {
      sh([
        "swww",
        "img",
        "--invert-y",
        "--transition-type",
        "grow",
        "--transition-pos",
        pos.replace(" ", ""),
        WP
      ]).then(() => {
        this.changed("wallpaper");
      });
    });
  }
  async#setWallpaper(path) {
    this.#blockMonitor = true;
    await sh(`cp ${path} ${WP}`);
    this.#wallpaper();
    this.#blockMonitor = false;
  }
  async#fetchBing() {
    const res = await Utils.fetch("https://bing.biturl.top/", {
      params: {
        resolution: options_default.wallpaper.resolution.value,
        format: "json",
        image_format: "jpg",
        index: "random",
        mkt: options_default.wallpaper.market.value
      }
    }).then((res2) => res2.text());
    if (!res.startsWith("{"))
      return console.warn("bing api", res);
    const { url } = JSON.parse(res);
    const file = `${Cache}/${url.replace("https://www.bing.com/th?id=", "")}`;
    if (dependencies("curl")) {
      Utils.ensureDirectory(Cache);
      await sh(`curl "${url}" --output ${file}`);
      this.#setWallpaper(file);
    }
  }
  random = () => {
    this.#fetchBing();
  };
  set = (path) => {
    this.#setWallpaper(path);
  };
  get wallpaper() {
    return WP;
  }
  constructor() {
    super();
    if (!dependencies("swww"))
      return this;
    Utils.monitorFile(WP, () => {
      if (!this.#blockMonitor)
        this.#wallpaper();
    });
    Utils.execAsync("swww-daemon").then(this.#wallpaper).catch(() => null);
  }
}
var wallpaper_default = new Wallpaper;

// lib/matugen.ts
function animate(...setters) {
  const delay = options_default.transition.value / 2;
  setters.forEach((fn, i) => Utils.timeout(delay * i, fn));
}
async function matugen(type = "image", arg = wallpaper_default.wallpaper) {
  if (!options_default.autotheme.value || !dependencies("matugen"))
    return;
  const colors = await sh(`matugen --dry-run -j hex ${type} ${arg}`);
  const c = JSON.parse(colors).colors;
  const { dark: dark2, light: light2 } = options_default.theme;
  animate(() => {
    dark2.widget.value = c.dark.on_surface;
    light2.widget.value = c.light.on_surface;
  }, () => {
    dark2.border.value = c.dark.outline;
    light2.border.value = c.light.outline;
  }, () => {
    dark2.bg.value = c.dark.surface;
    light2.bg.value = c.light.surface;
  }, () => {
    dark2.fg.value = c.dark.on_surface;
    light2.fg.value = c.light.on_surface;
  }, () => {
    dark2.primary.bg.value = c.dark.primary;
    light2.primary.bg.value = c.light.primary;
    options_default.bar.battery.charging.value = options_default.theme.scheme.value === "dark" ? c.dark.primary : c.light.primary;
  }, () => {
    dark2.primary.fg.value = c.dark.on_primary;
    light2.primary.fg.value = c.light.on_primary;
  }, () => {
    dark2.error.bg.value = c.dark.error;
    light2.error.bg.value = c.light.error;
  }, () => {
    dark2.error.fg.value = c.dark.on_error;
    light2.error.fg.value = c.light.on_error;
  });
}
function init() {
  wallpaper_default.connect("changed", () => matugen());
  options_default.autotheme.connect("changed", () => matugen());
}

// lib/hyprland.ts
function primary() {
  return scheme2.value === "dark" ? darkActive.value : lightActive.value;
}
function rgba(color) {
  return `rgba(${color}ff)`.replace("#", "");
}
function sendBatch(batch) {
  const cmd = batch.filter((x) => !!x).map((x) => `keyword ${x}`).join("; ");
  return messageAsync(`[[BATCH]]/${cmd}`);
}
async function setupHyprland() {
  const wm_gaps = Math.floor(hyprland.gaps.value * spacing2.value);
  sendBatch([
    `general:border_size ${width}`,
    `general:gaps_out ${wm_gaps}`,
    `general:gaps_in ${Math.floor(wm_gaps / 2)}`,
    `general:col.active_border ${rgba(primary())}`,
    `general:col.inactive_border ${rgba(hyprland.inactiveBorder.value)}`,
    `decoration:rounding ${radius2}`,
    `decoration:drop_shadow ${shadows2.value ? "yes" : "no"}`,
    `dwindle:no_gaps_when_only ${hyprland.gapsWhenOnly.value ? 0 : 1}`,
    `master:no_gaps_when_only ${hyprland.gapsWhenOnly.value ? 0 : 1}`
  ]);
  await sendBatch(App.windows.map(({ name }) => `layerrule unset, ${name}`));
  if (blur2.value > 0) {
    sendBatch(App.windows.flatMap(({ name }) => [
      `layerrule unset, ${name}`,
      `layerrule blur, ${name}`,
      `layerrule ignorealpha ${0.29}, ${name}`
    ]));
  }
}
var { messageAsync } = await Service.import("hyprland");
var {
  hyprland,
  theme: {
    spacing: spacing2,
    radius: radius2,
    border: { width },
    blur: blur2,
    shadows: shadows2,
    dark: {
      primary: { bg: darkActive }
    },
    light: {
      primary: { bg: lightActive }
    },
    scheme: scheme2
  }
} = options_default;
var deps2 = [
  "hyprland",
  spacing2.id,
  radius2.id,
  blur2.id,
  width.id,
  shadows2.id,
  darkActive.id,
  lightActive.id,
  scheme2.id
];
function init2() {
  options_default.handler(deps2, setupHyprland);
  setupHyprland();
}

// lib/tmux.ts
async function tmux() {
  const { scheme: scheme3, dark: dark2, light: light2 } = options_default.theme;
  const hex = scheme3.value === "dark" ? dark2.primary.bg.value : light2.primary.bg.value;
  if (await sh("which tmux").catch(() => false))
    sh(`tmux set @main_accent "${hex}"`);
}
function init3() {
  options_default.theme.dark.primary.bg.connect("changed", tmux);
  options_default.theme.light.primary.bg.connect("changed", tmux);
}

// lib/gtk.ts
import Gio2 from "gi://Gio";
function gtk() {
  const scheme3 = options_default.theme.scheme.value;
  settings.set_string("color-scheme", `prefer-${scheme3}`);
}
var settings = new Gio2.Settings({
  schema: "org.gnome.desktop.interface"
});
function init4() {
  options_default.theme.scheme.connect("changed", gtk);
  gtk();
}

// lib/battery.ts
async function init5() {
  const bat = await Service.import("battery");
  bat.connect("notify::percent", ({ percent, charging }) => {
    const low = 30;
    if (percent !== low || percent !== low / 2 || !charging)
      return;
    Utils.notify({
      summary: `${percent}% Battery Percentage`,
      iconName: icons_default.battery.warning,
      urgency: "critical"
    });
  });
}

// lib/notifications.ts
var notifs = await Service.import("notifications");
var { blacklist } = options_default.notifications;
function init6() {
  const notify = notifs.constructor.prototype.Notify.bind(notifs);
  notifs.constructor.prototype.Notify = function(appName, ...rest) {
    if (blacklist.value.includes(appName))
      return Number.MAX_SAFE_INTEGER;
    return notify(appName, ...rest);
  };
}

// lib/init.ts
function init7() {
  try {
    init4();
    init3();
    init();
    init5();
    init6();
    init2();
  } catch (error) {
    logError(error);
  }
}

// widget/bar/PanelButton.ts
var PanelButton_default = ({
  window = "",
  flat,
  child,
  setup,
  ...rest
}) => Widget.Button({
  child: Widget.Box({ child }),
  setup: (self) => {
    let open = false;
    self.toggleClassName("panel-button");
    self.toggleClassName(window);
    self.hook(options_default.bar.flatButtons, () => {
      self.toggleClassName("flat", flat ?? options_default.bar.flatButtons.value);
    });
    self.hook(App, (_, win, visible) => {
      if (win !== window)
        return;
      if (open && !visible) {
        open = false;
        self.toggleClassName("active", false);
      }
      if (visible) {
        open = true;
        self.toggleClassName("active");
      }
    });
    if (setup)
      setup(self);
  },
  ...rest
});

// widget/bar/buttons/BatteryBar.ts
var battery2 = await Service.import("battery");
var { bar, percentage, blocks, width: width2, low } = options_default.bar.battery;
var Indicator = () => Widget.Icon({
  setup: (self) => self.hook(battery2, () => {
    self.icon = battery2.charging || battery2.charged ? icons_default.battery.charging : battery2.icon_name;
  })
});
var PercentLabel = () => Widget.Revealer({
  transition: "slide_right",
  click_through: true,
  reveal_child: percentage.bind(),
  child: Widget.Label({
    label: battery2.bind("percent").as((p) => `${p}%`)
  })
});
var LevelBar = () => {
  const level = Widget.LevelBar({
    bar_mode: "discrete",
    max_value: blocks.bind(),
    visible: bar.bind().as((b) => b !== "hidden"),
    value: battery2.bind("percent").as((p) => p / 100 * blocks.value)
  });
  const update = () => {
    level.value = battery2.percent / 100 * blocks.value;
    level.css = `block { min-width: ${width2.value / blocks.value}pt; }`;
  };
  return level.hook(width2, update).hook(blocks, update).hook(bar, () => {
    level.vpack = bar.value === "whole" ? "fill" : "center";
    level.hpack = bar.value === "whole" ? "fill" : "center";
  });
};
var WholeButton = () => Widget.Overlay({
  vexpand: true,
  child: LevelBar(),
  class_name: "whole",
  pass_through: true,
  overlay: Widget.Box({
    hpack: "center",
    children: [
      Widget.Icon({
        icon: icons_default.battery.charging,
        visible: Utils.merge([
          battery2.bind("charging"),
          battery2.bind("charged")
        ], (ing, ed) => ing || ed)
      }),
      Widget.Box({
        hpack: "center",
        vpack: "center",
        child: PercentLabel()
      })
    ]
  })
});
var Regular = () => Widget.Box({
  class_name: "regular",
  children: [
    Indicator(),
    PercentLabel(),
    LevelBar()
  ]
});
var BatteryBar_default = () => PanelButton_default({
  class_name: "battery-bar",
  hexpand: false,
  on_clicked: () => {
    percentage.value = !percentage.value;
  },
  visible: battery2.bind("available"),
  child: Widget.Box({
    expand: true,
    visible: battery2.bind("available"),
    child: bar.bind().as((b) => b === "whole" ? WholeButton() : Regular())
  }),
  setup: (self) => self.hook(bar, (w) => w.toggleClassName("bar-hidden", bar.value === "hidden")).hook(battery2, (w) => {
    w.toggleClassName("charging", battery2.charging || battery2.charged);
    w.toggleClassName("low", battery2.percent < low.value);
  })
});

// service/colorpicker.ts
var COLORS_CACHE = Utils.CACHE_DIR + "/colorpicker.json";
var MAX_NUM_COLORS = 10;

class ColorPicker extends Service {
  static {
    Service.register(this, {}, {
      colors: ["jsobject"]
    });
  }
  #notifID = 0;
  #colors = JSON.parse(Utils.readFile(COLORS_CACHE) || "[]");
  get colors() {
    return [...this.#colors];
  }
  set colors(colors) {
    this.#colors = colors;
    this.changed("colors");
  }
  async wlCopy(color) {
    if (dependencies("wl-copy"))
      bash(`wl-copy ${color}`);
  }
  pick = async () => {
    if (!dependencies("hyprpicker"))
      return;
    const color = await bash("hyprpicker -a -r");
    if (!color)
      return;
    this.wlCopy(color);
    const list = this.colors;
    if (!list.includes(color)) {
      list.push(color);
      if (list.length > MAX_NUM_COLORS)
        list.shift();
      this.colors = list;
      Utils.writeFile(JSON.stringify(list, null, 2), COLORS_CACHE);
    }
    this.#notifID = await Utils.notify({
      id: this.#notifID,
      iconName: icons_default.ui.colorpicker,
      summary: color
    });
  };
}
var colorpicker_default = new ColorPicker;

// widget/bar/buttons/ColorPicker.ts
import Gdk4 from "gi://Gdk";
var css = (color) => `
* {
    background-color: ${color};
    color: transparent;
}
*:hover {
    color: white;
    text-shadow: 2px 2px 3px rgba(0,0,0,.8);
}`;
var ColorPicker_default = () => {
  const menu = Widget.Menu({
    class_name: "colorpicker",
    children: colorpicker_default.bind("colors").as((c) => c.map((color) => Widget.MenuItem({
      child: Widget.Label(color),
      css: css(color),
      on_activate: () => colorpicker_default.wlCopy(color)
    })))
  });
  return PanelButton_default({
    class_name: "color-picker",
    child: Widget.Icon("color-select-symbolic"),
    tooltip_text: colorpicker_default.bind("colors").as((v) => `${v.length} colors`),
    on_clicked: colorpicker_default.pick,
    on_secondary_click: (self) => {
      if (colorpicker_default.colors.length === 0)
        return;
      menu.popup_at_widget(self, Gdk4.Gravity.SOUTH, Gdk4.Gravity.NORTH, null);
    }
  });
};

// widget/bar/buttons/Date.ts
var { format, action } = options_default.bar.date;
var time = Utils.derive([clock, format], (c, f) => c.format(f) || "");
var Date_default = () => PanelButton_default({
  window: "datemenu",
  on_clicked: action.bind(),
  child: Widget.Label({
    justification: "center",
    label: time.bind()
  })
});

// service/nix.ts
var CACHE = `${Utils.CACHE_DIR}/nixpkgs`;
var PREFIX = "legacyPackages.x86_64-linux.";
var MAX = options_default.launcher.nix.max;
var nixpkgs = options_default.launcher.nix.pkgs;

class Nix extends Service {
  static {
    Service.register(this, {}, {
      available: ["boolean", "r"],
      ready: ["boolean", "rw"]
    });
  }
  #db = {};
  #ready = true;
  set ready(r) {
    this.#ready = r;
    this.changed("ready");
  }
  get db() {
    return this.#db;
  }
  get ready() {
    return this.#ready;
  }
  get available() {
    return Utils.exec("which nix", () => true, () => false);
  }
  constructor() {
    super();
    if (!this.available)
      return this;
    this.#updateList();
    nixpkgs.connect("changed", this.#updateList);
  }
  query = async (filter) => {
    if (!dependencies("fzf", "nix") || !this.#ready)
      return [];
    return bash(`cat ${CACHE} | fzf -f ${filter} -e | head -n ${MAX} `).then((str) => str.split("\n").filter((i) => i));
  };
  nix(cmd, bin, args) {
    return Utils.execAsync(`nix ${cmd} ${nixpkgs}#${bin} --impure ${args}`);
  }
  run = async (input) => {
    if (!dependencies("nix"))
      return;
    try {
      const [bin, ...args] = input.trim().split(/\s+/);
      this.ready = false;
      await this.nix("shell", bin, "--command sh -c 'exit'");
      this.ready = true;
      this.nix("run", bin, ["--", ...args].join(" "));
    } catch (err) {
      if (typeof err === "string")
        Utils.notify("NixRun Error", err, icons_default.nix.nix);
      else
        logError(err);
    } finally {
      this.ready = true;
    }
  };
  #updateList = async () => {
    if (!dependencies("nix"))
      return;
    this.ready = false;
    this.#db = {};
    const search = await bash(`nix search ${nixpkgs} --json`);
    if (!search) {
      this.ready = true;
      return;
    }
    const json = Object.entries(JSON.parse(search));
    for (const [pkg, info] of json) {
      const name = pkg.replace(PREFIX, "");
      this.#db[name] = { ...info, name };
    }
    const list = Object.keys(this.#db).join("\n");
    await Utils.writeFile(list, CACHE);
    this.ready = true;
  };
}
var nix_default = new Nix;

// widget/bar/buttons/Launcher.ts
function Spinner() {
  const child = Widget.Icon({
    icon: icon2.icon.bind(),
    class_name: Utils.merge([
      icon2.colored.bind(),
      nix_default.bind("ready")
    ], (c, r) => `${c ? "colored" : ""} ${r ? "" : "spinning"}`),
    css: `
            @keyframes spin {
                to { -gtk-icon-transform: rotate(1turn); }
            }

            image.spinning {
                animation-name: spin;
                animation-duration: 1s;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
            }
        `
  });
  return Widget.Revealer({
    transition: "slide_left",
    child,
    reveal_child: Utils.merge([
      icon2.icon.bind(),
      nix_default.bind("ready")
    ], (i, r) => Boolean(i || r))
  });
}
var { icon: icon2, label, action: action2 } = options_default.bar.launcher;
var Launcher_default = () => PanelButton_default({
  window: "launcher",
  on_clicked: action2.bind(),
  child: Widget.Box([
    Spinner(),
    Widget.Label({
      class_name: label.colored.bind().as((c) => c ? "colored" : ""),
      visible: label.label.bind().as((v) => !!v),
      label: label.label.bind()
    })
  ])
});

// widget/bar/buttons/Media.ts
var mpris = await Service.import("mpris");
var { length, direction, preferred, monochrome, format: format2 } = options_default.bar.media;
var getPlayer = (name = preferred.value) => mpris.getPlayer(name) || mpris.players[0] || null;
var Content = (player) => {
  const revealer = Widget.Revealer({
    click_through: true,
    visible: length.bind().as((l) => l > 0),
    transition: direction.bind().as((d) => `slide_${d}`),
    setup: (self) => {
      let current = "";
      self.hook(player, () => {
        if (current === player.track_title)
          return;
        current = player.track_title;
        self.reveal_child = true;
        Utils.timeout(3000, () => {
          !self.is_destroyed && (self.reveal_child = false);
        });
      });
    },
    child: Widget.Label({
      truncate: "end",
      max_width_chars: length.bind().as((n) => n > 0 ? n : -1),
      label: Utils.merge([
        player.bind("track_title"),
        player.bind("track_artists"),
        format2.bind()
      ], () => `${format2}`.replace("{title}", player.track_title).replace("{artists}", player.track_artists.join(", ")).replace("{artist}", player.track_artists[0] || "").replace("{album}", player.track_album).replace("{name}", player.name).replace("{identity}", player.identity))
    })
  });
  const playericon = Widget.Icon({
    icon: Utils.merge([player.bind("entry"), monochrome.bind()], (entry) => {
      const name = `${entry}${monochrome.value ? "-symbolic" : ""}`;
      return icon(name, icons_default.fallback.audio);
    })
  });
  return Widget.Box({
    attribute: { revealer },
    children: direction.bind().as((d) => d === "right" ? [playericon, revealer] : [revealer, playericon])
  });
};
var Media_default = () => {
  let player = getPlayer();
  const btn = PanelButton_default({
    class_name: "media",
    child: Widget.Icon(icons_default.fallback.audio)
  });
  const update = () => {
    player = getPlayer();
    btn.visible = !!player;
    if (!player)
      return;
    const content = Content(player);
    const { revealer } = content.attribute;
    btn.child = content;
    btn.on_primary_click = () => {
      player.playPause();
    };
    btn.on_secondary_click = () => {
      player.playPause();
    };
    btn.on_scroll_up = () => {
      player.next();
    };
    btn.on_scroll_down = () => {
      player.previous();
    };
    btn.on_hover = () => {
      revealer.reveal_child = true;
    };
    btn.on_hover_lost = () => {
      revealer.reveal_child = false;
    };
  };
  return btn.hook(preferred, update).hook(mpris, update, "notify::players");
};

// widget/bar/buttons/PowerMenu.ts
var { monochrome: monochrome2, action: action3 } = options_default.bar.powermenu;
var PowerMenu_default = () => PanelButton_default({
  window: "powermenu",
  on_clicked: action3.bind(),
  child: Widget.Icon(icons_default.powermenu.shutdown),
  setup: (self) => self.hook(monochrome2, () => {
    self.toggleClassName("colored", !monochrome2.value);
    self.toggleClassName("box");
  })
});

// widget/bar/buttons/SysTray.ts
import Gdk6 from "gi://Gdk";
var systemtray = await Service.import("systemtray");
var { ignore } = options_default.bar.systray;
var SysTrayItem = (item) => PanelButton_default({
  class_name: "tray-item",
  child: Widget.Icon({ icon: item.bind("icon") }),
  tooltip_markup: item.bind("tooltip_markup"),
  setup: (self) => {
    const { menu } = item;
    if (!menu)
      return;
    const id = menu.connect("popped-up", () => {
      self.toggleClassName("active");
      menu.connect("notify::visible", () => {
        self.toggleClassName("active", menu.visible);
      });
      menu.disconnect(id);
    });
    self.connect("destroy", () => menu.disconnect(id));
  },
  on_primary_click: (btn) => item.menu?.popup_at_widget(btn, Gdk6.Gravity.SOUTH, Gdk6.Gravity.NORTH, null),
  on_secondary_click: (btn) => item.menu?.popup_at_widget(btn, Gdk6.Gravity.SOUTH, Gdk6.Gravity.NORTH, null)
});
var SysTray_default = () => Widget.Box().bind("children", systemtray, "items", (i) => i.filter(({ id }) => !ignore.value.includes(id)).map(SysTrayItem));

// service/asusctl.ts
class Asusctl extends Service {
  static {
    Service.register(this, {}, {
      profile: ["string", "r"],
      mode: ["string", "r"]
    });
  }
  get available() {
    return Utils.exec("which asusctl", () => true, () => false);
  }
  #profile = "Balanced";
  #mode = "Hybrid";
  async nextProfile() {
    await sh("asusctl profile -n");
    const profile = await sh("asusctl profile -p");
    const p = profile.split(" ")[3];
    this.#profile = p;
    this.changed("profile");
  }
  async setProfile(prof) {
    await sh(`asusctl profile --profile-set ${prof}`);
    this.#profile = prof;
    this.changed("profile");
  }
  async nextMode() {
    await sh(`supergfxctl -m ${this.#mode === "Hybrid" ? "Integrated" : "Hybrid"}`);
    this.#mode = await sh("supergfxctl -g");
    this.changed("profile");
  }
  constructor() {
    super();
    if (this.available) {
      sh("asusctl profile -p").then((p) => this.#profile = p.split(" ")[3]);
      sh("supergfxctl -g").then((m) => this.#mode = m);
    }
  }
  get profiles() {
    return ["Performance", "Balanced", "Quiet"];
  }
  get profile() {
    return this.#profile;
  }
  get mode() {
    return this.#mode;
  }
}
var asusctl_default = new Asusctl;

// widget/bar/buttons/SystemIndicators.ts
var notifications2 = await Service.import("notifications");
var bluetooth = await Service.import("bluetooth");
var audio = await Service.import("audio");
var network = await Service.import("network");
var powerprof = await Service.import("powerprofiles");
var ProfileIndicator = () => {
  const visible = asusctl_default.available ? asusctl_default.bind("profile").as((p) => p !== "Balanced") : powerprof.bind("active_profile").as((p) => p !== "balanced");
  const icon3 = asusctl_default.available ? asusctl_default.bind("profile").as((p) => icons_default.asusctl.profile[p]) : powerprof.bind("active_profile").as((p) => icons_default.powerprofile[p]);
  return Widget.Icon({ visible, icon: icon3 });
};
var ModeIndicator = () => {
  if (!asusctl_default.available) {
    return Widget.Icon({
      setup(self) {
        Utils.idle(() => self.visible = false);
      }
    });
  }
  return Widget.Icon({
    visible: asusctl_default.bind("mode").as((m) => m !== "Hybrid"),
    icon: asusctl_default.bind("mode").as((m) => icons_default.asusctl.mode[m])
  });
};
var MicrophoneIndicator = () => Widget.Icon().hook(audio, (self) => self.visible = audio.recorders.length > 0 || audio.microphone.is_muted || false).hook(audio.microphone, (self) => {
  const vol = audio.microphone.is_muted ? 0 : audio.microphone.volume;
  const { muted, low: low2, medium, high } = icons_default.audio.mic;
  const cons = [[67, high], [34, medium], [1, low2], [0, muted]];
  self.icon = cons.find(([n]) => n <= vol * 100)?.[1] || "";
});
var DNDIndicator = () => Widget.Icon({
  visible: notifications2.bind("dnd"),
  icon: icons_default.notifications.silent
});
var BluetoothIndicator = () => Widget.Overlay({
  class_name: "bluetooth",
  passThrough: true,
  visible: bluetooth.bind("enabled"),
  child: Widget.Icon({
    icon: icons_default.bluetooth.enabled
  }),
  overlay: Widget.Label({
    hpack: "end",
    vpack: "start",
    label: bluetooth.bind("connected_devices").as((c) => `${c.length}`),
    visible: bluetooth.bind("connected_devices").as((c) => c.length > 0)
  })
});
var NetworkIndicator = () => Widget.Icon().hook(network, (self) => {
  const icon3 = network[network.primary || "wifi"]?.icon_name;
  self.icon = icon3 || "";
  self.visible = !!icon3;
});
var AudioIndicator = () => Widget.Icon().hook(audio.speaker, (self) => {
  const vol = audio.speaker.is_muted ? 0 : audio.speaker.volume;
  const { muted, low: low2, medium, high, overamplified } = icons_default.audio.volume;
  const cons = [[101, overamplified], [67, high], [34, medium], [1, low2], [0, muted]];
  self.icon = cons.find(([n]) => n <= vol * 100)?.[1] || "";
});
var SystemIndicators_default = () => PanelButton_default({
  window: "quicksettings",
  on_clicked: () => App.toggleWindow("quicksettings"),
  on_scroll_up: () => audio.speaker.volume += 0.02,
  on_scroll_down: () => audio.speaker.volume -= 0.02,
  child: Widget.Box([
    ProfileIndicator(),
    ModeIndicator(),
    DNDIndicator(),
    BluetoothIndicator(),
    NetworkIndicator(),
    AudioIndicator(),
    MicrophoneIndicator()
  ])
});

// widget/bar/buttons/Taskbar.ts
function sortItems(arr) {
  return arr.sort(({ attribute: a }, { attribute: b }) => {
    const aclient = hyprland3.getClient(a.address);
    const bclient = hyprland3.getClient(b.address);
    return aclient.workspace.id - bclient.workspace.id;
  });
}
var hyprland3 = await Service.import("hyprland");
var apps = await Service.import("applications");
var { monochrome: monochrome3, exclusive, iconSize } = options_default.bar.taskbar;
var { position } = options_default.bar;
var focus = (address) => hyprland3.messageAsync(`dispatch focuswindow address:${address}`);
var DummyItem = (address) => Widget.Box({
  attribute: { address },
  visible: false
});
var AppItem = (address) => {
  const client = hyprland3.getClient(address);
  if (!client || client.class === "")
    return DummyItem(address);
  const app = apps.list.find((app2) => app2.match(client.class));
  const btn = PanelButton_default({
    class_name: "panel-button",
    tooltip_text: Utils.watch(client.title, hyprland3, () => hyprland3.getClient(address)?.title || ""),
    on_primary_click: () => focus(address),
    on_middle_click: () => app && launchApp(app),
    child: Widget.Icon({
      size: iconSize.bind(),
      icon: monochrome3.bind().as((m) => icon((app?.icon_name || client.class) + (m ? "-symbolic" : ""), icons_default.fallback.executable + (m ? "-symbolic" : "")))
    })
  });
  return Widget.Box({
    attribute: { address },
    visible: Utils.watch(true, [exclusive, hyprland3], () => {
      return exclusive.value ? hyprland3.active.workspace.id === client.workspace.id : true;
    })
  }, Widget.Overlay({
    child: btn,
    pass_through: true,
    overlay: Widget.Box({
      className: "indicator",
      hpack: "center",
      vpack: position.bind().as((p) => p === "top" ? "start" : "end"),
      setup: (w) => w.hook(hyprland3, () => {
        w.toggleClassName("active", hyprland3.active.client.address === address);
      })
    })
  }));
};
var Taskbar_default = () => Widget.Box({
  class_name: "taskbar",
  children: sortItems(hyprland3.clients.map((c) => AppItem(c.address))),
  setup: (w) => w.hook(hyprland3, (w2, address) => {
    if (typeof address === "string")
      w2.children = w2.children.filter((ch) => ch.attribute.address !== address);
  }, "client-removed").hook(hyprland3, (w2, address) => {
    if (typeof address === "string")
      w2.children = sortItems([...w2.children, AppItem(address)]);
  }, "client-added").hook(hyprland3, (w2, event) => {
    if (event === "movewindow")
      w2.children = sortItems(w2.children);
  }, "event")
});

// widget/bar/buttons/Workspaces.ts
var hyprland4 = await Service.import("hyprland");
var { workspaces } = options_default.bar.workspaces;
var dispatch = (arg) => {
  sh(`hyprctl dispatch workspace ${arg}`);
};
var Workspaces = (ws) => Widget.Box({
  children: range(ws || 20).map((i) => Widget.Label({
    attribute: i,
    vpack: "center",
    label: `${i}`,
    setup: (self) => self.hook(hyprland4, () => {
      self.toggleClassName("active", hyprland4.active.workspace.id === i);
      self.toggleClassName("occupied", (hyprland4.getWorkspace(i)?.windows || 0) > 0);
    })
  })),
  setup: (box) => {
    if (ws === 0) {
      box.hook(hyprland4.active.workspace, () => box.children.map((btn) => {
        btn.visible = hyprland4.workspaces.some((ws2) => ws2.id === btn.attribute);
      }));
    }
  }
});
var Workspaces_default = () => PanelButton_default({
  window: "overview",
  class_name: "workspaces",
  on_scroll_up: () => dispatch("m+1"),
  on_scroll_down: () => dispatch("m-1"),
  on_clicked: () => App.toggleWindow("overview"),
  child: workspaces.bind().as(Workspaces)
});

// service/screenrecord.ts
import GLib6 from "gi://GLib";
var now = () => GLib6.DateTime.new_now_local().format("%Y-%m-%d_%H-%M-%S");

class Recorder extends Service {
  static {
    Service.register(this, {}, {
      timer: ["int"],
      recording: ["boolean"]
    });
  }
  #recordings = Utils.HOME + "/Videos/Screencasting";
  #screenshots = Utils.HOME + "/Pictures/Screenshots";
  #file = "";
  #interval = 0;
  recording = false;
  timer = 0;
  async start() {
    if (!dependencies("slurp", "wf-recorder"))
      return;
    if (this.recording)
      return;
    Utils.ensureDirectory(this.#recordings);
    this.#file = `${this.#recordings}/${now()}.mp4`;
    sh(`wf-recorder -g "${await sh("slurp")}" -f ${this.#file} --pixel-format yuv420p`);
    this.recording = true;
    this.changed("recording");
    this.timer = 0;
    this.#interval = Utils.interval(1000, () => {
      this.changed("timer");
      this.timer++;
    });
  }
  async stop() {
    if (!this.recording)
      return;
    await bash("killall -INT wf-recorder");
    this.recording = false;
    this.changed("recording");
    GLib6.source_remove(this.#interval);
    Utils.notify({
      iconName: icons_default.fallback.video,
      summary: "Screenrecord",
      body: this.#file,
      actions: {
        "Show in Files": () => sh(`xdg-open ${this.#recordings}`),
        View: () => sh(`xdg-open ${this.#file}`)
      }
    });
  }
  async screenshot(full = false) {
    if (!dependencies("slurp", "wayshot"))
      return;
    const file = `${this.#screenshots}/${now()}.png`;
    Utils.ensureDirectory(this.#screenshots);
    if (full) {
      await sh(`wayshot -f ${file}`);
    } else {
      const size = await sh("slurp");
      if (!size)
        return;
      await sh(`wayshot -f ${file} -s "${size}"`);
    }
    bash(`wl-copy < ${file}`);
    Utils.notify({
      image: file,
      summary: "Screenshot",
      body: file,
      actions: {
        "Show in Files": () => sh(`xdg-open ${this.#screenshots}`),
        View: () => sh(`xdg-open ${file}`),
        Edit: () => {
          if (dependencies("swappy"))
            sh(`swappy -f ${file}`);
        }
      }
    });
  }
}
var recorder = new Recorder;
Object.assign(globalThis, { recorder });
var screenrecord_default = recorder;

// widget/bar/buttons/ScreenRecord.ts
var ScreenRecord_default = () => PanelButton_default({
  class_name: "recorder",
  on_clicked: () => screenrecord_default.stop(),
  visible: screenrecord_default.bind("recording"),
  child: Widget.Box({
    children: [
      Widget.Icon(icons_default.recorder.recording),
      Widget.Label({
        label: screenrecord_default.bind("timer").as((time2) => {
          const sec = time2 % 60;
          const min = Math.floor(time2 / 60);
          return `${min}:${sec < 10 ? "0" + sec : sec}`;
        })
      })
    ]
  })
});

// widget/bar/buttons/Messages.ts
var n = await Service.import("notifications");
var notifs2 = n.bind("notifications");
var action4 = options_default.bar.messages.action.bind();
var Messages_default = () => PanelButton_default({
  class_name: "messages",
  on_clicked: action4,
  visible: notifs2.as((n2) => n2.length > 0),
  child: Widget.Box([
    Widget.Icon(icons_default.notifications.message)
  ])
});

// widget/bar/Bar.ts
var { start, center, end } = options_default.bar.layout;
var { transparent, position: position2 } = options_default.bar;
var widget2 = {
  battery: BatteryBar_default,
  colorpicker: ColorPicker_default,
  date: Date_default,
  launcher: Launcher_default,
  media: Media_default,
  powermenu: PowerMenu_default,
  systray: SysTray_default,
  system: SystemIndicators_default,
  taskbar: Taskbar_default,
  workspaces: Workspaces_default,
  screenrecord: ScreenRecord_default,
  messages: Messages_default,
  expander: () => Widget.Box({ expand: true })
};
var Bar_default = (monitor) => Widget.Window({
  monitor,
  class_name: "bar",
  name: `bar${monitor}`,
  exclusivity: "exclusive",
  anchor: position2.bind().as((pos) => [pos, "right", "left"]),
  child: Widget.CenterBox({
    css: "min-width: 2px; min-height: 2px;",
    startWidget: Widget.Box({
      hexpand: true,
      children: start.bind().as((s) => s.map((w) => widget2[w]()))
    }),
    centerWidget: Widget.Box({
      hpack: "center",
      children: center.bind().as((c) => c.map((w) => widget2[w]()))
    }),
    endWidget: Widget.Box({
      hexpand: true,
      children: end.bind().as((e) => e.map((w) => widget2[w]()))
    })
  }),
  setup: (self) => self.hook(transparent, () => {
    self.toggleClassName("transparent", transparent.value);
  })
});

// widget/PopupWindow.ts
var Padding = (name, {
  css: css2 = "",
  hexpand = true,
  vexpand = true
} = {}) => Widget.EventBox({
  hexpand,
  vexpand,
  can_focus: false,
  child: Widget.Box({ css: css2 }),
  setup: (w) => w.on("button-press-event", () => App.toggleWindow(name))
});
var PopupRevealer = (name, child, transition = "slide_down") => Widget.Box({ css: "padding: 1px;" }, Widget.Revealer({
  transition,
  child: Widget.Box({
    class_name: "window-content",
    child
  }),
  transitionDuration: options_default.transition.bind(),
  setup: (self) => self.hook(App, (_, wname, visible) => {
    if (wname === name)
      self.reveal_child = visible;
  })
}));
var Layout = (name, child, transition) => ({
  center: () => Widget.CenterBox({}, Padding(name), Widget.CenterBox({ vertical: true }, Padding(name), PopupRevealer(name, child, transition), Padding(name)), Padding(name)),
  top: () => Widget.CenterBox({}, Padding(name), Widget.Box({ vertical: true }, PopupRevealer(name, child, transition), Padding(name)), Padding(name)),
  "top-right": () => Widget.Box({}, Padding(name), Widget.Box({
    hexpand: false,
    vertical: true
  }, PopupRevealer(name, child, transition), Padding(name))),
  "top-center": () => Widget.Box({}, Padding(name), Widget.Box({
    hexpand: false,
    vertical: true
  }, PopupRevealer(name, child, transition), Padding(name)), Padding(name)),
  "top-left": () => Widget.Box({}, Widget.Box({
    hexpand: false,
    vertical: true
  }, PopupRevealer(name, child, transition), Padding(name)), Padding(name)),
  "bottom-left": () => Widget.Box({}, Widget.Box({
    hexpand: false,
    vertical: true
  }, Padding(name), PopupRevealer(name, child, transition)), Padding(name)),
  "bottom-center": () => Widget.Box({}, Padding(name), Widget.Box({
    hexpand: false,
    vertical: true
  }, Padding(name), PopupRevealer(name, child, transition)), Padding(name)),
  "bottom-right": () => Widget.Box({}, Padding(name), Widget.Box({
    hexpand: false,
    vertical: true
  }, Padding(name), PopupRevealer(name, child, transition)))
});
var PopupWindow_default = ({
  name,
  child,
  layout = "center",
  transition,
  exclusivity = "ignore",
  ...props
}) => Widget.Window({
  name,
  class_names: [name, "popup-window"],
  setup: (w) => w.keybind("Escape", () => App.closeWindow(name)),
  visible: false,
  keymode: "on-demand",
  exclusivity,
  layer: "top",
  anchor: ["top", "bottom", "right", "left"],
  child: Layout(name, child, transition)[layout](),
  ...props
});

// widget/launcher/AppLauncher.ts
function Favorites() {
  const favs = options_default.launcher.apps.favorites.bind();
  return Widget.Revealer({
    visible: favs.as((f) => f.length > 0),
    child: Widget.Box({
      vertical: true,
      children: favs.as((favs2) => favs2.flatMap((fs) => [
        Widget.Separator(),
        Widget.Box({
          class_name: "quicklaunch horizontal",
          children: fs.map((f) => query(f)?.[0]).filter((f) => f).map(QuickAppButton)
        })
      ]))
    })
  });
}
function Launcher2() {
  const applist = Variable(query(""));
  const max = options_default.launcher.apps.max;
  let first = applist.value[0];
  function SeparatedAppItem(app) {
    return Widget.Revealer({ attribute: { app } }, Widget.Box({ vertical: true }, Widget.Separator(), AppItem2(app)));
  }
  const list = Widget.Box({
    vertical: true,
    children: applist.bind().as((list2) => list2.map(SeparatedAppItem)),
    setup: (self) => self.hook(apps2, () => applist.value = query(""), "notify::frequents")
  });
  return Object.assign(list, {
    filter(text) {
      first = query(text || "")[0];
      list.children.reduce((i, item) => {
        if (!text || i >= max.value) {
          item.reveal_child = false;
          return i;
        }
        if (item.attribute.app.match(text)) {
          item.reveal_child = true;
          return ++i;
        }
        item.reveal_child = false;
        return i;
      }, 0);
    },
    launchFirst() {
      launchApp(first);
    }
  });
}
var apps2 = await Service.import("applications");
var { query } = apps2;
var { iconSize: iconSize2 } = options_default.launcher.apps;
var QuickAppButton = (app) => Widget.Button({
  hexpand: true,
  tooltip_text: app.name,
  on_clicked: () => {
    App.closeWindow("launcher");
    launchApp(app);
  },
  child: Widget.Icon({
    size: iconSize2.bind(),
    icon: icon(app.icon_name, icons_default.fallback.executable)
  })
});
var AppItem2 = (app) => {
  const title = Widget.Label({
    class_name: "title",
    label: app.name,
    hexpand: true,
    xalign: 0,
    vpack: "center",
    truncate: "end"
  });
  const description = Widget.Label({
    class_name: "description",
    label: app.description || "",
    hexpand: true,
    wrap: true,
    max_width_chars: 30,
    xalign: 0,
    justification: "left",
    vpack: "center"
  });
  const appicon = Widget.Icon({
    icon: icon(app.icon_name, icons_default.fallback.executable),
    size: iconSize2.bind()
  });
  const textBox = Widget.Box({
    vertical: true,
    vpack: "center",
    children: app.description ? [title, description] : [title]
  });
  return Widget.Button({
    class_name: "app-item",
    attribute: { app },
    child: Widget.Box({
      children: [appicon, textBox]
    }),
    on_clicked: () => {
      App.closeWindow("launcher");
      launchApp(app);
    }
  });
};

// widget/launcher/NixRun.ts
function Item(pkg) {
  const name = Widget.Label({
    class_name: "name",
    label: pkg.name.split(".").at(-1)
  });
  const subpkg = pkg.name.includes(".") ? Widget.Label({
    class_name: "description",
    hpack: "end",
    hexpand: true,
    label: `  ${pkg.name.split(".").slice(0, -1).join(".")}`
  }) : null;
  const version = Widget.Label({
    class_name: "version",
    label: pkg.version,
    hexpand: true,
    hpack: "end"
  });
  const description = pkg.description ? Widget.Label({
    class_name: "description",
    label: pkg.description,
    justification: "left",
    wrap: true,
    hpack: "start",
    max_width_chars: 40
  }) : null;
  return Widget.Box({
    attribute: { name: pkg.name },
    vertical: true
  }, Widget.Separator(), Widget.Button({
    class_name: "nix-item",
    on_clicked: () => {
      nix_default.run(pkg.name);
      App.closeWindow("launcher");
    }
  }, Widget.Box({ vertical: true }, Widget.Box([name, version]), Widget.Box([
    description,
    subpkg
  ]))));
}
function Spinner2() {
  const icon3 = Widget.Icon({
    icon: icons_default.nix.nix,
    class_name: "spinner",
    css: `
            @keyframes spin {
                to { -gtk-icon-transform: rotate(1turn); }
            }

            image.spinning {
                animation-name: spin;
                animation-duration: 1s;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
            }
        `,
    setup: (self) => self.hook(nix_default, () => {
      self.toggleClassName("spinning", !nix_default.ready);
    })
  });
  return Widget.Revealer({
    transition: "slide_left",
    child: icon3,
    reveal_child: Utils.merge([
      nix_default.bind("ready"),
      iconVisible.bind()
    ], (ready, show) => !ready || show)
  });
}
function NixRun() {
  const list = Widget.Box({
    vertical: true
  });
  const revealer = Widget.Revealer({
    child: list
  });
  async function filter(term) {
    iconVisible.value = Boolean(term);
    if (!term)
      revealer.reveal_child = false;
    if (term.trim()) {
      const found = await nix_default.query(term);
      list.children = found.map((k) => Item(nix_default.db[k]));
      revealer.reveal_child = true;
    }
  }
  return Object.assign(revealer, {
    filter,
    run: nix_default.run
  });
}
var iconVisible = Variable(false);

// service/sh.ts
import GLib7 from "gi://GLib?version=2.0";
async function ls(path) {
  return Utils.execAsync(`ls ${path}`).catch(() => "");
}
async function reload() {
  const bins = await Promise.all(GLib7.getenv("PATH").split(":").map(ls));
  Utils.writeFile(bins.join("\n"), BINS);
}
async function query2(filter) {
  if (!dependencies("fzf"))
    return [];
  return bash(`cat ${BINS} | fzf -f ${filter} | head -n ${MAX2}`).then((str) => Array.from(new Set(str.split("\n").filter((i) => i)).values())).catch((err) => {
    print(err);
    return [];
  });
}
function run(args) {
  Utils.execAsync(args).then((out) => {
    print(`:sh ${args.trim()}:`);
    print(out);
  }).catch((err) => {
    Utils.notify("ShRun Error", err, icons_default.app.terminal);
  });
}
var MAX2 = options_default.launcher.sh.max;
var BINS = `${Utils.CACHE_DIR}/binaries`;

class Sh extends Service {
  static {
    Service.register(this);
  }
  constructor() {
    super();
    reload();
  }
  query = query2;
  run = run;
}
var sh_default = new Sh;

// widget/launcher/ShRun.ts
function Item2(bin) {
  return Widget.Box({
    attribute: { bin },
    vertical: true
  }, Widget.Separator(), Widget.Button({
    child: Widget.Label({
      label: bin,
      hpack: "start"
    }),
    class_name: "sh-item",
    on_clicked: () => {
      Utils.execAsync(bin);
      App.closeWindow("launcher");
    }
  }));
}
function Icon() {
  const icon3 = Widget.Icon({
    icon: icons_default.app.terminal,
    class_name: "spinner"
  });
  return Widget.Revealer({
    transition: "slide_left",
    child: icon3,
    reveal_child: iconVisible2.bind()
  });
}
function ShRun() {
  const list = Widget.Box({
    vertical: true
  });
  const revealer = Widget.Revealer({
    child: list
  });
  async function filter(term) {
    iconVisible2.value = Boolean(term);
    if (!term)
      revealer.reveal_child = false;
    if (term.trim()) {
      const found = await sh_default.query(term);
      list.children = found.map(Item2);
      revealer.reveal_child = true;
    }
  }
  return Object.assign(revealer, {
    filter,
    run: sh_default.run
  });
}
var iconVisible2 = Variable(false);

// widget/launcher/Launcher.ts
function Launcher3() {
  const favs = Favorites();
  const applauncher = Launcher2();
  const sh3 = ShRun();
  const shicon = Icon();
  const nix4 = NixRun();
  const nixload = Spinner2();
  function HelpButton(cmd, desc) {
    return Widget.Box({ vertical: true }, Widget.Separator(), Widget.Button({
      class_name: "help",
      on_clicked: () => {
        entry.grab_focus();
        entry.text = `:${cmd} `;
        entry.set_position(-1);
      }
    }, Widget.Box([
      Widget.Label({
        class_name: "name",
        label: `:${cmd}`
      }),
      Widget.Label({
        hexpand: true,
        hpack: "end",
        class_name: "description",
        label: desc
      })
    ])));
  }
  const help = Widget.Revealer({
    child: Widget.Box({ vertical: true }, HelpButton("sh", "run a binary"), isnix ? HelpButton("nx", options_default.launcher.nix.pkgs.bind().as((pkg) => `run a nix package from ${pkg}`)) : Widget.Box())
  });
  const entry = Widget.Entry({
    hexpand: true,
    primary_icon_name: icons_default.ui.search,
    on_accept: ({ text }) => {
      if (text?.startsWith(":nx"))
        nix4.run(text.substring(3));
      else if (text?.startsWith(":sh"))
        sh3.run(text.substring(3));
      else
        applauncher.launchFirst();
      App.toggleWindow("launcher");
      entry.text = "";
    },
    on_change: ({ text }) => {
      text ||= "";
      favs.reveal_child = text === "";
      help.reveal_child = text.split(" ").length === 1 && text?.startsWith(":");
      if (text?.startsWith(":nx"))
        nix4.filter(text.substring(3));
      else
        nix4.filter("");
      if (text?.startsWith(":sh"))
        sh3.filter(text.substring(3));
      else
        sh3.filter("");
      if (!text?.startsWith(":"))
        applauncher.filter(text);
    }
  });
  function focus2() {
    entry.text = "Search";
    entry.set_position(-1);
    entry.select_region(0, -1);
    entry.grab_focus();
    favs.reveal_child = true;
  }
  const layout = Widget.Box({
    css: width3.bind().as((v) => `min-width: ${v}pt;`),
    class_name: "launcher",
    vertical: true,
    vpack: "start",
    setup: (self) => self.hook(App, (_, win, visible) => {
      if (win !== "launcher")
        return;
      entry.text = "";
      if (visible)
        focus2();
    }),
    children: [
      Widget.Box([entry, nixload, shicon]),
      favs,
      help,
      applauncher,
      nix4,
      sh3
    ]
  });
  return Widget.Box({ vertical: true, css: "padding: 1px" }, Padding("launcher", {
    css: margin.bind().as((v) => `min-height: ${v}pt;`),
    vexpand: false
  }), layout);
}
var { width: width3, margin } = options_default.launcher;
var isnix = nix_default.available;
var Launcher_default2 = () => PopupWindow_default({
  name: "launcher",
  layout: "top",
  child: Launcher3()
});

// widget/notifications/Notification.ts
import GLib9 from "gi://GLib";
var time2 = (time3, format3 = "%H:%M") => GLib9.DateTime.new_from_unix_local(time3).format(format3);
var NotificationIcon = ({ app_entry, app_icon, image }) => {
  if (image) {
    return Widget.Box({
      vpack: "start",
      hexpand: false,
      class_name: "icon img",
      css: `
                background-image: url("${image}");
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
                min-width: 78px;
                min-height: 78px;
            `
    });
  }
  let icon3 = icons_default.fallback.notification;
  if (Utils.lookUpIcon(app_icon))
    icon3 = app_icon;
  if (Utils.lookUpIcon(app_entry || ""))
    icon3 = app_entry || "";
  return Widget.Box({
    vpack: "start",
    hexpand: false,
    class_name: "icon",
    css: `
            min-width: 78px;
            min-height: 78px;
        `,
    child: Widget.Icon({
      icon: icon3,
      size: 58,
      hpack: "center",
      hexpand: true,
      vpack: "center",
      vexpand: true
    })
  });
};
var Notification_default = (notification) => {
  const content = Widget.Box({
    class_name: "content",
    children: [
      NotificationIcon(notification),
      Widget.Box({
        hexpand: true,
        vertical: true,
        children: [
          Widget.Box({
            children: [
              Widget.Label({
                class_name: "title",
                xalign: 0,
                justification: "left",
                hexpand: true,
                max_width_chars: 24,
                truncate: "end",
                wrap: true,
                label: notification.summary.trim(),
                use_markup: true
              }),
              Widget.Label({
                class_name: "time",
                vpack: "start",
                label: time2(notification.time)
              }),
              Widget.Button({
                class_name: "close-button",
                vpack: "start",
                child: Widget.Icon("window-close-symbolic"),
                on_clicked: notification.close
              })
            ]
          }),
          Widget.Label({
            class_name: "description",
            hexpand: true,
            use_markup: true,
            xalign: 0,
            justification: "left",
            label: notification.body.trim(),
            max_width_chars: 24,
            wrap: true
          })
        ]
      })
    ]
  });
  const actionsbox = notification.actions.length > 0 ? Widget.Revealer({
    transition: "slide_down",
    child: Widget.EventBox({
      child: Widget.Box({
        class_name: "actions horizontal",
        children: notification.actions.map((action5) => Widget.Button({
          class_name: "action-button",
          on_clicked: () => notification.invoke(action5.id),
          hexpand: true,
          child: Widget.Label(action5.label)
        }))
      })
    })
  }) : null;
  const eventbox = Widget.EventBox({
    vexpand: false,
    on_primary_click: notification.dismiss,
    on_hover() {
      if (actionsbox)
        actionsbox.reveal_child = true;
    },
    on_hover_lost() {
      if (actionsbox)
        actionsbox.reveal_child = true;
      notification.dismiss();
    },
    child: Widget.Box({
      vertical: true,
      children: actionsbox ? [content, actionsbox] : [content]
    })
  });
  return Widget.Box({
    class_name: `notification ${notification.urgency}`,
    child: eventbox
  });
};

// widget/notifications/NotificationPopups.ts
function Animated(id) {
  const n2 = notifications3.getNotification(id);
  const widget3 = Notification_default(n2);
  const inner = Widget.Revealer({
    transition: "slide_left",
    transition_duration: transition.value,
    child: widget3
  });
  const outer = Widget.Revealer({
    transition: "slide_down",
    transition_duration: transition.value,
    child: inner
  });
  const box = Widget.Box({
    hpack: "end",
    child: outer
  });
  idle(() => {
    outer.reveal_child = true;
    timeout(transition.value, () => {
      inner.reveal_child = true;
    });
  });
  return Object.assign(box, {
    dismiss() {
      inner.reveal_child = false;
      timeout(transition.value, () => {
        outer.reveal_child = false;
        timeout(transition.value, () => {
          box.destroy();
        });
      });
    }
  });
}
function PopupList() {
  const map = new Map;
  const box = Widget.Box({
    hpack: "end",
    vertical: true,
    css: options_default.notifications.width.bind().as((w) => `min-width: ${w}px;`)
  });
  function remove(_, id) {
    map.get(id)?.dismiss();
    map.delete(id);
  }
  return box.hook(notifications3, (_, id) => {
    if (id !== undefined) {
      if (map.has(id))
        remove(null, id);
      if (notifications3.dnd)
        return;
      const w = Animated(id);
      map.set(id, w);
      box.children = [w, ...box.children];
    }
  }, "notified").hook(notifications3, remove, "dismissed").hook(notifications3, remove, "closed");
}
var notifications3 = await Service.import("notifications");
var { transition } = options_default;
var { position: position3 } = options_default.notifications;
var { timeout, idle } = Utils;
var NotificationPopups_default = (monitor) => Widget.Window({
  monitor,
  name: `notifications${monitor}`,
  anchor: position3.bind(),
  class_name: "notifications",
  child: Widget.Box({
    css: "padding: 2px;",
    child: PopupList()
  })
});

// widget/osd/Progress.ts
import GLib10 from "gi://GLib?version=2.0";
var Progress_default = ({
  height = 18,
  width: width4 = 180,
  vertical = false,
  child
}) => {
  const fill = Widget.Box({
    class_name: "fill",
    hexpand: vertical,
    vexpand: !vertical,
    hpack: vertical ? "fill" : "start",
    vpack: vertical ? "end" : "fill",
    child
  });
  const container = Widget.Box({
    class_name: "progress",
    child: fill,
    css: `
            min-width: ${width4}px;
            min-height: ${height}px;
        `
  });
  let fill_size = 0;
  let animations = [];
  return Object.assign(container, {
    setValue(value) {
      if (value < 0)
        return;
      if (animations.length > 0) {
        for (const id of animations)
          GLib10.source_remove(id);
        animations = [];
      }
      const axis = vertical ? "height" : "width";
      const axisv = vertical ? height : width4;
      const min = vertical ? width4 : height;
      const preferred2 = (axisv - min) * value + min;
      if (!fill_size) {
        fill_size = preferred2;
        fill.css = `min-${axis}: ${preferred2}px;`;
        return;
      }
      const frames = options_default.transition.value / 10;
      const goal = preferred2 - fill_size;
      const step = goal / frames;
      animations = range(frames, 0).map((i) => Utils.timeout(5 * i, () => {
        fill_size += step;
        fill.css = `min-${axis}: ${fill_size}px`;
        animations.shift();
      }));
    }
  });
};

// service/brightness.ts
if (!dependencies("brightnessctl"))
  App.quit();
var get = (args) => Number(Utils.exec(`brightnessctl ${args}`));
var screen = await bash`ls -w1 /sys/class/backlight | head -1`;
var kbd = await bash`ls -w1 /sys/class/leds | head -1`;

class Brightness extends Service {
  static {
    Service.register(this, {}, {
      screen: ["float", "rw"],
      kbd: ["int", "rw"]
    });
  }
  #kbdMax = get(`--device ${kbd} max`);
  #kbd = get(`--device ${kbd} get`);
  #screenMax = get("max");
  #screen = get("get") / (get("max") || 1);
  get kbd() {
    return this.#kbd;
  }
  get screen() {
    return this.#screen;
  }
  set kbd(value) {
    if (value < 0 || value > this.#kbdMax)
      return;
    sh(`brightnessctl -d ${kbd} s ${value} -q`).then(() => {
      this.#kbd = value;
      this.changed("kbd");
    });
  }
  set screen(percent) {
    if (percent < 0)
      percent = 0;
    if (percent > 1)
      percent = 1;
    sh(`brightnessctl set ${Math.floor(percent * 100)}% -q`).then(() => {
      this.#screen = percent;
      this.changed("screen");
    });
  }
  constructor() {
    super();
    const screenPath = `/sys/class/backlight/${screen}/brightness`;
    const kbdPath = `/sys/class/leds/${kbd}/brightness`;
    Utils.monitorFile(screenPath, async (f) => {
      const v = await Utils.readFileAsync(f);
      this.#screen = Number(v) / this.#screenMax;
      this.changed("screen");
    });
    Utils.monitorFile(kbdPath, async (f) => {
      const v = await Utils.readFileAsync(f);
      this.#kbd = Number(v) / this.#kbdMax;
      this.changed("kbd");
    });
  }
}
var brightness_default = new Brightness;

// widget/osd/OSD.ts
function OnScreenProgress(vertical) {
  const indicator = Widget.Icon({
    size: 42,
    vpack: "start"
  });
  const progress = Progress_default({
    vertical,
    width: vertical ? 42 : 300,
    height: vertical ? 300 : 42,
    child: indicator
  });
  const revealer = Widget.Revealer({
    transition: "slide_left",
    child: progress
  });
  let count = 0;
  function show(value, icon3) {
    revealer.reveal_child = true;
    indicator.icon = icon3;
    progress.setValue(value);
    count++;
    Utils.timeout(DELAY, () => {
      count--;
      if (count === 0)
        revealer.reveal_child = false;
    });
  }
  return revealer.hook(brightness_default, () => show(brightness_default.screen, icons_default.brightness.screen), "notify::screen").hook(brightness_default, () => show(brightness_default.kbd, icons_default.brightness.keyboard), "notify::kbd").hook(audio2.speaker, () => show(audio2.speaker.volume, icon(audio2.speaker.icon_name || "", icons_default.audio.type.speaker)), "notify::volume");
}
function MicrophoneMute() {
  const icon3 = Widget.Icon({
    class_name: "microphone"
  });
  const revealer = Widget.Revealer({
    transition: "slide_up",
    child: icon3
  });
  let count = 0;
  let mute = audio2.microphone.stream?.is_muted ?? false;
  return revealer.hook(audio2.microphone, () => Utils.idle(() => {
    if (mute !== audio2.microphone.stream?.is_muted) {
      mute = audio2.microphone.stream.is_muted;
      icon3.icon = icons_default.audio.mic[mute ? "muted" : "high"];
      revealer.reveal_child = true;
      count++;
      Utils.timeout(DELAY, () => {
        count--;
        if (count === 0)
          revealer.reveal_child = false;
      });
    }
  }));
}
var audio2 = await Service.import("audio");
var { progress, microphone } = options_default.osd;
var DELAY = 2500;
var OSD_default = (monitor) => Widget.Window({
  monitor,
  name: `indicator${monitor}`,
  class_name: "indicator",
  layer: "overlay",
  click_through: true,
  anchor: ["right", "left", "top", "bottom"],
  child: Widget.Box({
    css: "padding: 2px;",
    expand: true,
    child: Widget.Overlay({ child: Widget.Box({ expand: true }) }, Widget.Box({
      hpack: progress.pack.h.bind(),
      vpack: progress.pack.v.bind(),
      child: progress.vertical.bind().as(OnScreenProgress)
    }), Widget.Box({
      hpack: microphone.pack.h.bind(),
      vpack: microphone.pack.v.bind(),
      child: MicrophoneMute()
    }))
  })
});

// widget/overview/Window.ts
import Gdk8 from "gi://Gdk";
import Gtk from "gi://Gtk?version=3.0";
var monochrome4 = options_default.overview.monochromeIcon;
var TARGET = [Gtk.TargetEntry.new("text/plain", Gtk.TargetFlags.SAME_APP, 0)];
var hyprland5 = await Service.import("hyprland");
var apps3 = await Service.import("applications");
var dispatch2 = (args) => hyprland5.messageAsync(`dispatch ${args}`);
var Window_default = ({ address, size: [w, h], class: c, title }) => Widget.Button({
  class_name: "client",
  attribute: { address },
  tooltip_text: `${title}`,
  child: Widget.Icon({
    css: options_default.overview.scale.bind().as((v) => `
            min-width: ${v / 100 * w}px;
            min-height: ${v / 100 * h}px;
        `),
    icon: monochrome4.bind().as((m) => {
      const app = apps3.list.find((app2) => app2.match(c));
      if (!app)
        return icons_default.fallback.executable + (m ? "-symbolic" : "");
      return icon(app.icon_name + (m ? "-symbolic" : ""), icons_default.fallback.executable + (m ? "-symbolic" : ""));
    })
  }),
  on_secondary_click: () => dispatch2(`closewindow address:${address}`),
  on_clicked: () => {
    dispatch2(`focuswindow address:${address}`);
    App.closeWindow("overview");
  },
  setup: (btn) => btn.on("drag-data-get", (_w, _c, data) => data.set_text(address, address.length)).on("drag-begin", (_, context) => {
    Gtk.drag_set_icon_surface(context, createSurfaceFromWidget(btn));
    btn.toggleClassName("hidden", true);
  }).on("drag-end", () => btn.toggleClassName("hidden", false)).drag_source_set(Gdk8.ModifierType.BUTTON1_MASK, TARGET, Gdk8.DragAction.COPY)
});

// widget/overview/Workspace.ts
import Gdk10 from "gi://Gdk";
import Gtk2 from "gi://Gtk?version=3.0";
var TARGET2 = [Gtk2.TargetEntry.new("text/plain", Gtk2.TargetFlags.SAME_APP, 0)];
var scale = (size) => options_default.overview.scale.value / 100 * size;
var hyprland6 = await Service.import("hyprland");
var dispatch3 = (args) => hyprland6.messageAsync(`dispatch ${args}`);
var size = (id) => {
  const def = { h: 1080, w: 1920 };
  const ws = hyprland6.getWorkspace(id);
  if (!ws)
    return def;
  const mon = hyprland6.getMonitor(ws.monitorID);
  return mon ? { h: mon.height, w: mon.width } : def;
};
var Workspace_default = (id) => {
  const fixed = Widget.Fixed();
  async function update() {
    const json = await hyprland6.messageAsync("j/clients").catch(() => null);
    if (!json)
      return;
    fixed.get_children().forEach((ch) => ch.destroy());
    const clients = JSON.parse(json);
    clients.filter(({ workspace }) => workspace.id === id).forEach((c) => {
      const x = c.at[0] - (hyprland6.getMonitor(c.monitor)?.x || 0);
      const y = c.at[1] - (hyprland6.getMonitor(c.monitor)?.y || 0);
      c.mapped && fixed.put(Window_default(c), scale(x), scale(y));
    });
    fixed.show_all();
  }
  return Widget.Box({
    attribute: { id },
    tooltipText: `${id}`,
    class_name: "workspace",
    vpack: "center",
    css: options_default.overview.scale.bind().as((v) => `
            min-width: ${v / 100 * size(id).w}px;
            min-height: ${v / 100 * size(id).h}px;
        `),
    setup(box) {
      box.hook(options_default.overview.scale, update);
      box.hook(hyprland6, update, "notify::clients");
      box.hook(hyprland6.active.client, update);
      box.hook(hyprland6.active.workspace, () => {
        box.toggleClassName("active", hyprland6.active.workspace.id === id);
      });
    },
    child: Widget.EventBox({
      expand: true,
      on_primary_click: () => {
        App.closeWindow("overview");
        dispatch3(`workspace ${id}`);
      },
      setup: (eventbox) => {
        eventbox.drag_dest_set(Gtk2.DestDefaults.ALL, TARGET2, Gdk10.DragAction.COPY);
        eventbox.connect("drag-data-received", (_w, _c, _x, _y, data) => {
          const address = new TextDecoder().decode(data.get_data());
          dispatch3(`movetoworkspacesilent ${id},address:${address}`);
        });
      },
      child: fixed
    })
  });
};

// widget/overview/Overview.ts
var hyprland7 = await Service.import("hyprland");
var Overview = (ws) => Widget.Box({
  class_name: "overview horizontal",
  children: ws > 0 ? range(ws).map(Workspace_default) : hyprland7.workspaces.map(({ id }) => Workspace_default(id)).sort((a, b) => a.attribute.id - b.attribute.id),
  setup: (w) => {
    if (ws > 0)
      return;
    w.hook(hyprland7, (w2, id) => {
      if (id === undefined)
        return;
      w2.children = w2.children.filter((ch) => ch.attribute.id !== Number(id));
    }, "workspace-removed");
    w.hook(hyprland7, (w2, id) => {
      if (id === undefined)
        return;
      w2.children = [...w2.children, Workspace_default(Number(id))].sort((a, b) => a.attribute.id - b.attribute.id);
    }, "workspace-added");
  }
});
var Overview_default = () => PopupWindow_default({
  name: "overview",
  layout: "center",
  child: options_default.overview.workspaces.bind().as(Overview)
});

// service/powermenu.ts
var { sleep, reboot, logout, shutdown } = options_default.powermenu;

class PowerMenu2 extends Service {
  static {
    Service.register(this, {}, {
      title: ["string"],
      cmd: ["string"]
    });
  }
  #title = "";
  #cmd = "";
  get title() {
    return this.#title;
  }
  action(action5) {
    [this.#cmd, this.#title] = {
      sleep: [sleep.value, "Sleep"],
      reboot: [reboot.value, "Reboot"],
      logout: [logout.value, "Log Out"],
      shutdown: [shutdown.value, "Shutdown"]
    }[action5];
    this.notify("cmd");
    this.notify("title");
    this.emit("changed");
    App.closeWindow("powermenu");
    App.openWindow("verification");
  }
  shutdown = () => {
    this.action("shutdown");
  };
  exec = () => {
    App.closeWindow("verification");
    Utils.exec(this.#cmd);
  };
}
var powermenu = new PowerMenu2;
Object.assign(globalThis, { powermenu });
var powermenu_default = powermenu;

// widget/powermenu/PowerMenu.ts
var { layout, labels } = options_default.powermenu;
var SysButton = (action5, label2) => Widget.Button({
  on_clicked: () => powermenu_default.action(action5),
  child: Widget.Box({
    vertical: true,
    class_name: "system-button",
    children: [
      Widget.Icon(icons_default.powermenu[action5]),
      Widget.Label({
        label: label2,
        visible: labels.bind()
      })
    ]
  })
});
var PowerMenu_default2 = () => PopupWindow_default({
  name: "powermenu",
  transition: "crossfade",
  child: Widget.Box({
    class_name: "powermenu horizontal",
    setup: (self) => self.hook(layout, () => {
      self.toggleClassName("box", layout.value === "box");
      self.toggleClassName("line", layout.value === "line");
    }),
    children: layout.bind().as((layout2) => {
      switch (layout2) {
        case "line":
          return [
            SysButton("shutdown", "Shutdown"),
            SysButton("logout", "Log Out"),
            SysButton("reboot", "Reboot"),
            SysButton("sleep", "Sleep")
          ];
        case "box":
          return [
            Widget.Box({ vertical: true }, SysButton("shutdown", "Shutdown"), SysButton("logout", "Log Out")),
            Widget.Box({ vertical: true }, SysButton("reboot", "Reboot"), SysButton("sleep", "Sleep"))
          ];
      }
    })
  })
});

// widget/bar/ScreenCorners.ts
var { corners, transparent: transparent2 } = options_default.bar;
var ScreenCorners_default = (monitor) => Widget.Window({
  monitor,
  name: `corner${monitor}`,
  class_name: "screen-corner",
  anchor: ["top", "bottom", "right", "left"],
  click_through: true,
  child: Widget.Box({
    class_name: "shadow",
    child: Widget.Box({
      class_name: "border",
      expand: true,
      child: Widget.Box({
        class_name: "corner",
        expand: true
      })
    })
  }),
  setup: (self) => self.hook(corners, () => {
    self.toggleClassName("corners", corners.value > 0);
  }).hook(transparent2, () => {
    self.toggleClassName("hidden", transparent2.value);
  })
});

// widget/RegularWindow.ts
import Gtk3 from "gi://Gtk?version=3.0";
var RegularWindow_default = Widget.subclass(Gtk3.Window);

// widget/settings/Setter.ts
import Gdk12 from "gi://Gdk";
function EnumSetter(opt2, values) {
  const lbl = Widget.Label({ label: opt2.bind().as((v) => `${v}`) });
  const step = (dir) => {
    const i = values.findIndex((i2) => i2 === lbl.label);
    opt2.setValue(dir > 0 ? i + dir > values.length - 1 ? values[0] : values[i + dir] : i + dir < 0 ? values[values.length - 1] : values[i + dir]);
  };
  const next = Widget.Button({
    child: Widget.Icon(icons_default.ui.arrow.right),
    on_clicked: () => step(1)
  });
  const prev = Widget.Button({
    child: Widget.Icon(icons_default.ui.arrow.left),
    on_clicked: () => step(-1)
  });
  return Widget.Box({
    class_name: "enum-setter",
    children: [lbl, prev, next]
  });
}
function Setter({
  opt: opt2,
  type = typeof opt2.value,
  enums,
  max = 1000,
  min = 0
}) {
  switch (type) {
    case "number":
      return Widget.SpinButton({
        setup(self) {
          self.set_range(min, max);
          self.set_increments(1, 5);
          self.on("value-changed", () => opt2.value = self.value);
          self.hook(opt2, () => self.value = opt2.value);
        }
      });
    case "float":
    case "object":
      return Widget.Entry({
        on_accept: (self) => opt2.value = JSON.parse(self.text || ""),
        setup: (self) => self.hook(opt2, () => self.text = JSON.stringify(opt2.value))
      });
    case "string":
      return Widget.Entry({
        on_accept: (self) => opt2.value = self.text,
        setup: (self) => self.hook(opt2, () => self.text = opt2.value)
      });
    case "enum":
      return EnumSetter(opt2, enums);
    case "boolean":
      return Widget.Switch().on("notify::active", (self) => opt2.value = self.active).hook(opt2, (self) => self.active = opt2.value);
    case "img":
      return Widget.FileChooserButton({
        on_file_set: ({ uri }) => {
          opt2.value = uri.replace("file://", "");
        }
      });
    case "font":
      return Widget.FontButton({
        show_size: false,
        use_size: false,
        setup: (self) => self.hook(opt2, () => self.font = opt2.value).on("font-set", ({ font }) => opt2.value = font.split(" ").slice(0, -1).join(" "))
      });
    case "color":
      return Widget.ColorButton().hook(opt2, (self) => {
        const rgba2 = new Gdk12.RGBA;
        rgba2.parse(opt2.value);
        self.rgba = rgba2;
      }).on("color-set", ({ rgba: { red, green, blue } }) => {
        const hex = (n2) => {
          const c = Math.floor(255 * n2).toString(16);
          return c.length === 1 ? `0${c}` : c;
        };
        opt2.value = `#${hex(red)}${hex(green)}${hex(blue)}`;
      });
    default:
      return Widget.Label({
        label: `no setter with type ${type}`
      });
  }
}

// widget/settings/Row.ts
var Row_default = (props) => Widget.Box({
  attribute: { opt: props.opt },
  class_name: "row",
  tooltip_text: props.note ? `note: ${props.note}` : ""
}, Widget.Box({ vertical: true, vpack: "center" }, Widget.Label({
  xalign: 0,
  class_name: "row-title",
  label: props.title
}), Widget.Label({
  xalign: 0,
  class_name: "id",
  label: props.opt.id
})), Widget.Box({ hexpand: true }), Widget.Box({ vpack: "center" }, Setter(props)), Widget.Button({
  vpack: "center",
  class_name: "reset",
  child: Widget.Icon(icons_default.ui.refresh),
  on_clicked: () => props.opt.reset(),
  sensitive: props.opt.bind().as((v) => v !== props.opt.initial)
}));

// widget/settings/Group.ts
var Group_default = (title, ...rows) => Widget.Box({
  class_name: "group",
  vertical: true
}, Widget.Box([
  Widget.Label({
    hpack: "start",
    vpack: "end",
    class_name: "group-title",
    label: title,
    setup: (w) => Utils.idle(() => w.visible = !!title)
  }),
  title ? Widget.Button({
    hexpand: true,
    hpack: "end",
    child: Widget.Icon(icons_default.ui.refresh),
    class_name: "group-reset",
    sensitive: Utils.merge(rows.map(({ attribute: { opt: opt2 } }) => opt2.bind().as((v) => v !== opt2.initial)), (...values) => values.some((b) => b)),
    on_clicked: () => rows.forEach((row) => row.attribute.opt.reset())
  }) : Widget.Box()
]), Widget.Box({
  vertical: true,
  children: rows
}));

// widget/settings/Page.ts
var Page_default = (name, icon3, ...groups) => Widget.Box({
  class_name: "page",
  attribute: { name, icon: icon3 },
  child: Widget.Scrollable({
    css: "min-height: 300px;",
    child: Widget.Box({
      class_name: "page-content",
      vexpand: true,
      vertical: true,
      children: groups
    })
  })
});

// widget/settings/Wallpaper.ts
var Wallpaper_default = () => Widget.Box({ class_name: "row wallpaper" }, Widget.Box({ vertical: true }, Widget.Label({
  xalign: 0,
  class_name: "row-title",
  label: "Wallpaper",
  vpack: "start"
}), Widget.Button({
  on_clicked: wallpaper_default.random,
  label: "Random"
}), Widget.FileChooserButton({
  on_file_set: ({ uri }) => wallpaper_default.set(uri.replace("file://", ""))
})), Widget.Box({ hexpand: true }), Widget.Box({
  class_name: "preview",
  css: wallpaper_default.bind("wallpaper").as((wp) => `
            min-height: 120px;
            min-width: 200px;
            background-image: url('${wp}');
            background-size: cover;
        `)
}));

// widget/settings/layout.ts
var {
  autotheme: at,
  font,
  theme,
  bar: b,
  launcher: l,
  overview: ov,
  powermenu: pm,
  quicksettings: qs,
  osd,
  hyprland: h
} = options_default;
var {
  dark: dark2,
  light: light2,
  blur: blur3,
  scheme: scheme3,
  padding: padding2,
  spacing: spacing3,
  radius: radius3,
  shadows: shadows3,
  widget: widget3,
  border: border2
} = theme;
var layout_default = [
  Page_default("Theme", icons_default.ui.themes, Group_default("", Wallpaper_default(), Row_default({ opt: at, title: "Auto Generate Color Scheme" }), Row_default({ opt: scheme3, title: "Color Scheme", type: "enum", enums: ["dark", "light"] })), Group_default("Dark Colors", Row_default({ opt: dark2.bg, title: "Background", type: "color" }), Row_default({ opt: dark2.fg, title: "Foreground", type: "color" }), Row_default({ opt: dark2.primary.bg, title: "Primary", type: "color" }), Row_default({ opt: dark2.primary.fg, title: "On Primary", type: "color" }), Row_default({ opt: dark2.error.bg, title: "Error", type: "color" }), Row_default({ opt: dark2.error.fg, title: "On Error", type: "color" }), Row_default({ opt: dark2.widget, title: "Widget", type: "color" }), Row_default({ opt: dark2.border, title: "Border", type: "color" })), Group_default("Light Colors", Row_default({ opt: light2.bg, title: "Background", type: "color" }), Row_default({ opt: light2.fg, title: "Foreground", type: "color" }), Row_default({ opt: light2.primary.bg, title: "Primary", type: "color" }), Row_default({ opt: light2.primary.fg, title: "On Primary", type: "color" }), Row_default({ opt: light2.error.bg, title: "Error", type: "color" }), Row_default({ opt: light2.error.fg, title: "On Error", type: "color" }), Row_default({ opt: light2.widget, title: "Widget", type: "color" }), Row_default({ opt: light2.border, title: "Border", type: "color" })), Group_default("Theme", Row_default({ opt: shadows3, title: "Shadows" }), Row_default({ opt: widget3.opacity, title: "Widget Opacity", max: 100 }), Row_default({ opt: border2.opacity, title: "Border Opacity", max: 100 }), Row_default({ opt: border2.width, title: "Border Width" }), Row_default({ opt: blur3, title: "Blur", note: "0 to disable", max: 70 })), Group_default("UI", Row_default({ opt: padding2, title: "Padding" }), Row_default({ opt: spacing3, title: "Spacing" }), Row_default({ opt: radius3, title: "Roundness" }), Row_default({ opt: font.size, title: "Font Size" }), Row_default({ opt: font.name, title: "Font Name", type: "font" }))),
  Page_default("Bar", icons_default.ui.toolbars, Group_default("General", Row_default({ opt: b.transparent, title: "Transparent Bar", note: "Works best on empty-ish wallpapers" }), Row_default({ opt: b.flatButtons, title: "Flat Buttons" }), Row_default({ opt: b.position, title: "Position", type: "enum", enums: ["top", "bottom"] }), Row_default({ opt: b.corners, title: "Corners" })), Group_default("Launcher", Row_default({ opt: b.launcher.icon.icon, title: "Icon" }), Row_default({ opt: b.launcher.icon.colored, title: "Colored Icon" }), Row_default({ opt: b.launcher.label.label, title: "Label" }), Row_default({ opt: b.launcher.label.colored, title: "Colored Label" })), Group_default("Workspaces", Row_default({ opt: b.workspaces.workspaces, title: "Number of Workspaces", note: "0 to make it dynamic" })), Group_default("Taskbar", Row_default({ opt: b.taskbar.iconSize, title: "Icon Size" }), Row_default({ opt: b.taskbar.monochrome, title: "Monochrome" }), Row_default({ opt: b.taskbar.exclusive, title: "Exclusive to workspaces" })), Group_default("Date", Row_default({ opt: b.date.format, title: "Date Format" })), Group_default("Media", Row_default({ opt: b.media.monochrome, title: "Monochrome" }), Row_default({ opt: b.media.preferred, title: "Preferred Player" }), Row_default({ opt: b.media.direction, title: "Slide Direction", type: "enum", enums: ["left", "right"] }), Row_default({ opt: b.media.format, title: "Format of the Label" }), Row_default({ opt: b.media.length, title: "Max Length of Label" })), Group_default("Battery", Row_default({ opt: b.battery.bar, title: "Style", type: "enum", enums: ["hidden", "regular", "whole"] }), Row_default({ opt: b.battery.blocks, title: "Number of Blocks" }), Row_default({ opt: b.battery.width, title: "Width of Bar" }), Row_default({ opt: b.battery.charging, title: "Charging Color", type: "color" })), Group_default("Powermenu", Row_default({ opt: b.powermenu.monochrome, title: "Monochrome" }))),
  Page_default("General", icons_default.ui.settings, Group_default("Hyprland", Row_default({ opt: h.gapsWhenOnly, title: "Gaps When Only" }), Row_default({ opt: h.inactiveBorder, type: "color", title: "Inactive Border Color" })), Group_default("Launcher", Row_default({ opt: l.width, title: "Width" }), Row_default({ opt: l.apps.iconSize, title: "Icon Size" }), Row_default({ opt: l.apps.max, title: "Max Items" })), Group_default("Overview", Row_default({ opt: ov.scale, title: "Scale", max: 100 }), Row_default({ opt: ov.workspaces, title: "Workspaces", max: 11, note: "set this to 0 to make it dynamic" }), Row_default({ opt: ov.monochromeIcon, title: "Monochrome Icons" })), Group_default("Powermenu", Row_default({ opt: pm.layout, title: "Layout", type: "enum", enums: ["box", "line"] }), Row_default({ opt: pm.labels, title: "Show Labels" })), Group_default("Quicksettings", Row_default({ opt: qs.avatar.image, title: "Avatar", type: "img" }), Row_default({ opt: qs.avatar.size, title: "Avatar Size" }), Row_default({ opt: qs.media.monochromeIcon, title: "Media Monochrome Icons" }), Row_default({ opt: qs.media.coverSize, title: "Media Cover Art Size" })), Group_default("On Screen Indicator", Row_default({ opt: osd.progress.vertical, title: "Vertical" }), Row_default({ opt: osd.progress.pack.h, title: "Horizontal Alignment", type: "enum", enums: ["start", "center", "end"] }), Row_default({ opt: osd.progress.pack.v, title: "Vertical Alignment", type: "enum", enums: ["start", "center", "end"] })))
];

// widget/settings/SettingsDialog.ts
var current = Variable(layout_default[0].attribute.name);
var Header = () => Widget.CenterBox({
  class_name: "header",
  start_widget: Widget.Button({
    class_name: "reset",
    on_clicked: options_default.reset,
    hpack: "start",
    vpack: "start",
    child: Widget.Icon(icons_default.ui.refresh),
    tooltip_text: "Reset"
  }),
  center_widget: Widget.Box({
    class_name: "pager horizontal",
    children: layout_default.map(({ attribute: { name, icon: icon3 } }) => Widget.Button({
      xalign: 0,
      class_name: current.bind().as((v) => `${v === name ? "active" : ""}`),
      on_clicked: () => current.value = name,
      child: Widget.Box([
        Widget.Icon(icon3),
        Widget.Label(name)
      ])
    }))
  }),
  end_widget: Widget.Button({
    class_name: "close",
    hpack: "end",
    vpack: "start",
    child: Widget.Icon(icons_default.ui.close),
    on_clicked: () => App.closeWindow("settings-dialog")
  })
});
var PagesStack = () => Widget.Stack({
  transition: "slide_left_right",
  children: layout_default.reduce((obj, page) => ({ ...obj, [page.attribute.name]: page }), {}),
  shown: current.bind()
});
var SettingsDialog_default = () => RegularWindow_default({
  name: "settings-dialog",
  class_name: "settings-dialog",
  title: "Settings",
  setup(win) {
    win.on("delete-event", () => {
      win.hide();
      return true;
    });
    win.set_default_size(500, 600);
  },
  child: Widget.Box({
    vertical: true,
    children: [
      Header(),
      PagesStack()
    ]
  })
});

// widget/powermenu/Verification.ts
var Verification_default = () => PopupWindow_default({
  name: "verification",
  transition: "crossfade",
  child: Widget.Box({
    class_name: "verification",
    vertical: true,
    children: [
      Widget.Box({
        class_name: "text-box",
        vertical: true,
        children: [
          Widget.Label({
            class_name: "title",
            label: powermenu_default.bind("title")
          }),
          Widget.Label({
            class_name: "desc",
            label: "Are you sure?"
          })
        ]
      }),
      Widget.Box({
        class_name: "buttons horizontal",
        vexpand: true,
        vpack: "end",
        homogeneous: true,
        children: [
          Widget.Button({
            child: Widget.Label("No"),
            on_clicked: () => App.toggleWindow("verification"),
            setup: (self) => self.hook(App, (_, name, visible) => {
              if (name === "verification" && visible)
                self.grab_focus();
            })
          }),
          Widget.Button({
            child: Widget.Label("Yes"),
            on_clicked: powermenu_default.exec
          })
        ]
      })
    ]
  })
});

// widget/quicksettings/ToggleButton.ts
var opened = Variable("");
App.connect("window-toggled", (_, name, visible) => {
  if (name === "quicksettings" && !visible)
    Utils.timeout(500, () => opened.value = "");
});
var Arrow = (name, activate) => {
  let deg = 0;
  let iconOpened = false;
  const icon3 = Widget.Icon(icons_default.ui.arrow.right).hook(opened, () => {
    if (opened.value === name && !iconOpened || opened.value !== name && iconOpened) {
      const step = opened.value === name ? 10 : -10;
      iconOpened = !iconOpened;
      for (let i = 0;i < 9; ++i) {
        Utils.timeout(15 * i, () => {
          deg += step;
          icon3.setCss(`-gtk-icon-transform: rotate(${deg}deg);`);
        });
      }
    }
  });
  return Widget.Button({
    child: icon3,
    class_name: "arrow",
    on_clicked: () => {
      opened.value = opened.value === name ? "" : name;
      if (typeof activate === "function")
        activate();
    }
  });
};
var ArrowToggleButton = ({
  name,
  icon: icon3,
  label: label2,
  activate,
  deactivate,
  activateOnArrow = true,
  connection: [service, condition]
}) => Widget.Box({
  class_name: "toggle-button",
  setup: (self) => self.hook(service, () => {
    self.toggleClassName("active", condition());
  }),
  children: [
    Widget.Button({
      child: Widget.Box({
        hexpand: true,
        children: [
          Widget.Icon({
            class_name: "icon",
            icon: icon3
          }),
          Widget.Label({
            class_name: "label",
            max_width_chars: 10,
            truncate: "end",
            label: label2
          })
        ]
      }),
      on_clicked: () => {
        if (condition()) {
          deactivate();
          if (opened.value === name)
            opened.value = "";
        } else {
          activate();
        }
      }
    }),
    Arrow(name, activateOnArrow && activate)
  ]
});
var Menu = ({ name, icon: icon3, title, content }) => Widget.Revealer({
  transition: "slide_down",
  reveal_child: opened.bind().as((v) => v === name),
  child: Widget.Box({
    class_names: ["menu", name],
    vertical: true,
    children: [
      Widget.Box({
        class_name: "title-box",
        children: [
          Widget.Icon({
            class_name: "icon",
            icon: icon3
          }),
          Widget.Label({
            class_name: "title",
            truncate: "end",
            label: title
          })
        ]
      }),
      Widget.Separator(),
      Widget.Box({
        vertical: true,
        class_name: "content vertical",
        children: content
      })
    ]
  })
});
var SimpleToggleButton = ({
  icon: icon3,
  label: label2,
  toggle,
  connection: [service, condition]
}) => Widget.Button({
  on_clicked: toggle,
  class_name: "simple-toggle",
  setup: (self) => self.hook(service, () => {
    self.toggleClassName("active", condition());
  }),
  child: Widget.Box([
    Widget.Icon({ icon: icon3 }),
    Widget.Label({
      max_width_chars: 10,
      truncate: "end",
      label: label2
    })
  ])
});

// widget/quicksettings/widgets/PowerProfile.ts
var asusprof = asusctl_default.bind("profile");
var AsusProfileToggle = () => ArrowToggleButton({
  name: "asusctl-profile",
  icon: asusprof.as((p) => icons_default.asusctl.profile[p]),
  label: asusprof,
  connection: [asusctl_default, () => asusctl_default.profile !== "Balanced"],
  activate: () => asusctl_default.setProfile("Quiet"),
  deactivate: () => asusctl_default.setProfile("Balanced"),
  activateOnArrow: false
});
var AsusProfileSelector = () => Menu({
  name: "asusctl-profile",
  icon: asusprof.as((p) => icons_default.asusctl.profile[p]),
  title: "Profile Selector",
  content: [
    Widget.Box({
      vertical: true,
      hexpand: true,
      children: [
        Widget.Box({
          vertical: true,
          children: asusctl_default.profiles.map((prof) => Widget.Button({
            on_clicked: () => asusctl_default.setProfile(prof),
            child: Widget.Box({
              children: [
                Widget.Icon(icons_default.asusctl.profile[prof]),
                Widget.Label(prof)
              ]
            })
          }))
        })
      ]
    }),
    Widget.Separator(),
    Widget.Button({
      on_clicked: () => Utils.execAsync("rog-control-center"),
      child: Widget.Box({
        children: [
          Widget.Icon(icons_default.ui.settings),
          Widget.Label("Rog Control Center")
        ]
      })
    })
  ]
});
var pp = await Service.import("powerprofiles");
var profile = pp.bind("active_profile");
var profiles = pp.profiles.map((p) => p.Profile);
var pretty = (str) => str.split("-").map((str2) => `${str2.at(0)?.toUpperCase()}${str2.slice(1)}`).join(" ");
var PowerProfileToggle = () => ArrowToggleButton({
  name: "asusctl-profile",
  icon: profile.as((p) => icons_default.powerprofile[p]),
  label: profile.as(pretty),
  connection: [pp, () => pp.active_profile !== profiles[1]],
  activate: () => pp.active_profile = profiles[0],
  deactivate: () => pp.active_profile = profiles[1],
  activateOnArrow: false
});
var PowerProfileSelector = () => Menu({
  name: "asusctl-profile",
  icon: profile.as((p) => icons_default.powerprofile[p]),
  title: "Profile Selector",
  content: [Widget.Box({
    vertical: true,
    hexpand: true,
    child: Widget.Box({
      vertical: true,
      children: profiles.map((prof) => Widget.Button({
        on_clicked: () => pp.active_profile = prof,
        child: Widget.Box({
          children: [
            Widget.Icon(icons_default.powerprofile[prof]),
            Widget.Label(pretty(prof))
          ]
        })
      }))
    })
  })]
});
var ProfileToggle = asusctl_default.available ? AsusProfileToggle : PowerProfileToggle;
var ProfileSelector = asusctl_default.available ? AsusProfileSelector : PowerProfileSelector;

// widget/quicksettings/widgets/Header.ts
function up(up2) {
  const h2 = Math.floor(up2 / 60);
  const m = Math.floor(up2 % 60);
  return `${h2}h ${m < 10 ? "0" + m : m}m`;
}
var battery3 = await Service.import("battery");
var { image, size: size2 } = options_default.quicksettings.avatar;
var Avatar = () => Widget.Box({
  class_name: "avatar",
  css: Utils.merge([image.bind(), size2.bind()], (img, size3) => `
        min-width: ${size3}px;
        min-height: ${size3}px;
        background-image: url('${img}');
        background-size: cover;
    `)
});
var SysButton2 = (action5) => Widget.Button({
  vpack: "center",
  child: Widget.Icon(icons_default.powermenu[action5]),
  on_clicked: () => powermenu_default.action(action5)
});
var Header2 = () => Widget.Box({ class_name: "header horizontal" }, Avatar(), Widget.Box({
  vertical: true,
  vpack: "center",
  children: [
    Widget.Box({
      visible: battery3.bind("available"),
      children: [
        Widget.Icon({ icon: battery3.bind("icon_name") }),
        Widget.Label({ label: battery3.bind("percent").as((p) => `${p}%`) })
      ]
    }),
    Widget.Box([
      Widget.Icon({ icon: icons_default.ui.time }),
      Widget.Label({ label: uptime.bind().as(up) })
    ])
  ]
}), Widget.Box({ hexpand: true }), Widget.Button({
  vpack: "center",
  child: Widget.Icon(icons_default.ui.settings),
  on_clicked: () => {
    App.closeWindow("quicksettings");
    App.closeWindow("settings-dialog");
    App.openWindow("settings-dialog");
  }
}), SysButton2("logout"), SysButton2("shutdown"));

// widget/quicksettings/widgets/Volume.ts
var audio3 = await Service.import("audio");
var VolumeIndicator = (type = "speaker") => Widget.Button({
  vpack: "center",
  on_clicked: () => audio3[type].is_muted = !audio3[type].is_muted,
  child: Widget.Icon({
    icon: audio3[type].bind("icon_name").as((i) => icon(i || "", icons_default.audio.mic.high)),
    tooltipText: audio3[type].bind("volume").as((vol) => `Volume: ${Math.floor(vol * 100)}%`)
  })
});
var VolumeSlider = (type = "speaker") => Widget.Slider({
  hexpand: true,
  draw_value: false,
  on_change: ({ value, dragging }) => {
    if (dragging) {
      audio3[type].volume = value;
      audio3[type].is_muted = false;
    }
  },
  value: audio3[type].bind("volume"),
  class_name: audio3[type].bind("is_muted").as((m) => m ? "muted" : "")
});
var Volume = () => Widget.Box({
  class_name: "volume",
  children: [
    VolumeIndicator("speaker"),
    VolumeSlider("speaker"),
    Widget.Box({
      vpack: "center",
      child: Arrow("sink-selector")
    }),
    Widget.Box({
      vpack: "center",
      child: Arrow("app-mixer"),
      visible: audio3.bind("apps").as((a) => a.length > 0)
    })
  ]
});
var Microphone = () => Widget.Box({
  class_name: "slider horizontal",
  visible: audio3.bind("recorders").as((a) => a.length > 0),
  children: [
    VolumeIndicator("microphone"),
    VolumeSlider("microphone")
  ]
});
var MixerItem = (stream) => Widget.Box({
  hexpand: true,
  class_name: "mixer-item horizontal"
}, Widget.Icon({
  tooltip_text: stream.bind("name").as((n2) => n2 || ""),
  icon: stream.bind("name").as((n2) => {
    return Utils.lookUpIcon(n2 || "") ? n2 || "" : icons_default.fallback.audio;
  })
}), Widget.Box({ vertical: true }, Widget.Label({
  xalign: 0,
  truncate: "end",
  max_width_chars: 28,
  label: stream.bind("description").as((d) => d || "")
}), Widget.Slider({
  hexpand: true,
  draw_value: false,
  value: stream.bind("volume"),
  on_change: ({ value }) => stream.volume = value
})));
var SinkItem = (stream) => Widget.Button({
  hexpand: true,
  on_clicked: () => audio3.speaker = stream,
  child: Widget.Box({
    children: [
      Widget.Icon({
        icon: icon(stream.icon_name || "", icons_default.fallback.audio),
        tooltip_text: stream.icon_name || ""
      }),
      Widget.Label((stream.description || "").split(" ").slice(0, 4).join(" ")),
      Widget.Icon({
        icon: icons_default.ui.tick,
        hexpand: true,
        hpack: "end",
        visible: audio3.speaker.bind("stream").as((s) => s === stream.stream)
      })
    ]
  })
});
var SettingsButton = () => Widget.Button({
  on_clicked: () => {
    if (dependencies("pavucontrol"))
      sh("pavucontrol");
  },
  hexpand: true,
  child: Widget.Box({
    children: [
      Widget.Icon(icons_default.ui.settings),
      Widget.Label("Settings")
    ]
  })
});
var AppMixer = () => Menu({
  name: "app-mixer",
  icon: icons_default.audio.mixer,
  title: "App Mixer",
  content: [
    Widget.Box({
      vertical: true,
      class_name: "vertical mixer-item-box",
      children: audio3.bind("apps").as((a) => a.map(MixerItem))
    }),
    Widget.Separator(),
    SettingsButton()
  ]
});
var SinkSelector = () => Menu({
  name: "sink-selector",
  icon: icons_default.audio.type.headset,
  title: "Sink Selector",
  content: [
    Widget.Box({
      vertical: true,
      children: audio3.bind("speakers").as((a) => a.map(SinkItem))
    }),
    Widget.Separator(),
    SettingsButton()
  ]
});

// widget/quicksettings/widgets/Brightness.ts
var BrightnessSlider = () => Widget.Slider({
  draw_value: false,
  hexpand: true,
  value: brightness_default.bind("screen"),
  on_change: ({ value }) => brightness_default.screen = value
});
var Brightness2 = () => Widget.Box({
  class_name: "brightness",
  children: [
    Widget.Button({
      vpack: "center",
      child: Widget.Icon(icons_default.brightness.indicator),
      on_clicked: () => brightness_default.screen = 0,
      tooltip_text: brightness_default.bind("screen").as((v) => `Screen Brightness: ${Math.floor(v * 100)}%`)
    }),
    BrightnessSlider()
  ]
});

// widget/quicksettings/widgets/Network.ts
var { wifi } = await Service.import("network");
var NetworkToggle = () => ArrowToggleButton({
  name: "network",
  icon: wifi.bind("icon_name"),
  label: wifi.bind("ssid").as((ssid) => ssid || "Not Connected"),
  connection: [wifi, () => wifi.enabled],
  deactivate: () => wifi.enabled = false,
  activate: () => {
    wifi.enabled = true;
    wifi.scan();
  }
});
var WifiSelection = () => Menu({
  name: "network",
  icon: wifi.bind("icon_name"),
  title: "Wifi Selection",
  content: [
    Widget.Box({
      vertical: true,
      setup: (self) => self.hook(wifi, () => self.children = wifi.access_points.sort((a, b2) => b2.strength - a.strength).slice(0, 10).map((ap) => Widget.Button({
        on_clicked: () => {
          if (dependencies("nmcli"))
            Utils.execAsync(`nmcli device wifi connect ${ap.bssid}`);
        },
        child: Widget.Box({
          children: [
            Widget.Icon(ap.iconName),
            Widget.Label(ap.ssid || ""),
            Widget.Icon({
              icon: icons_default.ui.tick,
              hexpand: true,
              hpack: "end",
              setup: (self2) => Utils.idle(() => {
                if (!self2.is_destroyed)
                  self2.visible = ap.active;
              })
            })
          ]
        })
      })))
    }),
    Widget.Separator(),
    Widget.Button({
      on_clicked: () => sh(options_default.quicksettings.networkSettings.value),
      child: Widget.Box({
        children: [
          Widget.Icon(icons_default.ui.settings),
          Widget.Label("Network")
        ]
      })
    })
  ]
});

// widget/quicksettings/widgets/Bluetooth.ts
var bluetooth2 = await Service.import("bluetooth");
var BluetoothToggle = () => ArrowToggleButton({
  name: "bluetooth",
  icon: bluetooth2.bind("enabled").as((p) => icons_default.bluetooth[p ? "enabled" : "disabled"]),
  label: Utils.watch("Disabled", bluetooth2, () => {
    if (!bluetooth2.enabled)
      return "Disabled";
    if (bluetooth2.connected_devices.length === 1)
      return bluetooth2.connected_devices[0].alias;
    return `${bluetooth2.connected_devices.length} Connected`;
  }),
  connection: [bluetooth2, () => bluetooth2.enabled],
  deactivate: () => bluetooth2.enabled = false,
  activate: () => bluetooth2.enabled = true
});
var DeviceItem = (device) => Widget.Box({
  children: [
    Widget.Icon(device.icon_name + "-symbolic"),
    Widget.Label(device.name),
    Widget.Label({
      label: `${device.battery_percentage}%`,
      visible: device.bind("battery_percentage").as((p) => p > 0)
    }),
    Widget.Box({ hexpand: true }),
    Widget.Spinner({
      active: device.bind("connecting"),
      visible: device.bind("connecting")
    }),
    Widget.Switch({
      active: device.connected,
      visible: device.bind("connecting").as((p) => !p),
      setup: (self) => self.on("notify::active", () => {
        device.setConnection(self.active);
      })
    })
  ]
});
var BluetoothDevices = () => Menu({
  name: "bluetooth",
  icon: icons_default.bluetooth.disabled,
  title: "Bluetooth",
  content: [
    Widget.Box({
      class_name: "bluetooth-devices",
      hexpand: true,
      vertical: true,
      children: bluetooth2.bind("devices").as((ds) => ds.filter((d) => d.name).map(DeviceItem))
    })
  ]
});

// widget/quicksettings/widgets/DND.ts
var n2 = await Service.import("notifications");
var dnd = n2.bind("dnd");
var DND = () => SimpleToggleButton({
  icon: dnd.as((dnd2) => icons_default.notifications[dnd2 ? "silent" : "noisy"]),
  label: dnd.as((dnd2) => dnd2 ? "Silent" : "Noisy"),
  toggle: () => n2.dnd = !n2.dnd,
  connection: [n2, () => n2.dnd]
});

// widget/quicksettings/widgets/DarkMode.ts
var { scheme: scheme4 } = options_default.theme;
var DarkModeToggle = () => SimpleToggleButton({
  icon: scheme4.bind().as((s) => icons_default.color[s]),
  label: scheme4.bind().as((s) => s === "dark" ? "Dark" : "Light"),
  toggle: () => scheme4.value = scheme4.value === "dark" ? "light" : "dark",
  connection: [scheme4, () => scheme4.value === "dark"]
});

// widget/quicksettings/widgets/MicMute.ts
var { microphone: microphone2 } = await Service.import("audio");
var icon3 = () => microphone2.is_muted || microphone2.stream?.is_muted ? icons_default.audio.mic.muted : icons_default.audio.mic.high;
var label2 = () => microphone2.is_muted || microphone2.stream?.is_muted ? "Muted" : "Unmuted";
var MicMute = () => SimpleToggleButton({
  icon: Utils.watch(icon3(), microphone2, icon3),
  label: Utils.watch(label2(), microphone2, label2),
  toggle: () => microphone2.is_muted = !microphone2.is_muted,
  connection: [microphone2, () => microphone2?.is_muted || false]
});

// widget/quicksettings/widgets/Media.ts
function lengthStr(length2) {
  const min = Math.floor(length2 / 60);
  const sec = Math.floor(length2 % 60);
  const sec0 = sec < 10 ? "0" : "";
  return `${min}:${sec0}${sec}`;
}
var mpris2 = await Service.import("mpris");
var players = mpris2.bind("players");
var { media } = options_default.quicksettings;
var Player = (player) => {
  const cover = Widget.Box({
    class_name: "cover",
    vpack: "start",
    css: Utils.merge([
      player.bind("cover_path"),
      player.bind("track_cover_url"),
      media.coverSize.bind()
    ], (path, url, size3) => `
            min-width: ${size3}px;
            min-height: ${size3}px;
            background-image: url('${path || url}');
        `)
  });
  const title = Widget.Label({
    class_name: "title",
    max_width_chars: 20,
    truncate: "end",
    hpack: "start",
    label: player.bind("track_title")
  });
  const artist = Widget.Label({
    class_name: "artist",
    max_width_chars: 20,
    truncate: "end",
    hpack: "start",
    label: player.bind("track_artists").as((a) => a.join(", "))
  });
  const positionSlider = Widget.Slider({
    class_name: "position",
    draw_value: false,
    on_change: ({ value }) => player.position = value * player.length,
    setup: (self) => {
      const update = () => {
        const { length: length2, position: position4 } = player;
        self.visible = length2 > 0;
        self.value = length2 > 0 ? position4 / length2 : 0;
      };
      self.hook(player, update);
      self.hook(player, update, "position");
      self.poll(1000, update);
    }
  });
  const positionLabel = Widget.Label({
    class_name: "position",
    hpack: "start",
    setup: (self) => {
      const update = (_, time3) => {
        self.label = lengthStr(time3 || player.position);
        self.visible = player.length > 0;
      };
      self.hook(player, update, "position");
      self.poll(1000, update);
    }
  });
  const lengthLabel = Widget.Label({
    class_name: "length",
    hpack: "end",
    visible: player.bind("length").as((l2) => l2 > 0),
    label: player.bind("length").as(lengthStr)
  });
  const playericon = Widget.Icon({
    class_name: "icon",
    hexpand: true,
    hpack: "end",
    vpack: "start",
    tooltip_text: player.identity || "",
    icon: Utils.merge([player.bind("entry"), media.monochromeIcon.bind()], (e, s) => {
      const name = `${e}${s ? "-symbolic" : ""}`;
      return icon(name, icons_default.fallback.audio);
    })
  });
  const playPause = Widget.Button({
    class_name: "play-pause",
    on_clicked: () => player.playPause(),
    visible: player.bind("can_play"),
    child: Widget.Icon({
      icon: player.bind("play_back_status").as((s) => {
        switch (s) {
          case "Playing":
            return icons_default.mpris.playing;
          case "Paused":
          case "Stopped":
            return icons_default.mpris.stopped;
        }
      })
    })
  });
  const prev = Widget.Button({
    on_clicked: () => player.previous(),
    visible: player.bind("can_go_prev"),
    child: Widget.Icon(icons_default.mpris.prev)
  });
  const next = Widget.Button({
    on_clicked: () => player.next(),
    visible: player.bind("can_go_next"),
    child: Widget.Icon(icons_default.mpris.next)
  });
  return Widget.Box({ class_name: "player", vexpand: false }, cover, Widget.Box({ vertical: true }, Widget.Box([
    title,
    playericon
  ]), artist, Widget.Box({ vexpand: true }), positionSlider, Widget.CenterBox({
    class_name: "footer horizontal",
    start_widget: positionLabel,
    center_widget: Widget.Box([
      prev,
      playPause,
      next
    ]),
    end_widget: lengthLabel
  })));
};
var Media2 = () => Widget.Box({
  vertical: true,
  class_name: "media vertical",
  children: players.as((p) => p.map(Player))
});

// widget/quicksettings/QuickSettings.ts
function setupQuickSettings() {
  App.addWindow(QuickSettings());
  layout3.connect("changed", () => {
    App.removeWindow("quicksettings");
    App.addWindow(QuickSettings());
  });
}
var { bar: bar2, quicksettings } = options_default;
var media2 = (await Service.import("mpris")).bind("players");
var layout3 = Utils.derive([bar2.position, quicksettings.position], (bar3, qs2) => `${bar3}-${qs2}`);
var Row2 = (toggles = [], menus = []) => Widget.Box({
  vertical: true,
  children: [
    Widget.Box({
      homogeneous: true,
      class_name: "row horizontal",
      children: toggles.map((w) => w())
    }),
    ...menus.map((w) => w())
  ]
});
var Settings = () => Widget.Box({
  vertical: true,
  class_name: "quicksettings vertical",
  css: quicksettings.width.bind().as((w) => `min-width: ${w}px;`),
  children: [
    Header2(),
    Widget.Box({
      class_name: "sliders-box vertical",
      vertical: true,
      children: [
        Row2([Volume], [SinkSelector, AppMixer]),
        Microphone(),
        Brightness2()
      ]
    }),
    Row2([NetworkToggle, BluetoothToggle], [WifiSelection, BluetoothDevices]),
    Row2([ProfileToggle, DarkModeToggle], [ProfileSelector]),
    Row2([MicMute, DND]),
    Widget.Box({
      visible: media2.as((l2) => l2.length > 0),
      child: Media2()
    })
  ]
});
var QuickSettings = () => PopupWindow_default({
  name: "quicksettings",
  exclusivity: "exclusive",
  transition: bar2.position.bind().as((pos) => pos === "top" ? "slide_down" : "slide_up"),
  layout: layout3.value,
  child: Settings()
});

// widget/datemenu/NotificationColumn.ts
var notifications4 = await Service.import("notifications");
var notifs3 = notifications4.bind("notifications");
var Animated2 = (n3) => Widget.Revealer({
  transition_duration: options_default.transition.value,
  transition: "slide_down",
  child: Notification_default(n3),
  setup: (self) => Utils.timeout(options_default.transition.value, () => {
    if (!self.is_destroyed)
      self.reveal_child = true;
  })
});
var ClearButton = () => Widget.Button({
  on_clicked: notifications4.clear,
  sensitive: notifs3.as((n3) => n3.length > 0),
  child: Widget.Box({
    children: [
      Widget.Label("Clear "),
      Widget.Icon({
        icon: notifs3.as((n3) => icons_default.trash[n3.length > 0 ? "full" : "empty"])
      })
    ]
  })
});
var Header4 = () => Widget.Box({
  class_name: "header",
  children: [
    Widget.Label({ label: "Notifications", hexpand: true, xalign: 0 }),
    ClearButton()
  ]
});
var NotificationList = () => {
  const map = new Map;
  const box = Widget.Box({
    vertical: true,
    children: notifications4.notifications.map((n3) => {
      const w = Animated2(n3);
      map.set(n3.id, w);
      return w;
    }),
    visible: notifs3.as((n3) => n3.length > 0)
  });
  function remove(_, id) {
    const n3 = map.get(id);
    if (n3) {
      n3.reveal_child = false;
      Utils.timeout(options_default.transition.value, () => {
        n3.destroy();
        map.delete(id);
      });
    }
  }
  return box.hook(notifications4, remove, "closed").hook(notifications4, (_, id) => {
    if (id !== undefined) {
      if (map.has(id))
        remove(null, id);
      const n3 = notifications4.getNotification(id);
      const w = Animated2(n3);
      map.set(id, w);
      box.children = [w, ...box.children];
    }
  }, "notified");
};
var Placeholder = () => Widget.Box({
  class_name: "placeholder",
  vertical: true,
  vpack: "center",
  hpack: "center",
  vexpand: true,
  hexpand: true,
  visible: notifs3.as((n3) => n3.length === 0),
  children: [
    Widget.Icon(icons_default.notifications.silent),
    Widget.Label("Your inbox is empty")
  ]
});
var NotificationColumn_default = () => Widget.Box({
  class_name: "notifications",
  css: options_default.notifications.width.bind().as((w) => `min-width: ${w}px`),
  vertical: true,
  children: [
    Header4(),
    Widget.Scrollable({
      vexpand: true,
      hscroll: "never",
      class_name: "notification-scrollable",
      child: Widget.Box({
        class_name: "notification-list vertical",
        vertical: true,
        children: [
          NotificationList(),
          Placeholder()
        ]
      })
    })
  ]
});

// widget/datemenu/DateColumn.ts
function up2(up3) {
  const h2 = Math.floor(up3 / 60);
  const m = Math.floor(up3 % 60);
  return `uptime: ${h2}:${m < 10 ? "0" + m : m}`;
}
var DateColumn_default = () => Widget.Box({
  vertical: true,
  class_name: "date-column vertical",
  children: [
    Widget.Box({
      class_name: "clock-box",
      vertical: true,
      children: [
        Widget.Label({
          class_name: "clock",
          label: clock.bind().as((t2) => t2.format("%H:%M"))
        }),
        Widget.Label({
          class_name: "uptime",
          label: uptime.bind().as(up2)
        })
      ]
    }),
    Widget.Box({
      class_name: "calendar",
      children: [
        Widget.Calendar({
          hexpand: true,
          hpack: "center"
        })
      ]
    })
  ]
});

// widget/datemenu/DateMenu.ts
function setupDateMenu() {
  App.addWindow(DateMenu());
  layout4.connect("changed", () => {
    App.removeWindow("datemenu");
    App.addWindow(DateMenu());
  });
}
var { bar: bar3, datemenu } = options_default;
var pos = bar3.position.bind();
var layout4 = Utils.derive([bar3.position, datemenu.position], (bar4, qs2) => `${bar4}-${qs2}`);
var Settings2 = () => Widget.Box({
  class_name: "datemenu horizontal",
  vexpand: false,
  children: [
    NotificationColumn_default(),
    Widget.Separator({ orientation: 1 }),
    DateColumn_default()
  ]
});
var DateMenu = () => PopupWindow_default({
  name: "datemenu",
  exclusivity: "exclusive",
  transition: pos.as((pos2) => pos2 === "top" ? "slide_down" : "slide_up"),
  layout: layout4.value,
  child: Settings2()
});

// main.js
App.config({
  onConfigParsed: () => {
    setupQuickSettings();
    setupDateMenu();
    init7();
  },
  closeWindowDelay: {
    launcher: options_default.transition.value,
    overview: options_default.transition.value,
    quicksettings: options_default.transition.value,
    datemenu: options_default.transition.value
  },
  windows: () => [
    ...forMonitors(Bar_default),
    ...forMonitors(NotificationPopups_default),
    ...forMonitors(ScreenCorners_default),
    ...forMonitors(OSD_default),
    Launcher_default2(),
    Overview_default(),
    PowerMenu_default2(),
    SettingsDialog_default(),
    Verification_default()
  ]
});
