/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Comprehensive Special Days of the Year Service
 * Global Observances, Equinoxes & Solstices, Faith & Spiritual Holy Days, and Discipline Milestones.
 */

export interface SpecialDay {
  id: string;
  name: string;
  dateStr: string; // MM-DD format for annual recurring or YYYY-MM-DD
  category: 'global' | 'astronomical' | 'christian' | 'islamic' | 'discipline';
  significance: string;
  disciplineAction: string;
}

// Annual recurring special days (MM-DD)
export const SPECIAL_DAYS_REGISTRY: SpecialDay[] = [
  // January
  {
    id: 'jan_1',
    name: "New Year's Day & Universal Alignment",
    dateStr: '01-01',
    category: 'discipline',
    significance: 'Global commencement of annual life architecture and resolution vows.',
    disciplineAction: 'Conduct annual goal calibration and initiate clean habit streaks.'
  },
  {
    id: 'jan_6',
    name: 'Epiphany / Theophany',
    dateStr: '01-06',
    category: 'christian',
    significance: 'Manifestation of spiritual divine light and wisdom.',
    disciplineAction: 'Morning meditation on clarity, truth, and spiritual purpose.'
  },
  {
    id: 'jan_24',
    name: 'International Day of Education',
    dateStr: '01-24',
    category: 'global',
    significance: 'UN recognition of knowledge and intellectual self-cultivation.',
    disciplineAction: 'Dedicate 90 minutes of uninterrupted technical deep reading.'
  },

  // February
  {
    id: 'feb_20',
    name: 'World Day of Social Justice',
    dateStr: '02-20',
    category: 'global',
    significance: 'Upholding fairness, human dignity, and communal balance.',
    disciplineAction: 'Perform an act of service and audit ethical stewardship.'
  },
  {
    id: 'feb_21',
    name: 'International Mother Language Day',
    dateStr: '02-21',
    category: 'global',
    significance: 'Preservation of heritage, linguistic eloquence, and ancestral discipline.',
    disciplineAction: 'Practice mindful speech discipline and linguistic precision.'
  },

  // March
  {
    id: 'mar_8',
    name: "International Women's Day",
    dateStr: '03-08',
    category: 'global',
    significance: 'Celebrating resilience, maternal strength, and global leadership.',
    disciplineAction: 'Express gratitude to matriarchs and mentors who shaped your foundation.'
  },
  {
    id: 'mar_20',
    name: 'Vernal (Spring) Equinox',
    dateStr: '03-20',
    category: 'astronomical',
    significance: 'Equal day and night across the Earth; seasonal rebirth and biological renewal.',
    disciplineAction: 'Harmonize circadian rhythm with sunrise; detox workspace clutter.'
  },
  {
    id: 'mar_21',
    name: 'World Poetry & Harmony Day',
    dateStr: '03-21',
    category: 'global',
    significance: 'Cultivation of cymatic aesthetic resonance and contemplative thought.',
    disciplineAction: 'Write a reflection journal page; eliminate toxic digital inputs.'
  },
  {
    id: 'mar_22',
    name: 'World Water Day',
    dateStr: '03-22',
    category: 'global',
    significance: 'Sanctity of life-sustaining water and physiological purity.',
    disciplineAction: 'Commit to 3.5 liters of clean water hydration; practice mindful ablution.'
  },

  // April
  {
    id: 'apr_7',
    name: 'World Health Day',
    dateStr: '04-07',
    category: 'global',
    significance: 'Prioritizing biological vitality, mental fortitude, and cardiovascular discipline.',
    disciplineAction: 'Perform intense physical conditioning and schedule health audits.'
  },
  {
    id: 'apr_22',
    name: 'Earth Day & Planetary Stewardship',
    dateStr: '04-22',
    category: 'global',
    significance: 'Reverence for the natural biosphere and environmental discipline.',
    disciplineAction: 'Spend 45 minutes outdoors without devices; ground your physiology.'
  },

  // May
  {
    id: 'may_1',
    name: 'International Workers & Craftsmanship Day',
    dateStr: '05-01',
    category: 'discipline',
    significance: 'Dignity of honest labor, engineering mastery, and diligent execution.',
    disciplineAction: 'Review professional milestones; eliminate procrastinating tasks.'
  },
  {
    id: 'may_15',
    name: 'International Day of Families',
    dateStr: '05-15',
    category: 'global',
    significance: 'Strengthening familial bonds and household foundation.',
    disciplineAction: 'Disconnect devices during evening dinner; hold present family communion.'
  },

  // June
  {
    id: 'jun_5',
    name: 'World Environment Day',
    dateStr: '06-05',
    category: 'global',
    significance: 'Purifying human habitats and eliminating material waste.',
    disciplineAction: 'Execute full physical workspace deep-clean and room makeover.'
  },
  {
    id: 'jun_21',
    name: 'Summer Solstice (Longest Solar Day)',
    dateStr: '06-21',
    category: 'astronomical',
    significance: 'Peak solar zenith in the Northern Hemisphere; solar vigor and high energy.',
    disciplineAction: 'Early morning sunlight exposure; conduct mid-year discipline audit.'
  },

  // July
  {
    id: 'jul_1',
    name: 'Mid-Year Life Architecture Audit',
    dateStr: '07-01',
    category: 'discipline',
    significance: 'Halfway mark of the calendar year; honest evaluation of commitments.',
    disciplineAction: 'Audit Q1-Q2 goals; recalibrate routine anchors and financial budget.'
  },
  {
    id: 'jul_15',
    name: 'World Youth Skills Day',
    dateStr: '07-15',
    category: 'global',
    significance: 'Empowerment through technical craft, coding, and artisanal mastery.',
    disciplineAction: 'Sharpen a technical core competency with 2 hours of focused coding.'
  },

  // August
  {
    id: 'aug_12',
    name: 'International Youth Day',
    dateStr: '08-12',
    category: 'global',
    significance: 'Generational energy and future-shaping discipline.',
    disciplineAction: 'Mentor someone in self-discipline or document a technical guide.'
  },
  {
    id: 'aug_19',
    name: 'World Humanitarian Day',
    dateStr: '08-19',
    category: 'global',
    significance: 'Selfless charity, compassion, and communal assistance.',
    disciplineAction: 'Give anonymous charity or voluntary assistance to someone in need.'
  },

  // September
  {
    id: 'sep_8',
    name: 'International Literacy & Wisdom Day',
    dateStr: '09-08',
    category: 'global',
    significance: 'Cultivating cognitive depth and reading comprehension.',
    disciplineAction: 'Read two chapters from scripture or foundational engineering books.'
  },
  {
    id: 'sep_21',
    name: 'International Day of Peace & Stillness',
    dateStr: '09-21',
    category: 'global',
    significance: 'Cessation of internal and external conflicts; spiritual serenity.',
    disciplineAction: 'Practice complete silence for 30 minutes; forgive a grievance.'
  },
  {
    id: 'sep_22',
    name: 'Autumnal Equinox (Harvest Balance)',
    dateStr: '09-22',
    category: 'astronomical',
    significance: 'Solar equilibrium; preparation for inward contemplation and harvest.',
    disciplineAction: 'Gather the fruits of your summer labor; organize archive storage.'
  },

  // October
  {
    id: 'oct_1',
    name: 'Quarterly Strategic Reset (Q4 Horizon)',
    dateStr: '10-01',
    category: 'discipline',
    significance: 'Commencement of the final quarter; sprint toward yearly completion.',
    disciplineAction: 'Define 3 critical non-negotiable deliverables for year-end.'
  },
  {
    id: 'oct_10',
    name: 'World Mental Health & Mind Fortitude Day',
    dateStr: '10-10',
    category: 'global',
    significance: 'Guarding neural health against anxiety, sensory overwhelm, and burnout.',
    disciplineAction: 'Initiate a 24-hour social media blackout and deep focus meditation.'
  },

  // November
  {
    id: 'nov_1',
    name: 'All Saints & Martyrs Commemoration',
    dateStr: '11-01',
    category: 'christian',
    significance: 'Remembering righteous ancestors, saints, and spiritual exemplars.',
    disciplineAction: 'Reflect upon the courage and sacrifices of historical men of faith.'
  },
  {
    id: 'nov_20',
    name: 'Universal Children & Legacy Day',
    dateStr: '11-20',
    category: 'global',
    significance: 'Building a virtuous legacy and safe world for the next generation.',
    disciplineAction: 'Invest time teaching discipline and wisdom to the young.'
  },

  // December
  {
    id: 'dec_10',
    name: 'Human Rights & Dignity Day',
    dateStr: '12-10',
    category: 'global',
    significance: 'Commemorating the Universal Declaration of Human Rights.',
    disciplineAction: 'Uphold strict integrity in all agreements, promises, and transactions.'
  },
  {
    id: 'dec_21',
    name: 'Winter Solstice (Longest Night)',
    dateStr: '12-21',
    category: 'astronomical',
    significance: 'Solar nadir; turning point where daylight begins to re-expand.',
    disciplineAction: 'Deep solitary meditation on resilience through dark trials.'
  },
  {
    id: 'dec_24',
    name: 'Christmas Eve / Night Vigil',
    dateStr: '12-24',
    category: 'christian',
    significance: 'Holy anticipation of peace, humility, and divine reconciliation.',
    disciplineAction: 'Evening vigil with family; vocalize gratitude for spiritual mercies.'
  },
  {
    id: 'dec_25',
    name: 'Nativity of Jesus Christ (Christmas)',
    dateStr: '12-25',
    category: 'christian',
    significance: 'Celebration of the Incarnation of Christ, Prince of Peace.',
    disciplineAction: 'Joyful family communion, sharing meals, and devotional prayer.'
  },
  {
    id: 'dec_31',
    name: 'Year-End Comprehensive Life Audit',
    dateStr: '12-31',
    category: 'discipline',
    significance: 'Final accounting of time, finance, spiritual growth, and health.',
    disciplineAction: 'Review the year ledger, thank God for survival, and seal new vows.'
  }
];

