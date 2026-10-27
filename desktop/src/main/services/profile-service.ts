import fs from 'fs';
import path from 'path';

export interface TvProfile {
  id: string;
  name: string;
  debloatListPath: string;
  packages: string[];
}

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
    if (!fs.existsSync(examplesDir)) return [];

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

    return profiles;
  }
}
