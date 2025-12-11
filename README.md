# Raptor Bar Next Card

Modern multi-bars card for Home Assistant, with sliders, severity colors and the full **Raptor theme engine**.  
Think of it as a **supercharged bar-card**, fully aligned with the Raptor family (Orbit, Grid, Todo Hub, …).

![Raptor Bar Next Card demo](raptor-bar-next-card-demo.gif)


> The animation above is built with the `sections` view type and the demo configuration provided below.

---

## ✨ Features

- 🟦 **Multi-entity bar list**
  - One card = multiple rows, each tied to a Home Assistant entity.
  - Fully responsive layout (name / bar / value widths).

- 🎨 **Raptor theme engine**
  - `theme_mode`: `auto | light | dark | ha | custom`
  - `transparent` card background for glassmorphism setups.
  - Global colors for text, on/off, climate, switches, etc.
  - Works seamlessly with other Raptor cards.

- 📊 **Bar rendering**
  - `bar_height`, `bar_radius`, `bar_background`, `bar_background_off`
  - Solid / stripes / dots patterns, optional wave animation.
  - Configurable direction: `bar_direction: ltr | rtl`
  - `invert_fill` per entity or globally.

- 🧠 **Smart entity handling**
  - `light`, `switch`, `input_boolean`, `fan`
  - `cover` with position + click-to-set slider
  - `climate` with target slider and colors per `hvac_action`
  - `sensor` / `number` / `input_number` with min/max & severities
  - `binary_sensor` as On/Off bar
  - `person` with:
    - classic state mapping (`value_map`)
    - `mode: person_distance` → bar filled by distance from home
  - `media_player` with simple state (playing / paused / idle)

- 🧩 **New: stacked multi-segment bars**
  - Display several entities on a **single bar** using `stacked:`
  - Each segment has its own color and label.
  - Mode `stack_order: as_list | asc | desc` to control the order.

- 🧷 **Dual marker**
  - `entity_b` on a row → small marker positioned on the bar
  - Perfect for comparing two values on the same scale (target vs current, etc.)

- 🖱️ **Interactions**
  - `tap_action` / `hold_action` (string or object with `action`)
  - Default:
    - tap: toggle for binary stuff, more-info otherwise
    - hold: more-info
  - Click anywhere on the bar to use the slider for:
    - `cover` → `set_cover_position`
    - `climate` → `set_temperature`
    - `number` / `input_number` → `set_value`

---

## 🔧 Installation

### 1. HACS (recommended)

1. In **HACS → Frontend → Custom repositories**:
   - Repository: `https://github.com/Inter-Raptor/raptor-bar-next-card`
   - Category: `Lovelace`
2. Add the repository, then search for **Raptor Bar Next Card** in HACS.
3. Install the card and **reload** Home Assistant (or refresh the browser with cache cleared).

### 2. Manual install

1. Download the latest release JS file (e.g. `raptor-bar-next-card.js`).
2. Place it in `www/community/raptor-bar-next-card/` (or any `www/` subfolder).
3. Add a Lovelace resource:

```yaml
url: /local/community/raptor-bar-next-card/raptor-bar-next-card.js
type: module
```

4. Restart the frontend.

---

## 🧱 Basic usage

Minimal example:

```yaml
type: custom:raptor-bar-next-card
title: Lights & switches
entities:
  - entity: light.living_room
  - entity: switch.coffee_machine
```

With labels and custom colors:

```yaml
type: custom:raptor-bar-next-card
title: Lights
color_on: "#22c55e"
color_off: "#64748b"
bar_background: rgba(255,255,255,0.06)
bar_background_off: rgba(15,23,42,0.35)
entities:
  - entity: light.salon
    name: Salon
    label_on: Allumé
    label_off: Éteint
  - entity: switch.tv
    name: TV
    icon: mdi:television
    label_on: "ON"
    label_off: "OFF"
```

---

## 🧊 Theme & layout options

All options are **optional**. Most can be set globally (card level) and overridden per entity.

### Card-level options

```yaml
type: custom:raptor-bar-next-card
title: My bars
theme_mode: auto          # auto | light | dark | ha | custom
transparent: false

bar_height: 1.2rem
bar_radius: 999px
show_icon: true
show_name: true
show_value: auto          # auto | always | never
show_minmax: false
show_bar: true
label_bold: true
animation: smooth         # smooth | none

row_height: 2.4rem
row_spacing: 0.4rem
name_width: 28
bar_width: 52
value_width: 20

font_label: 1.0
font_value: 1.0
font_minmax: 1.0
font_family: null

name_position: left       # left | inside
value_position: right     # right | below | inside

pattern: solid            # solid | stripes | dots
bar_effect: none          # none | wave

invert_fill: false
bar_direction: ltr        # ltr | rtl

bar_background: rgba(255,255,255,0.07)
bar_background_off: rgba(15,23,42,0.25)

color_on: "#2196f3"
color_off: "#d0d9e6"
switch_color_on: null
switch_color_off: null
climate_color_heat: "#f97316"
climate_color_cool: "#0ea5e9"
climate_color_idle: rgba(148,163,184,0.6)
```

---

## 🧬 Entity options

