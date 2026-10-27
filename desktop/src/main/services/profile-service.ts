import fs from 'fs';
import path from 'path';

export interface TvProfile {
  id: string;
  name: string;
  debloatListPath: string;
  packages: string[];
}

export const DEFAULT_PROFILES: TvProfile[] = [
  {
    id: 'coocaa-swtv-24ae-4k',
    name: 'Coocaa SWTV-24AE-4K',
    debloatListPath: 'builtin',
    packages: [
      'com.smartdevice.recommendation',
      'com.smartdevice.recordactivation',
      'com.smartdevice.dailymanage',
      'com.smartdevice.dailyshortcut',
      'com.smartdevice.aftersale',
      'com.Smartdevice.emanual',
      'com.smartdevice.myapp',
      'com.smartdevice.factory',
      'com.sky.market',
      'com.smartdevice.leanbacklauncher.customizer',
      'com.mediatek.tv.retaildemo',
      'com.mercadolibre.android.mplay_tv',
      'com.google.android.feedback'
    ]
  },
  {
    id: 'xiaomi-mi-tv-4a',
    name: 'Xiaomi Mi TV 4A',
    debloatListPath: 'builtin',
    packages: [
      'com.miui.tv.analytics',
      'com.xiaomi.statistic',
      'com.mitv.tvhome.atv',
      'com.mitv.tvhome.michannel',
      'com.mitv.tvhome.mitvplus',
      'com.xm.webcontent',
      'com.xiaomi.floatingframe',
      'com.xiaomi.mitv.tvmanager',
      'com.xiaomi.mitv.smartshare',
      'com.mitv.milinkservice',
      'com.xiaomi.mitv.updateservice',
      'com.xiaomi.amazon.alexa',
      'android.autoinstalls.config.xiaomi.amelie',
      'com.xiaomi.mimusic2',
      'com.google.android.play.games',
      'com.google.android.feedback',
      'com.google.android.apps.tachyon',
      'fusion.android.tv.demo',
      'com.google.android.tvlauncher',
      'com.google.android.tvrecommendations',
      'com.google.android.leanbacklauncher.recommendations'
    ]
  },
  {
    id: 'xiaomi-mitv-axso0',
    name: 'Xiaomi MiTV AXSO0',
    debloatListPath: 'builtin',
    packages: [
      'com.miui.tv.analytics',
      'com.xiaomi.statistic',
      'com.google.android.feedback',
      'com.google.android.tv.bugreportsender',
      'com.mitv.tvhome.atv',
      'com.xm.webcontent',
      'com.xiaomi.floatingframe',
      'com.google.android.tvrecommendations',
      'com.google.android.leanbacklauncher.recommendations',
      'android.autoinstalls.config.xioami.dangal',
      'com.xiaomi.mitv.tvmanager',
      'com.xiaomi.mitv.handbook',
      'com.xiaomi.mitv.updateservice',
      'com.google.android.katniss',
      'com.google.android.speech.pumpkin',
      'com.google.android.apps.mediashell',
      'com.mitv.milinkservice',
      'com.xiaomi.mitv.smartshare',
      'com.xiaomi.wfdsinkhelperservice',
      'com.xiaomi.mimusic2',
      'com.google.android.play.games',
      'com.google.android.videos',
      'com.mitv.gallery',
      'com.fancode.tv',
      'com.suntv.sunnxt.mitv',
      'com.eros.mitv',
      'com.discoveryplus.mitv',
      'com.ddnational.prasarbharati',
      'net.aljazeera.english'
    ]
  },
  {
    id: 'tcl-g10-google-tv',
    name: 'TCL G10 Google TV',
    debloatListPath: 'builtin',
    packages: [
      'com.tcl.tv.plus',
      'com.tcl.channelplus',
      'com.tcl.tv.tclhome_passive',
      'com.tcl.partnercustomizer',
      'com.tcl.interactive',
      'com.tcl.smartlink.core',
      'com.tcl.exhibit',
      'com.tcl.esticker',
      'com.tcl.ocean.instructions',
      'com.tcl.repairguide',
      'com.tcl.gamebar',
      'com.tcl.ui_mediaCenter',
      'com.tcl.UpdatePeripheral',
      'android.autoinstalls.config.google.gtvpai',
      'com.google.android.feedback',
      'com.google.android.marvin.talkback',
      'com.google.android.apps.tv.dreamx',
      'com.google.android.tv.remote.service'
    ]
  },
  {
    id: 'oneplus-tv-dubai',
    name: 'OnePlus TV Dubai',
    debloatListPath: 'builtin',
    packages: [
      'com.google.android.feedback',
      'com.heytap.olink',
      'oneplus.smarthome',
      'com.heytap.tv.assistant.oneplus',
      'com.heytap.tv.btspeaker',
      'com.heytap.tv.filebrowser',
      'com.oneplus.tv.launcher',
      'com.tcl.browser',
      'com.google.android.tvlauncher',
      'com.google.android.tvrecommendations'
    ]
  },
  {
    id: 'sanyo-atv-r2',
    name: 'Sanyo ATV-R2',
    debloatListPath: 'builtin',
    packages: [
      'com.apps.function.gdpr',
      'com.vewd.core.service',
      'com.google.android.feedback',
      'com.google.android.tv.bugreportsender',
      'com.apps.channels',
      'com.apps.eshow',
      'com.google.android.tvrecommendations',
      'com.google.android.leanbacklauncher.recommendations',
      'com.realtek.leanbacklauncher.partnercustomizer',
      'android.autoinstalls.config.scbc.device',
      'com.apps.clear',
      'com.google.android.apps.nbu.smartconnect.tv',
      'com.apps.wifihotspot',
      'com.android.printspooler',
      'com.apps.networkspeed',
      'com.apps.ota',
      'com.apps.authota',
      'com.accuweather.android',
      'map.finder',
      'com.apps.timeclock',
      'com.google.android.videos',
      'com.google.android.play.games',
      'com.yupptv.androidtv',
      'com.spotify.tv.android',
      'tunein.player',
      'com.appgeneration.itunerfree',
      'com.nousguide.android.rbtv',
      'com.poovarasan.tv.tamiltv',
      'com.google.android.tvlauncher'
    ]
  }
];

export class ProfileService {
  public static parseDebloatLines(rawText: string): string[] {
    return rawText
      .split('\n')
      .map(line => {
        const withoutComment = line.replace(/#.*$/, '').trim();
        return withoutComment;
      })
      .filter(line => line.length > 0);
  }

  public static formatProfileName(id: string): string {
    return id
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  public static loadFromDirectory(examplesDir: string): TvProfile[] {
    if (!examplesDir || !fs.existsSync(examplesDir)) {
      return DEFAULT_PROFILES;
    }

    try {
      const entries = fs.readdirSync(examplesDir, { withFileTypes: true });
      const profiles: TvProfile[] = [];

      for (const ent of entries) {
        if (ent.isDirectory()) {
          const debloatPath = path.join(examplesDir, ent.name, 'debloat.txt');
          if (fs.existsSync(debloatPath)) {
            const raw = fs.readFileSync(debloatPath, 'utf8');
            const packages = this.parseDebloatLines(raw);
            profiles.push({
              id: ent.name,
              name: this.formatProfileName(ent.name),
              debloatListPath: debloatPath,
              packages
            });
          }
        }
      }

      return profiles.length > 0 ? profiles : DEFAULT_PROFILES;
    } catch {
      return DEFAULT_PROFILES;
    }
  }
}
