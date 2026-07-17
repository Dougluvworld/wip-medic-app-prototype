import type { WeeklySchedule } from "./hours";

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  quote: string;
  verified?: boolean;
};

export type RatingBreakdown = { 5: number; 4: number; 3: number; 2: number; 1: number };

export type Provider = {
  id: string;
  name: string;
  type: "Pharmacy" | "GP" | "Urgent Care" | "Hospital";
  distanceKm: number;
  travelMin: number;
  rating: number; // 0 = unknown / not shown (prototype)
  reviews: number; // 0 = unknown / not shown (prototype)
  hours: string;
  openNow: boolean;
  schedule: WeeklySchedule; // Sun..Sat — drives real-time open/closed for the mock
  hoursVerified?: boolean; // when false, we label hours as "Sample"
  address: string;
  phone: string;
  lat?: number;
  lng?: number;
  badges?: string[];
  reviewList?: Review[];
  ratingBreakdown?: RatingBreakdown;
  updatedAgo?: string;
  sample?: boolean; // prototype flag — clearly labels sample providers in the UI
};

const daily = (open: number, close: number): WeeklySchedule =>
  [{ open, close }, { open, close }, { open, close }, { open, close }, { open, close }, { open, close }, { open, close }];
const weekdayOnly = (open: number, close: number): WeeklySchedule =>
  [null, { open, close }, { open, close }, { open, close }, { open, close }, { open, close }, null];
const alwaysOpen: WeeklySchedule = ["24h", "24h", "24h", "24h", "24h", "24h", "24h"];

// NOTE: These are illustrative "Sample" providers used to demonstrate the
// nearby-care experience in the prototype. Ratings, review counts and
// operating hours are intentionally left blank / marked as sample so we
// never present fabricated healthcare data as fact.
export const providers: Provider[] = [
  {
    id: "sample-pharmacy-1",
    name: "Sample Pharmacy — City Centre",
    type: "Pharmacy",
    distanceKm: 0.4,
    travelMin: 5,
    rating: 0,
    reviews: 0,
    hours: "Sample hours",
    openNow: true,
    address: "City Centre",
    phone: "",
    lat: 53.3494,
    lng: -6.2603,
    badges: [],
    updatedAgo: "",
    schedule: daily(8, 22),
    sample: true,
  },
  {
    id: "sample-gp-1",
    name: "Sample GP Surgery",
    type: "GP",
    distanceKm: 1.1,
    travelMin: 9,
    rating: 0,
    reviews: 0,
    hours: "Sample hours",
    openNow: true,
    address: "City Centre",
    phone: "",
    lat: 53.3467,
    lng: -6.2617,
    badges: [],
    updatedAgo: "",
    schedule: weekdayOnly(8.5, 18.5),
    sample: true,
  },
  {
    id: "sample-urgent-1",
    name: "Sample Urgent Care Clinic",
    type: "Urgent Care",
    distanceKm: 2.3,
    travelMin: 14,
    rating: 0,
    reviews: 0,
    hours: "Sample hours",
    openNow: true,
    address: "City Centre",
    phone: "",
    lat: 53.3555,
    lng: -6.2478,
    badges: [],
    updatedAgo: "",
    schedule: alwaysOpen,
    sample: true,
  },
  {
    id: "sample-hospital-1",
    name: "Sample Hospital — Emergency Department",
    type: "Hospital",
    distanceKm: 3.6,
    travelMin: 19,
    rating: 0,
    reviews: 0,
    hours: "Sample hours",
    openNow: true,
    address: "City Centre",
    phone: "",
    lat: 53.3595,
    lng: -6.2666,
    badges: [],
    updatedAgo: "",
    schedule: alwaysOpen,
    sample: true,
  },
  {
    id: "sample-pharmacy-2",
    name: "Sample Community Pharmacy",
    type: "Pharmacy",
    distanceKm: 0.9,
    travelMin: 8,
    rating: 0,
    reviews: 0,
    hours: "Sample hours",
    openNow: true,
    address: "City Centre",
    phone: "",
    lat: 53.3568,
    lng: -6.2643,
    badges: [],
    updatedAgo: "",
    schedule: daily(9, 19),
    sample: true,
  },
];

export const recentAssessments = [
  {
    id: "a1",
    title: "Sore throat & mild fever",
    date: "2 days ago",
    urgency: "Low" as const,
    action: "Self-care",
  },
  {
    id: "a2",
    title: "Persistent headache",
    date: "Last week",
    urgency: "Medium" as const,
    action: "See GP",
  },
];

export const symptoms = [
  "Headache", "Fever", "Cough", "Sore throat", "Chest pain",
  "Abdominal pain", "Nausea", "Dizziness", "Fatigue", "Back pain",
  "Shortness of breath", "Rash",
];

export const bodyAreas = [
  "Head", "Chest", "Abdomen", "Back", "Arms", "Legs", "Skin", "Throat", "General",
];

export const durations = ["<24h", "1-3 days", "4-7 days", "1-2 weeks", ">2 weeks"];

export const additionalSymptoms = [
  "Fever", "Chills", "Nausea", "Vomiting", "Dizziness", "Fatigue",
  "Loss of appetite", "Night sweats", "Rash",
];
