/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Governance Templates Library for Cymatic Discipline OS
 * Comprehensive editable draft templates across Household, Education, Corporate, Athletic, and Social Clubs.
 * Each template provides editable commands, titles, targets, times, arguments, dates, and assigned tasks/routines.
 */

import { ContractAssignedTask, ContractDateRange } from './governanceService';

export interface GovernanceTemplate {
  id: string;
  category: 'household' | 'educational' | 'corporate' | 'sports_team' | 'social_club';
  title: string;
  badge: string;
  icon: string;
  tagline: string;
  description: string;
  defaultStartTime: string;
  defaultEndTime: string;
  activeDays: string[];
  excludedDays: string[];
  blockNudity: boolean;
  assignedTasks: ContractAssignedTask[];
}

export const GOVERNANCE_TEMPLATES: GovernanceTemplate[] = [
  // 1. Household & Family
  {
    id: 'tpl_household_study',
    category: 'household',
    title: 'Family Evening Study & Bedtime Harmony',
    badge: 'Household & Family',
    icon: 'Home',
    tagline: 'Domestic routine protecting study hours and restful sleep hygiene.',
    description: 'Enforces a serene evening window for children and family members, replacing doom-scrolling with homework focus, family conversation, and restful bedtime sleep.',
    defaultStartTime: '18:30',
    defaultEndTime: '21:30',
    activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'sunday'],
    excludedDays: ['saturday'],
    blockNudity: true,
    assignedTasks: [
      {
        id: 'task_home_1',
        title: 'Evening Homework & Reading Block',
        description: 'Focus on school assignments, reading, and academic exercises.',
        startTime: '18:30',
        endTime: '20:00',
        category: 'deep_work',
        priority: 'high'
      },
      {
        id: 'task_home_2',
        title: 'Family Reflection & Dinner Discussion',
        description: 'Quality domestic time with devices set aside.',
        startTime: '20:00',
        endTime: '20:45',
        category: 'review',
        priority: 'medium'
      },
      {
        id: 'task_home_3',
        title: 'Bedtime Acoustic Wind-Down',
        description: 'Screen quench and 432 Hz sleep soundscape session.',
        startTime: '20:45',
        endTime: '21:30',
        category: 'spiritual',
        priority: 'critical'
      }
    ]
  },

  // 2. Educational Institutions
  {
    id: 'tpl_edu_exam',
    category: 'educational',
    title: 'Campus Academic Deep Focus & Examination Protocol',
    badge: 'Academic Institution',
    icon: 'GraduationCap',
    tagline: 'Structured classroom discipline suppressing notifications during instruction.',
    description: 'Designed for high schools, universities, and academies. Ensures students remain immersed in lectures, lab experiments, and library research without mobile notifications.',
    defaultStartTime: '08:30',
    defaultEndTime: '15:00',
    activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    excludedDays: ['saturday', 'sunday'],
    blockNudity: true,
    assignedTasks: [
      {
        id: 'task_edu_1',
        title: 'Morning STEM & Architectural Lab Session',
        description: 'Hands-on practical laboratory work and mathematical analysis.',
        startTime: '08:30',
        endTime: '11:30',
        category: 'deep_work',
        priority: 'critical'
      },
      {
        id: 'task_edu_2',
        title: 'Library Independent Research & Synthesis',
        description: 'Deep individual study and essay drafting.',
        startTime: '12:30',
        endTime: '14:00',
        category: 'architecture',
        priority: 'high'
      },
      {
        id: 'task_edu_3',
        title: 'Daily Synthesis Journaling & Review',
        description: 'Document key principles learned during the school day.',
        startTime: '14:15',
        endTime: '15:00',
        category: 'review',
        priority: 'medium'
      }
    ]
  },

  // 3. Corporate Organizations
  {
    id: 'tpl_corp_sprint',
    category: 'corporate',
    title: 'Engineering Sprint Deep Work & Confidentiality Pact',
    badge: 'Corporate Organization',
    icon: 'Briefcase',
    tagline: 'High-throughput development window prohibiting context-switching.',
    description: 'Tailored for software engineering squads, executive leadership, and creative teams. Protects unfragmented concentration blocks for sprint deliverables.',
    defaultStartTime: '09:30',
    defaultEndTime: '16:30',
    activeDays: ['monday', 'tuesday', 'wednesday', 'thursday'],
    excludedDays: ['friday', 'saturday', 'sunday'],
    blockNudity: true,
    assignedTasks: [
      {
        id: 'task_corp_1',
        title: 'Deep Architecture Coding Sprint',
        description: 'Uninterrupted programming and system implementation without Slack pings.',
        startTime: '09:30',
        endTime: '12:30',
        category: 'deep_work',
        priority: 'critical'
      },
      {
        id: 'task_corp_2',
        title: 'Peer Code Review & Bilateral Architecture Audit',
        description: 'Collaborative evaluation of pull requests and security boundaries.',
        startTime: '13:30',
        endTime: '15:00',
        category: 'review',
        priority: 'high'
      },
      {
        id: 'task_corp_3',
        title: 'Sprint Retrospective & Next-Day Planning',
        description: 'Synthesize blockers and set priority targets for tomorrow.',
        startTime: '15:30',
        endTime: '16:30',
        category: 'architecture',
        priority: 'medium'
      }
    ]
  },

  // 4. Athletic & Sports Team
  {
    id: 'tpl_sports_recovery',
    category: 'sports_team',
    title: 'Varsity Athletic Rest, Nutrition & Sleep Covenant',
    badge: 'Athletic Team',
    icon: 'Trophy',
    tagline: 'Nocturnal physical restoration and athletic recovery protocol.',
    description: 'Enforces disciplined recovery for athletes. Prohibits late-night screen illumination to maximize natural growth hormone and circadian rejuvenation.',
    defaultStartTime: '21:30',
    defaultEndTime: '06:30',
    activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    excludedDays: [],
    blockNudity: true,
    assignedTasks: [
      {
        id: 'task_sport_1',
        title: 'Post-Practice Mobility & Hydrotherapy Session',
        description: 'Cold therapy, stretching, and muscular rehabilitation.',
        startTime: '17:00',
        endTime: '18:00',
        category: 'fitness',
        priority: 'high'
      },
      {
        id: 'task_sport_2',
        title: 'Nocturnal Digital Rest & Circadian Recovery',
        description: 'Complete screen quarantine to protect deep sleep architecture.',
        startTime: '21:30',
        endTime: '06:30',
        category: 'spiritual',
        priority: 'critical'
      }
    ]
  },

  // 5. Social Club & Digital Detox
  {
    id: 'tpl_social_retreat',
    category: 'social_club',
    title: 'Weekend Digital Detox & Community Presence Covenant',
    badge: 'Social Club',
    icon: 'Users',
    tagline: 'Group retreat replacing feeds with genuine human connection and nature.',
    description: 'Organized for fraternities, outdoor clubs, and fellowship circles. Establishes a mutual pledge to put down mobile feeds during shared weekend adventures.',
    defaultStartTime: '09:00',
    defaultEndTime: '18:00',
    activeDays: ['saturday', 'sunday'],
    excludedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    blockNudity: true,
    assignedTasks: [
      {
        id: 'task_detox_1',
        title: 'Group Wilderness Trail & Mindful Hike',
        description: 'Scenic physical trek in nature with devices silenced.',
        startTime: '09:30',
        endTime: '12:30',
        category: 'fitness',
        priority: 'high'
      },
      {
        id: 'task_detox_2',
        title: 'Community Dialogue & Philosophical Book Circle',
        description: 'Shared reading and bilateral discussion without digital interruptions.',
        startTime: '14:00',
        endTime: '16:00',
        category: 'review',
        priority: 'medium'
      },
      {
        id: 'task_detox_3',
        title: 'Sunset Acoustic Soundscape Meditation',
        description: 'Ambient singing bowls and collective gratitude reflection.',
        startTime: '17:00',
        endTime: '18:00',
        category: 'spiritual',
        priority: 'high'
      }
    ]
  }
];