Each entity row can override or extend the defaults.

### Common options

```yaml
entities:
  - entity: light.salon
    name: Salon
    icon: mdi:sofa
    show_icon: true
    show_name: true
    show_bar: true
    show_value: auto       # auto | always | never
    min: 0
    max: 100
    bar_color: "#22c55e"
    bar_color_on: "#22c55e"
    bar_color_off: "#64748b"
    bar_bg_on: rgba(255,255,255,0.06)
    bar_bg_off: rgba(15,23,42,0.35)
    pattern: stripes
    bar_effect: wave
    invert_fill: false
    bar_direction: ltr
    name_position: left
    value_position: right
    label_on: Allumé
    label_off: Éteint
    tap_action: toggle      # or more-info, etc.
    hold_action: more-info
```

### Severity (value-based colors)

```yaml
- entity: sensor.temperature_salon
  name: Temp salon
  min: 0
  max: 30
  severity:
    - from: 0
      to: 18
      color: "#0ea5e9"
    - from: 18
      to: 22
      color: "#22c55e"
    - from: 22
      to: 30
      color: "#ef4444"
```

### Climate

```yaml
- entity: climate.thermostat_rdc
  name: RDC
  min: 15
  max: 25
  slider: true
  heat_color: "#fb923c"   # override climate_color_heat
  cool_color: "#38bdf8"   # override climate_color_cool
```

### Person & distance mode

```yaml
# Classic person with value mapping
- entity: person.vivien
  name: Vivien
  value_map:
    home: Maison
    not_home: Absent

# Distance from home in km
- entity: person.myriam
  name: Myriam
  mode: person_distance
  min: 0
  max: 50
```

---

## 🧱 New: stacked multi-segment bars

Show multiple consumptions on a **single bar**:

```yaml
type: custom:raptor-bar-next-card
title: Instant power – stacked
entities:
  - entity: sensor.power_total
    name: Total
    max: 45               # max value for 100%
    stacked:
      - entity: sensor.power_washer
        name: Lave-linge
        color: "#22c55e"
      - entity: sensor.power_kitchen
        name: Prises cuisine
        color: "#ef4444"
      - entity: sensor.power_water_heater
        name: Eau chaude
        color: "#3b82f6"
    stack_order: as_list   # as_list | asc | desc
```

- If `max` is **not** defined on the main entity, the card uses the **sum of segments** as reference.
- Each segment has:
  - its own color (`color` / `bar_color` / `color_on` fallback),
  - a tooltip with `name: value`.

---

## 🧪 Demo page (sections view)

The GIF in this repository is built from a full demo page like this:

```yaml
# views:
- title: Raptor Bar – Demo1
  path: raptor-bar-demo1
  type: sections
  max_columns: 4
  cards: []
  sections:
    # Copy the demo from the README examples here
```

Feel free to copy the full example from this README, paste it into your `lovelace` YAML, and adapt entities to your own setup.

---

## 🛣️ Roadmap

- Better support for **Lovelace actions** (`navigate`, `call-service`, etc.).
- Optional **legend** for stacked bars (with colors & values).
- More presets for layouts (minimal, compact, vertical board).
- Additional “state-based” color modes for non-numeric sensors.

---

## 🐛 Issues & contributions

If you find a bug or want a new feature:

1. Open an issue on GitHub with:
   - your Home Assistant version,
   - card version,
   - config snippet,
   - screenshot or GIF if possible.
2. Pull Requests are welcome!  
   Try to keep the style close to the existing Raptor cards (naming, comments, etc.).

---

## 🇫🇷 Version française

**Raptor Bar Next Card** est une carte Lovelace pour Home Assistant permettant d’afficher des **barres de progression modernes**, avec gestion du thème Raptor, des couleurs par seuil, des sliders intégrés et, en bonus, un mode **barres empilées (stacked)** pour afficher plusieurs entités sur une seule barre.

Fonctionnalités principales :

- Multi-lignes (plusieurs entités par carte)
- Thème Raptor (mode clair/sombre/auto, fond transparent, couleurs on/off, clim, etc.)
- Affichage configurable : hauteur, rayon, patterns (solid / stripes / dots), effet “wave”
- Support de nombreux domaines : `light`, `switch`, `cover`, `climate`, `sensor`, `binary_sensor`, `number`, `input_number`, `person`, `media_player`
- Mode `person_distance` pour afficher la distance d’une personne par rapport à la maison
- Barres empilées `stacked:` pour visualiser plusieurs consommations sur une seule barre
- Actions `tap_action` / `hold_action` et sliders intégrés (cliquer dans la barre pour régler un volet, une consigne de thermostat, un `input_number`, etc.)

Installation :

- Via **HACS** (recommandé) en ajoutant le repo comme dépôt personnalisé Frontend,
- Ou manuellement, en copiant le JS dans `www/community/raptor-bar-next-card/` et en déclarant une ressource Lovelace de type `module`.

Tous les exemples de configuration sont fournis plus haut en YAML  
(et la page de démo `sections` utilisée pour le GIF peut être copiée quasiment telle quelle).

---

## 📄 License

MIT License  
Copyright (c) 2025 Vivien Jardot
