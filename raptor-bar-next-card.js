/* -------------------------------------------------------------------------
  Raptor Bar Next Card - par Inter-Raptor (Vivien Jardot)
  --------------------------------------------------------------------------
  Carte Lovelace personnalisée pour Home Assistant.

  Multi-barres modernes façon "bar-card", avec moteur de thème Raptor :

  ✅ Thème & style (comme Orbit / Grid)
    - theme_mode: auto | light | dark | ha | custom
    - transparent: true/false (fond de carte)
    - text_color, text_color_secondary
    - disc_color, disc_color_dark
    - color_on/off, switch_color_*, climate_color_*

  ✅ Layout & typographie
    - row_height, row_spacing
    - name_width, bar_width, value_width (en % de la ligne)
    - font_label, font_value, font_minmax, font_family
    - show_title: true/false
    - show_bar, show_name, show_value (global + par entité)
    - name_position: left | inside
    - value_position: right | below | inside

  ✅ Barres & couleurs
    - bar_height, bar_radius
    - bar_background, bar_background_off
    - bar_color global + par entité
    - bar_color_on/off, bar_bg_on/off (par entité)
    - severity / severities: [{ from, to, color }]
    - pattern: solid | stripes | dots (global + par entité)
    - bar_effect: none | wave
    - invert_fill: true/false (global + par entité)
    - bar_direction: ltr | rtl (global + par entité)

  ✅ Entités supportées & logiques
    - light, switch, input_boolean, fan
    - cover (position + slider)
    - climate (target + slider, couleur par hvac_action)
    - sensor (numérique)
    - binary_sensor (on/off)
    - input_number, number (slider)
    - person (state + mode spécial person_distance + value_map)
    - media_player (état simple)

  ✅ Interactions
    - tap_action / hold_action (string ou objet avec action)
    - tap par défaut : toggle pour binary / cover, more-info pour le reste
    - hold par défaut : more-info
    - slider en cliquant dans la barre :
        * cover → set_cover_position(%)
        * climate → set_temperature() min/max
        * input_number / number → set_value() min/max

  ✅ Spécial
    - mode: person_distance → barre remplie selon distance maison (lat/lon HA)
    - dual: true + entity_b → marqueur pour une 2ᵉ entité sur la même barre
    - stacked: [ { entity, name, color }, ... ] → multi-segments sur une barre

  ------------------------------------------------------------------------- */

/* "Raptor" ASCII logo ---------------------------------------------------- */
//                                   .,.                                          
//                       *******                        *#### (#####              
//                  ******                          / ########     .#####.        
//              ,*****                          //////##########   #####  /####   
//           .*****                           // /////*#####################  ##  
//         ******                             //// /// ######*      *############ 
//       ******                               ////// /   ###########,            
//     .*****                                 ////////     ##################     
//    ******                                  //////// #                         
//   *****.                                  ## ////// ###                       
//  *****,                              #########/ /// #####/                  , 
// ,*****                           ################ /.######                  
// *****                       (####################   (#####                  
// ******                   #####   ########   ////////   ###                   .*
//,******             .*** ######### #####*   /////////     # /                 *
// *********    .******* ############ ###### ////////       ////                *
//  ******************* (############# #####///////      *///// ##              *
//   ****************** //// ,######### ###  /########       #########          *
//     ****************  ////////  #####/(       #######.          ####         *
//                       /////// /////  ##     //    (####           ###       **
//                        ///// //////////, /////     .####       /*(##       **
//                       ////// ///////    / ////   ## ###         ,         ,**
//                     ////////////       // ///      #                     ***.
//    .              /////////,         ////,/                             ***   
//                   ///               ......                            ****    
//       ,           ,///##              /////                         ****.     
//         *.         // ###              ,/// /                     *****       
//           ,*       / ####                /*/// ///             *****          
//              **,    ####( ####             ///// ///        ******            
//                 ****  ##### #####                      ,*******               
//                     ******.                      **********                   
//                           ***************************                         
// ***************************
//
// ---- Raptor Bar Next Card - multi-bars w/ sliders & Raptor theme engine ----