// Major Islamic Calendar dynamic calculation or approximate observances for 2026/2027
export const ISLAMIC_SPECIAL_DAYS_2026: SpecialDay[] = [
  {
    id: 'is_isra_2026',
    name: "Isra and Mi'raj (The Night Journey & Ascension)",
    dateStr: '01-16',
    category: 'islamic',
    significance: 'Commemoration of the miraculous journey and institutional establishment of the 5 daily prayers.',
    disciplineAction: 'Offer voluntary night tahajjud prayer and renew commitment to Salah.'
  },
  {
    id: 'is_ramadan_2026',
    name: 'First Day of Holy Ramadan (Fasting Month)',
    dateStr: '02-18',
    category: 'islamic',
    significance: 'The holiest month of fasting, Qur’an revelation, and soul purification.',
    disciplineAction: 'Initiate strict dawn-to-dusk fasting, charity, and complete discipline.'
  },
  {
    id: 'is_laylat_2026',
    name: 'Laylat al-Qadr (Night of Power)',
    dateStr: '03-16',
    category: 'islamic',
    significance: 'The night better than a thousand months; descent of angels and divine mercy.',
    disciplineAction: 'Engage in all-night worship, Qur’an recitation, and supplication.'
  },
  {
    id: 'is_eid_fitr_2026',
    name: 'Eid al-Fitr (Celebration of Fast-Breaking)',
    dateStr: '03-20',
    category: 'islamic',
    significance: 'Joyous thanksgiving for completing the discipline of Ramadan.',
    disciplineAction: 'Pay Zakat al-Fitr, attend congregational Eid Salah, and feast with loved ones.'
  },
  {
    id: 'is_arafah_2026',
    name: 'Day of Arafah (Peak of Hajj)',
    dateStr: '05-26',
    category: 'islamic',
    significance: 'The greatest day of forgiveness; pilgrims gather at Mount Arafat.',
    disciplineAction: 'Fast the Day of Arafah (expiation for past and upcoming years).'
  },
  {
    id: 'is_eid_adha_2026',
    name: 'Eid al-Adha (Feast of the Sacrifice)',
    dateStr: '05-27',
    category: 'islamic',
    significance: 'Honoring Ibrahim’s profound obedience and ultimate trust in God.',
    disciplineAction: 'Offer Qurbani sacrifice, distribute meat to the poor, and praise Allah.'
  },
  {
    id: 'is_hijri_2026',
    name: 'Islamic New Year (1 Muharram 1448 AH)',
    dateStr: '06-16',
    category: 'islamic',
    significance: 'Commemoration of the Hijrah (migration) to Madinah and new beginnings.',
    disciplineAction: 'Set spiritual resolutions for the upcoming Hijri year.'
  },
  {
    id: 'is_ashura_2026',
    name: 'Day of Ashura (10 Muharram)',
    dateStr: '06-25',
    category: 'islamic',
    significance: 'Deliverance of Musa (Moses) and the Israelites from Pharaoh.',
    disciplineAction: 'Observe voluntary fast of Ashura with gratitude for deliverance.'
  },
  {
    id: 'is_mawlid_2026',
    name: 'Mawlid al-Nabi (Birth of Prophet Muhammad pbuh)',
    dateStr: '08-25',
    category: 'islamic',
    significance: 'Reflecting on the exemplary character, mercy, and discipline of the Prophet.',
    disciplineAction: 'Send abundant blessings (Salawat) upon the Prophet and study Seerah.'
  }
];

// Helper to look up special days for a specific date (YYYY-MM-DD or MM-DD)
export function getSpecialDaysForDate(dateStr: string): SpecialDay[] {
  const parts = dateStr.split('-');
  const mmdd = parts.length === 3 ? `${parts[1]}-${parts[2]}` : dateStr;

  const annualMatches = SPECIAL_DAYS_REGISTRY.filter(d => d.dateStr === mmdd);
  const islamicMatches = ISLAMIC_SPECIAL_DAYS_2026.filter(d => d.dateStr === mmdd);

  return [...annualMatches, ...islamicMatches];
}

// Helper to check if a month has special days (month: 0-11)
export function getSpecialDaysForMonth(month: number): SpecialDay[] {
  const targetMonthStr = String(month + 1).padStart(2, '0');
  const annualMatches = SPECIAL_DAYS_REGISTRY.filter(d => d.dateStr.startsWith(targetMonthStr));
  const islamicMatches = ISLAMIC_SPECIAL_DAYS_2026.filter(d => d.dateStr.startsWith(targetMonthStr));

  return [...annualMatches, ...islamicMatches];
}