if (!customElements.get("raptor-bar-next-card")) {
  class RaptorBarNextCard extends HTMLElement {
    constructor() {
      super();
      this._config = null;
      this._hass = null;
      this._domBuilt = false;

      this._pressTimer = null;
      this._pressTarget = null;
      this._holdFired = false;
    }

    // ---------------------------------------------------------------------
    // CONFIG
    // ---------------------------------------------------------------------

    setConfig(config) {
      if (!config.entities || !Array.isArray(config.entities) || config.entities.length === 0) {
        throw new Error("Vous devez définir au moins une entité dans 'entities'.");
      }

      this._config = {
        // thème Raptor
        theme_mode: config.theme_mode || "auto", // auto | light | dark | ha | custom
        transparent: config.transparent === true,
        disc_color: config.disc_color || null,
        disc_color_dark: config.disc_color_dark || null,
        text_color: config.text_color || null,
        text_color_secondary: config.text_color_secondary || null,
        color_on: config.color_on || null,
        color_off: config.color_off || null,
        switch_color_on: config.switch_color_on || null,
        switch_color_off: config.switch_color_off || null,
        climate_color_heat: config.climate_color_heat || null,
        climate_color_cool: config.climate_color_cool || null,
        climate_color_idle: config.climate_color_idle || null,

        // options d’affichage globales
        title: config.title || null,
        show_title: config.show_title !== false,
        orientation: (config.orientation || "horizontal").toLowerCase(), // horizontal | vertical
        bar_height: config.bar_height || "1.2rem",
        bar_radius: config.bar_radius || "999px",
        show_icon: config.show_icon !== false,
        show_name: config.show_name !== false,
        show_value: config.show_value || "auto", // "auto" | "always" | "never"
        show_minmax: config.show_minmax || false,
        show_bar: config.show_bar !== false,
        label_bold: config.label_bold || false,
        animation: config.animation || "smooth",

        // layout (largeurs en %)
        row_height: config.row_height || "2.4rem",
        row_spacing: config.row_spacing || "0.4rem",
        name_width: config.name_width || 28,   // %
        bar_width: config.bar_width || 52,     // %
        value_width: config.value_width || 20, // %

        // fonts
        font_label: config.font_label || 1.0,
        font_value: config.font_value || 1.0,
        font_minmax: config.font_minmax || 1.0,
        font_family: config.font_family || null,

        // positions nom / valeur
        name_position: config.name_position || "left",   // left | inside
        value_position: config.value_position || "right", // right | below | inside

        // patterns & effets
        pattern: config.pattern || "solid", // solid | stripes | dots
        bar_effect: config.bar_effect || "none", // none | wave

        // inversion / direction
        invert_fill: config.invert_fill === true,
        bar_direction: (config.bar_direction || "ltr").toLowerCase(), // ltr | rtl

        // couleurs de barres
        bar_color: config.bar_color || null,
        bar_background: config.bar_background || null,
        bar_background_off: config.bar_background_off || null,

        // liste brute (string ou objet, on normalise plus tard dans render)
        entities: config.entities,
      };

      this._domBuilt = false;
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._config) return;
      this._render();
    }

    get hassObj() {
      return this._hass;
    }

    getCardSize() {
      return 3;
    }

    // ---------------------------------------------------------------------
    // THEME ENGINE (inspiré de Raptor Grid / Orbit)
    // ---------------------------------------------------------------------

    _getEffectiveThemeMode() {
      if (!this._config) return "auto";
      const explicit = this._config.theme_mode || "auto";

      if (explicit === "light" || explicit === "dark" || explicit === "custom") {
        return explicit;
      }

      const isDarkHa =
        this._hass &&
        this._hass.themes &&
        this._hass.themes.darkMode;

      if (explicit === "ha") {
        return isDarkHa ? "dark" : "light";
      }

      // auto = suit le mode sombre HA
      return isDarkHa ? "dark" : "light";
    }

    _getThemeVars() {
      const mode = this._getEffectiveThemeMode();
      const custom = this._config && this._config.theme_mode === "custom";
      const transparent = this._config && this._config.transparent === true;

      if (mode === "dark") {
        const textMain =
          this._config.text_color || (custom ? "#ffffff" : "#f5f5f5");
        const textSecondary =
          this._config.text_color_secondary ||
          (custom ? "rgba(255,255,255,0.8)" : "rgba(245,245,245,0.78)");

        const cardBg = custom
          ? "var(--raptor-card-bg, radial-gradient(circle at 20% 0%, #252a32, #15171c 70%))"
          : "radial-gradient(circle at 20% 0%, #252a32, #15171c 70%)";

        const discColor = this._config.disc_color || "#263238";
        const discColorDark = this._config.disc_color_dark || "#111318";

        const vars = {
          cardBg,
          textMain,
          textSecondary,
          discColor,
          discColorDark,
          logical_on: this._config.color_on || "#ff9800",
          logical_off: this._config.color_off || "#37474f",
          climate_heat: this._config.climate_color_heat || "#ff9800",
          climate_cool: this._config.climate_color_cool || "#03a9f4",
          climate_idle: this._config.climate_color_idle || "rgba(255,255,255,0.18)",
          switch_on: this._config.switch_color_on || null,
          switch_off: this._config.switch_color_off || null,
        };

        if (transparent) {
          vars.cardBg = "none";
        }

        return vars;
      }

      // mode clair
      const textMain =
        this._config.text_color || (custom ? "#000000" : "#0b1120");
      const textSecondary =
        this._config.text_color_secondary ||
        (custom ? "rgba(0,0,0,0.74)" : "#1f2933");

      const cardBg = custom
        ? "var(--raptor-card-bg, radial-gradient(circle at 20% -10%, #ffffff, #e6edf7 55%, #d0d9e6 100%))"
        : "radial-gradient(circle at 20% -10%, #ffffff, #e6edf7 55%, #d0d9e6 100%)";

      const discColor = this._config.disc_color || "#f4f7fb";
      const discColorDark = this._config.disc_color_dark || "#c9d5e8";

      const vars = {
        cardBg,
        textMain,
        textSecondary,
        discColor,
        discColorDark,
        logical_on: this._config.color_on || "#2196f3",
        logical_off: this._config.color_off || "#d0d9e6",
        climate_heat: this._config.climate_color_heat || "#f97316",
        climate_cool: this._config.climate_color_cool || "#3b82f6",
        climate_idle: this._config.climate_color_idle || "#90a4ae",
        switch_on: this._config.switch_color_on || null,
        switch_off: this._config.switch_color_off || null,
      };

      if (transparent) {
        vars.cardBg = "none";
      }

      return vars;
    }

    // ---------------------------------------------------------------------
    // UTILITAIRES
    // ---------------------------------------------------------------------

    _computeIcon(entityConfig, stateObj) {
      if (entityConfig && entityConfig.icon) return entityConfig.icon;
      if (stateObj && stateObj.attributes && stateObj.attributes.icon) {
        return stateObj.attributes.icon;
      }
      const domain = stateObj ? stateObj.entity_id.split(".")[0] : "";
      switch (domain) {
        case "light": return "mdi:lightbulb";
        case "climate": return "mdi:thermostat";
        case "cover": return "mdi:window-shutter";
        case "switch": return "mdi:toggle-switch";
        case "sensor": return "mdi:eye";
        case "input_number": return "mdi:tune-vertical";
        case "number": return "mdi:tune-vertical";
        case "binary_sensor": return "mdi:checkbox-blank-circle";
        case "person": return "mdi:account-circle";
        case "fan": return "mdi:fan";
        case "media_player": return "mdi:play-circle";
        default: return "mdi:checkbox-blank-circle-outline";
      }
    }

    _computePersonDistanceKm(stateObj) {
      if (!this._hass || !this._hass.config) return NaN;
      const attrs = stateObj.attributes || {};
      const lat2 = Number(attrs.latitude);
      const lon2 = Number(attrs.longitude);
      const lat1 = Number(this._hass.config.latitude);
      const lon1 = Number(this._hass.config.longitude);
      if (
        Number.isNaN(lat1) || Number.isNaN(lon1) ||
        Number.isNaN(lat2) || Number.isNaN(lon2)
      ) {
        return NaN;
      }

      const toRad = (d) => (d * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    _formatValue(stateObj, entityConfig) {
      if (!stateObj) return "";
      const attrs = stateObj.attributes;
      const unit = entityConfig.unit ||
        attrs.unit_of_measurement ||
        "";

      const domain = stateObj.entity_id.split(".")[0];
      const state = stateObj.state;

      // Person distance : "12.3 km – home"
      if (entityConfig.mode === "person_distance") {
        const d = this._computePersonDistanceKm(stateObj);
        if (!Number.isNaN(d)) {
          const label = state || "";
          return `${d.toFixed(1)} km${label ? " – " + label : ""}`;
        }
        return state;
      }

      // Person avec mapping d'état (home → Maison, not_home → Absent, etc.)
      if (domain === "person") {
        if (entityConfig.value_map && entityConfig.value_map[state] !== undefined) {
          return entityConfig.value_map[state];
        }
        return state;
      }

      // CLIMATE
      if (domain === "climate") {
        const current = attrs.current_temperature;
        const target = attrs.temperature || attrs.target_temperature || attrs.target_temp;

        const modeRaw = (attrs.hvac_action || state || "").toLowerCase();
        let modeLabel = "";

        if (modeRaw === "heating") modeLabel = "chauffe";
        else if (modeRaw === "cooling") modeLabel = "clim";
        else if (modeRaw === "idle") modeLabel = "arrêt";
        else if (modeRaw) modeLabel = modeRaw;

        let suffix = "";
        if (modeLabel) suffix = ` (${modeLabel})`;

        if (current != null && target != null) {
          return `${current}° → ${target}°${suffix}`;
        }
        if (target != null) {
          return `${target}°${suffix}`;
        }
        return modeLabel || state;
      }

      // Cover en %
      if (domain === "cover" && attrs.current_position != null) {
        const v = attrs.current_position;
        return `${v} %`;
      }

      // Binaire lisible
      if (["switch", "light", "input_boolean", "fan"].includes(domain)) {
        return state === "on"
          ? (entityConfig.label_on || "On")
          : (entityConfig.label_off || "Off");
      }

      if (domain === "binary_sensor") {
        return state === "on"
          ? (entityConfig.label_on || "Actif")
          : (entityConfig.label_off || "Inactif");
      }

      if (domain === "media_player") {
        if (state === "playing") {
          const t = attrs.media_title || "";
          return t ? `Lecture – ${t}` : "Lecture";
        }
        if (state === "paused") return "Pause";
        if (state === "idle") return "Inactif";
        return state;
      }

      if (state === "unknown" || state === "unavailable") {
        return state;
      }

      if (!Number.isNaN(parseFloat(state)) && unit) {
        return `${state} ${unit}`;
      }

      return `${state}${unit ? " " + unit : ""}`;
    }

    _getActionFor(entityConfig, type) {
      const key = `${type}_action`;
      const conf = entityConfig[key];
      if (conf) {
        if (typeof conf === "string") return conf;
        if (typeof conf === "object" && conf.action) return conf.action;
      }

      const entityId = entityConfig.entity;
      const domain = entityId.split(".")[0];

      if (type === "hold") {
        return "more-info";
      }

      if (["switch", "light", "input_boolean", "fan"].includes(domain)) {
        return "toggle";
      }
      if (domain === "cover") {
        return "toggle";
      }
      if (domain === "climate") {
        return "more-info";
      }

      return "more-info";
    }

    _toggleEntity(entityId) {
      if (!this._hass) return;
      const [domain] = entityId.split(".");

      if (["light", "switch", "input_boolean", "fan"].includes(domain)) {
        this._hass.callService(domain, "toggle", { entity_id: entityId });
        return;
      }

      if (domain === "cover") {
        const stateObj = this._hass.states[entityId];
        if (!stateObj) return;
        if (stateObj.state === "open" || stateObj.state === "opening") {
          this._hass.callService("cover", "close_cover", { entity_id: entityId });
        } else {
          this._hass.callService("cover", "open_cover", { entity_id: entityId });
        }
        return;
      }

      this._showMoreInfo(entityId);
    }

    _showMoreInfo(entityId) {
      if (!entityId) return;
      const ev = new Event("hass-more-info", {
        bubbles: true,
        composed: true,
      });
      ev.detail = { entityId };
      this.dispatchEvent(ev);
    }

    _handleTap(entityId, entityConfig) {
      const action = this._getActionFor(entityConfig, "tap");
      if (action === "toggle") {
        this._toggleEntity(entityId);
      } else {
        this._showMoreInfo(entityId);
      }
    }

    _handleHold(entityId, entityConfig) {
      const action = this._getActionFor(entityConfig, "hold");
      if (action === "toggle") {
        this._toggleEntity(entityId);
      } else {
        this._showMoreInfo(entityId);
      }
    }

    _supportsSlider(entityId, entityConfig) {
      const domain = entityId.split(".")[0];
      if (entityConfig.slider === true) return true;
      if (["cover", "climate", "input_number", "number"].includes(domain)) return true;
      return false;
    }

    _setCoverPosition(entityId, position) {
      if (!this._hass) return;
      const pos = Math.max(0, Math.min(100, Math.round(position)));
      this._hass.callService("cover", "set_cover_position", {
        entity_id: entityId,
        position: pos,
      });
    }

    _setClimateTarget(entityId, value) {
      if (!this._hass) return;
      const stateObj = this._hass.states[entityId];
      if (!stateObj) return;
      const attrs = stateObj.attributes;

      const minAttr = attrs.min_temp ?? attrs.min_temperature;
      const maxAttr = attrs.max_temp ?? attrs.max_temperature;

      let min = minAttr != null ? Number(minAttr) : null;
      let max = maxAttr != null ? Number(maxAttr) : null;

      if (this._config && Array.isArray(this._config.entities)) {
        const entityConfig = this._config.entities.find(
          (e) => (typeof e === "string" ? e : e.entity) === entityId
        );
        if (entityConfig && typeof entityConfig === "object") {
          if (entityConfig.min != null) min = entityConfig.min;
          if (entityConfig.max != null) max = entityConfig.max;
        }
      }

      if (min == null || max == null || max <= min) return;

      let t = value;
      if (t < min) t = min;
      if (t > max) t = max;

      const step = attrs.target_temp_step || 0.5;
      const rounded = Math.round(t / step) * step;

      this._hass.callService("climate", "set_temperature", {
        entity_id: entityId,
        temperature: rounded,
      });
    }

    _setInputNumberValue(entityId, value) {
      if (!this._hass) return;
      const stateObj = this._hass.states[entityId];
      if (!stateObj) return;
      const attrs = stateObj.attributes;

      let min = attrs.min != null ? Number(attrs.min) : null;
      let max = attrs.max != null ? Number(attrs.max) : null;

      if (this._config && Array.isArray(this._config.entities)) {
        const entityConfig = this._config.entities.find(
          (e) => (typeof e === "string" ? e : e.entity) === entityId
        );
        if (entityConfig && typeof entityConfig === "object") {
          if (entityConfig.min != null) min = entityConfig.min;
          if (entityConfig.max != null) max = entityConfig.max;
        }
      }

      if (min == null || max == null || max <= min) return;

      let val = value;
      if (val < min) val = min;
      if (val > max) val = max;

      const step = attrs.step != null ? Number(attrs.step) : 1;
      const rounded = Math.round(val / step) * step;

      this._hass.callService("input_number", "set_value", {
        entity_id: entityId,
        value: rounded,
      });
    }

    _setNumberValue(entityId, value) {
      if (!this._hass) return;
      const stateObj = this._hass.states[entityId];
      if (!stateObj) return;
      const attrs = stateObj.attributes;

      let min = attrs.min != null ? Number(attrs.min) : null;
      let max = attrs.max != null ? Number(attrs.max) : null;

      if (this._config && Array.isArray(this._config.entities)) {
        const entityConfig = this._config.entities.find(
          (e) => (typeof e === "string" ? e : e.entity) === entityId
        );
        if (entityConfig && typeof entityConfig === "object") {
          if (entityConfig.min != null) min = entityConfig.min;
          if (entityConfig.max != null) max = entityConfig.max;
        }
      }

      if (min == null || max == null || max <= min) return;

      let val = value;
      if (val < min) val = min;
      if (val > max) val = max;

      const step = attrs.step != null ? Number(attrs.step) : 1;
      const rounded = Math.round(val / step) * step;

      this._hass.callService("number", "set_value", {
        entity_id: entityId,
        value: rounded,
      });
    }

    _applySliderValue(entityId, entityConfig, rel, orientation) {
      const domain = entityId.split(".")[0];
      const stateObj = this._hass.states[entityId];
      if (!stateObj) return false;

      rel = Math.max(0, Math.min(1, rel));

      if (domain === "cover") {
        const position = rel * 100;
        this._setCoverPosition(entityId, position);
        return true;
      }

      if (domain === "climate") {
        const attrs = stateObj.attributes;
        const minAttr = attrs.min_temp ?? attrs.min_temperature;
        const maxAttr = attrs.max_temp ?? attrs.max_temperature;

        let min = minAttr != null ? Number(minAttr) : null;
        let max = maxAttr != null ? Number(maxAttr) : null;

        if (entityConfig.min != null) min = entityConfig.min;
        if (entityConfig.max != null) max = entityConfig.max;

        if (min == null || max == null || max <= min) return false;

        const value = min + rel * (max - min);
        this._setClimateTarget(entityId, value);
        return true;
      }

      if (domain === "input_number") {
        const attrs = stateObj.attributes;
        let min = attrs.min != null ? Number(attrs.min) : null;
        let max = attrs.max != null ? Number(attrs.max) : null;

        if (entityConfig.min != null) min = entityConfig.min;
        if (entityConfig.max != null) max = entityConfig.max;

        if (min == null || max == null || max <= min) return false;

        const value = min + rel * (max - min);
        this._setInputNumberValue(entityId, value);
        return true;
      }

      if (domain === "number") {
        const attrs = stateObj.attributes;
        let min = attrs.min != null ? Number(attrs.min) : null;
        let max = attrs.max != null ? Number(attrs.max) : null;

        if (entityConfig.min != null) min = entityConfig.min;
        if (entityConfig.max != null) max = entityConfig.max;

        if (min == null || max == null || max <= min) return false;

        const value = min + rel * (max - min);
        this._setNumberValue(entityId, value);
        return true;
      }

      return false;
    }

    // ---------------------------------------------------------------------
    // BUILD DOM
    // ---------------------------------------------------------------------

    _buildDom() {
      const cfg = this._config;
      const themeVars = this._getThemeVars();

      const cardBg = themeVars.cardBg;
      const textMain = themeVars.textMain;
      const textSecondary = themeVars.textSecondary;

      const barBg = cfg.bar_background ||
        "rgba(255,255,255,0.07)";
      const barBgOff = cfg.bar_background_off || "rgba(15,23,42,0.25)";

      let cardStyle = `
        --bar-height:${cfg.bar_height};
        --bar-radius:${cfg.bar_radius};
        --raptor-bar-bg:${barBg};
        --raptor-bar-bg-off:${barBgOff};
        --raptor-text-color:${textMain};
        --raptor-text-sec:${textSecondary};
        --raptor-card-bg:${cardBg};
        --raptor-row-height:${cfg.row_height};
        --raptor-row-gap:${cfg.row_spacing};
        --raptor-name-width:${cfg.name_width}%;
        --raptor-bar-width:${cfg.bar_width}%;
        --raptor-value-width:${cfg.value_width}%;
        --raptor-font-label:${cfg.font_label};
        --raptor-font-value:${cfg.font_value};
        --raptor-font-minmax:${cfg.font_minmax};
      `;
      if (cfg.font_family) {
        cardStyle += `font-family:${cfg.font_family};`;
      }

      let html = `
        <ha-card class="raptor-bar-next-card" style="${cardStyle}">
          <style>
            .raptor-bar-next-card {
              padding: 0.6rem 0.8rem 0.7rem;
              background: var(--raptor-card-bg);
            }
            .raptor-bar-header {
              font-size: 1.05rem;
              font-weight: 600;
              margin-bottom: 0.4rem;
              color: var(--raptor-text-color, var(--primary-text-color));
            }
            .raptor-bar-list {
              display: flex;
              flex-direction: column;
              gap: var(--raptor-row-gap, 0.4rem);
            }
            .raptor-bar-row {
              display: flex;
              align-items: center;
              gap: 0.55rem;
              cursor: pointer;
              user-select: none;
              min-height: var(--raptor-row-height, 2.4rem);
            }
            .raptor-bar-label {
              display: flex;
              align-items: center;
              gap: 0.3rem;
              min-width: 0;
              flex: 0 0 var(--raptor-name-width, 28%);
              color: var(--raptor-text-sec, var(--secondary-text-color));
            }
            .raptor-bar-label .name {
              font-size: calc(0.85rem * var(--raptor-font-label, 1));
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .raptor-bar-label.bold .name {
              font-weight: 600;
              color: var(--raptor-text-color, var(--primary-text-color));
            }
            .raptor-bar-label ha-icon {
              --mdc-icon-size: 20px;
            }
            .raptor-bar-main {
              display: flex;
              align-items: center;
              gap: 0.4rem;
              flex: 1 0 var(--raptor-bar-width, 52%);
              min-width: 0;
            }
            .raptor-bar-wrapper {
              position: relative;
              flex: 1;
              min-width: 0;
              background: var(--raptor-bar-bg-off);
              border-radius: var(--bar-radius);
              overflow: hidden;
              box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
              height: var(--bar-height);
            }
            .raptor-bar-fill {
              position: relative;
              height: 100%;
              width: 0%;
              background: var(--bar-color, var(--primary-color));
              border-radius: var(--bar-radius);
              transition: width 0.2s ease-out, height 0.2s ease-out, background 0.2s ease-out;
            }

            /* --- multi-segments stacked --- */
            .raptor-bar-fill-multi {
              position: relative;
              height: 100%;
              width: 100%;
              display: none;
              overflow: hidden;
            }
            .raptor-bar-wrapper.stacked .raptor-bar-fill {
              display: none;
            }
            .raptor-bar-wrapper.stacked .raptor-bar-fill-multi {
              display: flex;
              flex-direction: row;
            }
            .raptor-bar-wrapper.stacked.vertical .raptor-bar-fill-multi {
              flex-direction: column-reverse;
            }
            .raptor-bar-segment {
              height: 100%;
              width: 0;
              transition: width 0.2s ease-out, height 0.2s ease-out, background 0.2s ease-out;
            }
            .raptor-bar-row.vertical .raptor-bar-segment {
              width: 100%;
            }

            .raptor-bar-inner-text {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              padding: 0 0.4rem;
              box-sizing: border-box;
              pointer-events: none;
              color: var(--raptor-text-color, var(--primary-text-color));
              font-size: calc(0.8rem * var(--raptor-font-label, 1));
              gap: 0.35rem;
            }
            .raptor-bar-inner-text .label-inside,
            .raptor-bar-inner-text .value-inside {
              display: none;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .raptor-bar-inner-text .value-inside {
              margin-left: auto;
              font-weight: 600;
            }
            .raptor-bar-wrapper.rtl .raptor-bar-inner-text {
              justify-content: flex-end;
            }
            .raptor-bar-wrapper.rtl .raptor-bar-fill {
              margin-left: auto;
            }

            .raptor-bar-marker {
              position: absolute;
              top: 0;
              bottom: 0;
              width: 2px;
              background: rgba(255,255,255,0.7);
              opacity: 0;
              pointer-events: none;
            }

            .raptor-bar-value-block {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              flex: 0 0 var(--raptor-value-width, 20%);
              min-width: 0;
              font-size: calc(0.8rem * var(--raptor-font-value, 1));
              color: var(--raptor-text-sec, var(--secondary-text-color));
            }
            .raptor-bar-value {
              font-weight: 600;
              color: var(--raptor-text-color, var(--primary-text-color));
              max-width: 8rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .raptor-bar-minmax {
              font-size: calc(0.7rem * var(--raptor-font-minmax, 1));
              opacity: 0.8;
            }

            .raptor-bar-row.on .raptor-bar-wrapper {
              background: var(--raptor-bar-bg, rgba(255,255,255,0.07));
            }
            .raptor-bar-row.off .raptor-bar-wrapper {
              background: var(--raptor-bar-bg-off);
            }
            .raptor-bar-row:active .raptor-bar-wrapper {
              filter: brightness(1.12);
            }

            .no-animation .raptor-bar-fill,
            .no-animation .raptor-bar-segment {
              transition: none;
            }

            /* name / value positions */

            .raptor-bar-row.name-inside .raptor-bar-label .name {
              display: none;
            }
            .raptor-bar-row.name-inside .raptor-bar-inner-text .label-inside {
              display: inline;
            }

            .raptor-bar-row.value-inside .raptor-bar-value-block .raptor-bar-value {
              display: none;
            }
            .raptor-bar-row.value-inside .raptor-bar-inner-text .value-inside {
              display: inline;
            }

            .raptor-bar-row.value-below .raptor-bar-value-block {
              align-items: flex-start;
            }
            .raptor-bar-row.value-below .raptor-bar-value {
              text-align: left;
              max-width: 100%;
            }

            /* patterns sur la barre */
            .raptor-bar-wrapper.pattern-solid .raptor-bar-fill,
            .raptor-bar-wrapper.pattern-solid .raptor-bar-segment {
              background-image: none;
            }
            .raptor-bar-wrapper.pattern-stripes .raptor-bar-fill,
            .raptor-bar-wrapper.pattern-stripes .raptor-bar-segment {
              background-image: repeating-linear-gradient(
                -45deg,
                rgba(255,255,255,0.18),
                rgba(255,255,255,0.18) 4px,
                rgba(255,255,255,0.05) 4px,
                rgba(255,255,255,0.05) 8px
              );
              background-size: 150% 100%;
            }
            .raptor-bar-wrapper.pattern-dots .raptor-bar-fill,
            .raptor-bar-wrapper.pattern-dots .raptor-bar-segment {
              background-image: radial-gradient(circle, rgba(255,255,255,0.35) 2px, transparent 2px);
              background-size: 8px 8px;
            }

            /* effet wave */
            .raptor-bar-wrapper.effect-wave .raptor-bar-fill,
            .raptor-bar-wrapper.effect-wave .raptor-bar-segment {
              background-size: 150% 100%;
              animation: raptor-wave 3s linear infinite;
            }
            @keyframes raptor-wave {
              0% { background-position: 0% 0; }
              100% { background-position: 100% 0; }
            }

            /* orientation verticale */
            .raptor-bar-row.vertical .raptor-bar-main {
              flex-direction: row;
            }
            .raptor-bar-row.vertical .raptor-bar-wrapper {
              width: var(--bar-height);
              height: 4.2rem;
              display: flex;
              align-items: flex-end;
            }
            .raptor-bar-row.vertical .raptor-bar-fill {
              width: 100%;
              height: 0%;
            }
            .raptor-bar-row.vertical .raptor-bar-inner-text {
              font-size: 0.7rem;
            }

            /* cacher barre si show_bar = false */
            .raptor-bar-row.no-bar .raptor-bar-wrapper {
              display: none;
            }
          </style>
      `;

      if (cfg.show_title && cfg.title) {
        html += `<div class="raptor-bar-header">${cfg.title}</div>`;
      }

      html += `<div class="raptor-bar-list">`;

      cfg.entities.forEach((entry, index) => {
        const entityConfig = typeof entry === "string" ? { entity: entry } : entry;
        const entityId = entityConfig.entity;

        html += `
          <div class="raptor-bar-row"
               data-entity="${entityId}"
               data-index="${index}">
            <div class="raptor-bar-label ${cfg.label_bold ? "bold" : ""}">
              ${cfg.show_icon !== false ? `<ha-icon class="icon"></ha-icon>` : ""}
              ${cfg.show_name !== false ? `<span class="name"></span>` : ""}
            </div>
            <div class="raptor-bar-main">
              <div class="raptor-bar-wrapper pattern-${cfg.pattern} effect-${cfg.bar_effect}">
                <div class="raptor-bar-fill"></div>
                <div class="raptor-bar-fill-multi"></div>
                <div class="raptor-bar-inner-text">
                  <span class="label-inside"></span>
                  <span class="value-inside"></span>
                </div>
                <div class="raptor-bar-marker"></div>
              </div>
              <div class="raptor-bar-value-block">
                <div class="raptor-bar-value"></div>
                ${cfg.show_minmax ? `<div class="raptor-bar-minmax"></div>` : ""}
              </div>
            </div>
          </div>
        `;
      });

      html += `</div></ha-card>`;

      this.innerHTML = html;

      // --- gestion pointer (tap/hold + slider) ----------------------------
      this.querySelectorAll(".raptor-bar-row").forEach((row) => {
        row.addEventListener("pointerdown", (ev) => {
          if (ev.button !== 0) return;
          const entityId = row.getAttribute("data-entity");
          const idx = Number(row.getAttribute("data-index"));
          if (!this._config || !this._config.entities[idx]) return;
          const entityConfig = typeof this._config.entities[idx] === "string"
            ? { entity: this._config.entities[idx] }
            : this._config.entities[idx];

          this._holdFired = false;
          this._pressTarget = { entityId, entityConfig, row };

          if (this._pressTimer) {
            clearTimeout(this._pressTimer);
            this._pressTimer = null;
          }

          this._pressTimer = setTimeout(() => {
            if (this._pressTarget) {
              this._holdFired = true;
              this._handleHold(entityId, entityConfig);
            }
          }, 600);
        });

        const cancelPress = () => {
          if (this._pressTimer) {
            clearTimeout(this._pressTimer);
            this._pressTimer = null;
          }
          this._pressTarget = null;
        };

        row.addEventListener("pointerleave", cancelPress);
        row.addEventListener("pointercancel", cancelPress);

        row.addEventListener("pointerup", (ev) => {
          if (ev.button !== 0) return;
          if (this._pressTimer) {
            clearTimeout(this._pressTimer);
            this._pressTimer = null;
          }

          if (!this._pressTarget) return;
          const { entityId, entityConfig, row: r } = this._pressTarget;
          this._pressTarget = null;

          if (this._holdFired) {
            return;
          }

          const wrapper = r.querySelector(".raptor-bar-wrapper");
          const orientation = (entityConfig.orientation || this._config.orientation || "horizontal").toLowerCase();

          if (wrapper && this._supportsSlider(entityId, entityConfig)) {
            const rect = wrapper.getBoundingClientRect();
            let rel;

            if (orientation === "vertical") {
              // bas -> haut
              rel = (rect.bottom - ev.clientY) / rect.height;
            } else {
              // gauche -> droite (on gère juste la position, le sens visuel est géré plus tard)
              rel = (ev.clientX - rect.left) / rect.width;
            }

            if (!Number.isNaN(rel) && rel >= 0 && rel <= 1) {
              if (this._applySliderValue(entityId, entityConfig, rel, orientation)) {
                return; // slider utilisé → pas de tap classique
              }
            }
          }

          this._handleTap(entityId, entityConfig);
        });
      });

      this._domBuilt = true;
    }

    // ---------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------

    _render() {
      if (!this._config || !this._hass) return;

      if (!this._domBuilt) {
        this._buildDom();
      }

      const cfg = this._config;
      const themeVars = this._getThemeVars();

      const logicalOn = cfg.color_on || themeVars.logical_on;
      const logicalOff = cfg.color_off || themeVars.logical_off;
      const switchOn = cfg.switch_color_on || themeVars.switch_on || logicalOn;
      const switchOff = cfg.switch_color_off || themeVars.switch_off || logicalOff;
      const climateHeat = cfg.climate_color_heat || themeVars.climate_heat || logicalOn;
      const climateCool = cfg.climate_color_cool || themeVars.climate_cool || logicalOn;
      const climateIdle = cfg.climate_color_idle || themeVars.climate_idle || logicalOff;

      const rows = this.querySelectorAll(".raptor-bar-row");

      rows.forEach((row) => {
        const idx = Number(row.getAttribute("data-index"));
        const entry = cfg.entities[idx];
        const entityConfigRaw = typeof entry === "string" ? { entity: entry } : entry;
        const entityConfig = { ...entityConfigRaw }; // safe copy
        const entityId = entityConfig.entity;
        const stateObj = this._hass.states[entityId];

        if (!stateObj) {
          row.style.display = "none";
          return;
        }
        row.style.display = "";

        const attrs = stateObj.attributes;
        const domain = stateObj.entity_id.split(".")[0];

        const iconEl = row.querySelector(".raptor-bar-label ha-icon");
        const nameEl = row.querySelector(".raptor-bar-label .name");
        const barWrapper = row.querySelector(".raptor-bar-wrapper");
        const barFill = row.querySelector(".raptor-bar-fill");
        const multiFill = row.querySelector(".raptor-bar-fill-multi");
        const markerEl = row.querySelector(".raptor-bar-marker");
        const labelInsideEl = row.querySelector(".raptor-bar-inner-text .label-inside");
        const valueInsideEl = row.querySelector(".raptor-bar-inner-text .value-inside");
        const valueEl = row.querySelector(".raptor-bar-value");
        const minmaxEl = row.querySelector(".raptor-bar-minmax");

        const name =
          entityConfig.name ||
          attrs.friendly_name ||
          entityId;

        const icon = this._computeIcon(entityConfig, stateObj);
        const valueText = this._formatValue(stateObj, entityConfig);

        // show/hide icône par entité
        const showIconEntry =
          entityConfig.show_icon !== undefined ? entityConfig.show_icon : cfg.show_icon !== false;
        if (iconEl) {
          if (showIconEntry) {
            iconEl.style.display = "";
            iconEl.setAttribute("icon", icon);
          } else {
            iconEl.style.display = "none";
          }
        }

        // show/hide name global + per entity
        const showNameEntry =
          entityConfig.show_name !== undefined ? entityConfig.show_name : cfg.show_name !== false;
        if (nameEl) {
          if (showNameEntry) {
            nameEl.style.display = "";
            nameEl.textContent = name;
            nameEl.title = name;
          } else {
            nameEl.style.display = "none";
          }
        }

        // show/hide bar
        const showBarEntry =
          entityConfig.show_bar !== undefined ? entityConfig.show_bar : cfg.show_bar !== false;
        row.classList.toggle("no-bar", !showBarEntry);

        // texte valeur
        const showValueEntry =
          entityConfig.show_value || cfg.show_value || "auto";

        if (valueEl) {
          if (showValueEntry === "never") {
            valueEl.textContent = "";
          } else {
            valueEl.textContent = valueText;
          }
        }
        if (valueInsideEl) {
          if (showValueEntry === "never") {
            valueInsideEl.textContent = "";
          } else {
            valueInsideEl.textContent = valueText;
          }
        }

        // value_position / name_position (ligne + override entité)
        const namePos = (entityConfig.name_position || cfg.name_position || "left").toLowerCase();
        const valuePos = (entityConfig.value_position || cfg.value_position || "right").toLowerCase();

        row.classList.toggle("name-inside", namePos === "inside");
        row.classList.toggle("value-inside", valuePos === "inside");
        row.classList.toggle("value-below", valuePos === "below");

        if (labelInsideEl) {
          labelInsideEl.textContent = name;
        }

        // orientation & direction
        const orientation = (entityConfig.orientation || cfg.orientation || "horizontal").toLowerCase();
        const barDir = (entityConfig.bar_direction || cfg.bar_direction || "ltr").toLowerCase();
        const invertFill = entityConfig.invert_fill !== undefined
          ? !!entityConfig.invert_fill
          : !!cfg.invert_fill;

        row.classList.toggle("vertical", orientation === "vertical");
        if (barWrapper) {
          barWrapper.classList.toggle("rtl", barDir === "rtl" && orientation !== "vertical");
          barWrapper.classList.toggle("vertical", orientation === "vertical");
        }

        // on/off pour style
        let isOn = false;
        if (["switch", "light", "input_boolean", "fan"].includes(domain)) {
          isOn = stateObj.state === "on";
        } else if (domain === "cover") {
          isOn = stateObj.state === "open" || stateObj.state === "opening";
        } else if (domain === "binary_sensor") {
          isOn = stateObj.state === "on";
        }

        row.classList.toggle("on", isOn);
        row.classList.toggle("off", !isOn);

        // valeur numérique principale
        let rawValue = NaN;
        let hasNumeric = false;

        if (entityConfig.mode === "person_distance") {
          const d = this._computePersonDistanceKm(stateObj);
          if (!Number.isNaN(d)) {
            rawValue = d;
            hasNumeric = true;
          }
        } else if (domain === "climate") {
          const target = attrs.temperature || attrs.target_temperature || attrs.target_temp;
          const num = parseFloat(target);
          if (!Number.isNaN(num)) {
            rawValue = num;
            hasNumeric = true;
          }
        } else if (domain === "cover" && attrs.current_position != null) {
          const num = parseFloat(attrs.current_position);
          if (!Number.isNaN(num)) {
            rawValue = num;
            hasNumeric = true;
          }
        } else {
          const num = parseFloat(stateObj.state);
          if (!Number.isNaN(num)) {
            rawValue = num;
            hasNumeric = true;
          }
        }

        let min = entityConfig.min;
        let max = entityConfig.max;

        if (hasNumeric) {
          if (min == null || max == null) {
            if (domain === "cover" || attrs.unit_of_measurement === "%") {
              if (min == null) min = 0;
              if (max == null) max = 100;
            } else if (domain === "climate") {
              const minAttr = attrs.min_temp ?? attrs.min_temperature;
              const maxAttr = attrs.max_temp ?? attrs.max_temperature;
              if (min == null && minAttr != null) min = Number(minAttr);
              if (max == null && maxAttr != null) max = Number(maxAttr);
            }
          }
        }

        // pour person_distance, l'utilisateur doit mettre min/max dans le YAML
        let pct = null;
        if (hasNumeric && min != null && max != null && max > min) {
          pct = ((rawValue - min) / (max - min)) * 100;
          if (pct < 0) pct = 0;
          if (pct > 100) pct = 100;
        } else if (!hasNumeric && ["switch", "light", "input_boolean", "fan", "binary_sensor"].includes(domain)) {
          pct = isOn ? 100 : 0;
        }

        // inversion éventuelle
        if (pct != null && invertFill) {
          pct = 100 - pct;
        }

        // couleur de la barre
        let barColor = entityConfig.bar_color || cfg.bar_color;
        let bgColor = cfg.bar_background || "rgba(255,255,255,0.07)";

        // severities
        if (hasNumeric && (entityConfig.severity || entityConfig.severities)) {
          const sevs = entityConfig.severity || entityConfig.severities;
          if (Array.isArray(sevs)) {
            for (const s of sevs) {
              const from = s.from ?? -Infinity;
              const to = s.to ?? Infinity;
              if (rawValue >= from && rawValue < to && s.color) {
                barColor = s.color;
                break;
              }
            }
          }
        }

        // Cas spécifique climate (couleur selon hvac + icône)
        if (domain === "climate") {
          const hvac = (attrs.hvac_action || stateObj.state || "").toLowerCase();
          if (hvac === "heating" || hvac === "heat") {
            barColor = entityConfig.heat_color || climateHeat;
          } else if (hvac === "cooling" || hvac === "cool") {
            barColor = entityConfig.cool_color || climateCool;
          } else {
            barColor = climateIdle;
          }
          if (iconEl && showIconEntry) {
            iconEl.style.color = barColor;
          }
        } else {
          if (iconEl) iconEl.style.color = "";
        }

        // Binaire : color_on / color_off + bar_bg_on/off
        if (["switch", "light", "input_boolean", "fan", "binary_sensor"].includes(domain)) {
          if (isOn) {
            barColor =
              entityConfig.bar_color_on ||
              entityConfig.color_on ||
              switchOn ||
              logicalOn ||
              barColor;
            bgColor =
              entityConfig.bar_bg_on ||
              cfg.bar_background ||
              "rgba(255,255,255,0.07)";
          } else {
            barColor =
              entityConfig.bar_color_off ||
              entityConfig.color_off ||
              switchOff ||
              logicalOff ||
              "rgba(255,255,255,0.18)";
            bgColor =
              entityConfig.bar_bg_off ||
              cfg.bar_background_off ||
              "rgba(15,23,42,0.25)";
          }
        }

        // --- NOUVEAU : barres multi-segments (stacked) ---
        let stackedSegments = null;
        let stackedMax = null;

        if (Array.isArray(entityConfig.stacked) && entityConfig.stacked.length > 0) {
          stackedSegments = [];

          entityConfig.stacked.forEach((segRaw) => {
            const segCfg = typeof segRaw === "string" ? { entity: segRaw } : segRaw;
            if (!segCfg.entity) return;
            const segState = this._hass.states[segCfg.entity];
            if (!segState) return;
            const v = parseFloat(segState.state);
            if (Number.isNaN(v)) return;

            const segName =
              segCfg.name ||
              (segState.attributes && segState.attributes.friendly_name) ||
              segCfg.entity;

            stackedSegments.push({
              id: segCfg.entity,
              cfg: segCfg,
              name: segName,
              value: v,
            });
          });

          if (stackedSegments.length > 0) {
            stackedMax = entityConfig.max != null ? Number(entityConfig.max) : null;
            if (stackedMax == null || !Number.isFinite(stackedMax) || stackedMax <= 0) {
              // si pas de max défini → somme des segments comme référence
              stackedMax = stackedSegments.reduce((acc, s) => acc + s.value, 0);
            }
            if (stackedMax <= 0) {
              stackedSegments = null;
              stackedMax = null;
            }
          } else {
            stackedSegments = null;
          }
        }

        if (multiFill) {
          multiFill.innerHTML = "";
        }
        if (barWrapper) {
          barWrapper.classList.remove("stacked");
        }

        if (stackedSegments && stackedMax && barWrapper && multiFill && showBarEntry) {
          barWrapper.classList.add("stacked");

          const stackOrientation = (entityConfig.orientation || cfg.orientation || "horizontal").toLowerCase();
          const stackOrder = (entityConfig.stack_order || "as_list").toLowerCase();

          if (stackOrder === "asc") {
            stackedSegments.sort((a, b) => a.value - b.value);
          } else if (stackOrder === "desc") {
            stackedSegments.sort((a, b) => b.value - a.value);
          }

          stackedSegments.forEach((seg) => {
            let partPct = (seg.value / stackedMax) * 100;
            if (partPct < 0) partPct = 0;
            if (partPct > 100) partPct = 100;

            const segEl = document.createElement("div");
            segEl.classList.add("raptor-bar-segment");

            if (stackOrientation === "vertical") {
              segEl.style.height = partPct + "%";
              segEl.style.width = "100%";
            } else {
              segEl.style.width = partPct + "%";
              segEl.style.height = "100%";
            }

            const segColor =
              seg.cfg.color ||
              seg.cfg.bar_color ||
              seg.cfg.color_on ||
              barColor ||
              "var(--primary-color)";

            segEl.style.background = segColor;
            segEl.title = `${seg.name}: ${seg.value}`;

            multiFill.appendChild(segEl);
          });
        }

        if (barWrapper) {
          barWrapper.style.background = bgColor;
        }

        if (barFill) {
          if (cfg.animation === "none" || entityConfig.animation === "none") {
            barFill.parentElement?.classList.add("no-animation");
          }
          barFill.style.setProperty("--bar-color", barColor || "var(--primary-color)");

          if (pct == null || !showBarEntry || (stackedSegments && stackedMax)) {
            if (orientation === "vertical") {
              barFill.style.height = "0%";
              barFill.style.width = "100%";
            } else {
              barFill.style.width = "0%";
              barFill.style.height = "100%";
            }
          } else {
            if (orientation === "vertical") {
              barFill.style.height = pct + "%";
              barFill.style.width = "100%";
            } else {
              barFill.style.width = pct + "%";
              barFill.style.height = "100%";
            }
          }
        }

        // dual marker pour entity_b
        if (markerEl) {
          markerEl.style.opacity = "0";
          const secondId = entityConfig.entity_b;
          if (secondId && this._hass.states[secondId] && min != null && max != null && max > min) {
            const stateB = this._hass.states[secondId];
            let rawB = NaN;
            const numB = parseFloat(stateB.state);
            if (!Number.isNaN(numB)) {
              rawB = numB;
            }
            if (!Number.isNaN(rawB)) {
              let pctB = ((rawB - min) / (max - min)) * 100;
              if (pctB < 0) pctB = 0;
              if (pctB > 100) pctB = 100;

              if (invertFill) {
                pctB = 100 - pctB;
              }

              if (orientation === "vertical") {
                markerEl.style.left = "0";
                markerEl.style.right = "0";
                markerEl.style.width = "100%";
                markerEl.style.height = "2px";
                markerEl.style.bottom = pctB + "%";
              } else {
                markerEl.style.top = "0";
                markerEl.style.bottom = "0";
                markerEl.style.width = "2px";
                // en rtl, le marker suit la même logique visuelle que la barre
                if ((entityConfig.bar_direction || cfg.bar_direction || "ltr").toLowerCase() === "rtl") {
                  markerEl.style.left = "";
                  markerEl.style.right = pctB + "%";
                } else {
                  markerEl.style.left = pctB + "%";
                  markerEl.style.right = "";
                }
              }
              markerEl.style.opacity = "1";
            }
          }
        }

        if (minmaxEl && cfg.show_minmax) {
          if (min != null && max != null) {
            minmaxEl.textContent = `${min} – ${max}`;
          } else {
            minmaxEl.textContent = "";
          }
        }
      });
    }
  }

  customElements.define("raptor-bar-next-card", RaptorBarNextCard);
}
