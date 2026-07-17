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
  rating: number;
  reviews: number;
  hours: string;
  openNow: boolean;
  address: string;
  phone: string;
  lat?: number;
  lng?: number;
  badges?: string[];
  reviewList?: Review[];
  ratingBreakdown?: RatingBreakdown;
  updatedAgo?: string;
};

const defaultBreakdown: RatingBreakdown = { 5: 68, 4: 22, 3: 7, 2: 2, 1: 1 };

const sampleReviews = (seed: string): Review[] => [
  {
    id: `${seed}-r1`,
    author: "Aoife M.",
    rating: 5,
    date: "3 days ago",
    quote: "Seen quickly and the pharmacist took real time to explain everything. Felt looked after.",
    verified: true,
  },
  {
    id: `${seed}-r2`,
    author: "Cian O.",
    rating: 4,
    date: "2 weeks ago",
    quote: "Friendly staff, clean space. Small wait at peak hours but worth it.",
    verified: true,
  },
  {
    id: `${seed}-r3`,
    author: "Niamh K.",
    rating: 3,
    date: "1 month ago",
    quote: "Care was fine, reception could be warmer. Would still return if I needed to.",
    verified: false,
  },
];

export const providers: Provider[] = [
  {
    id: "boots-pharmacy",
    name: "Boots Pharmacy — O'Connell Street",
    type: "Pharmacy",
    distanceKm: 0.4,
    travelMin: 5,
    rating: 4.6,
    reviews: 328,
    hours: "Open until 22:00",
    openNow: true,
    address: "40 Lower O'Connell Street, Dublin 1, D01 X2P3",
    phone: "+353 1 873 0427",
    lat: 53.3494,
    lng: -6.2603,
    badges: ["HSE-registered", "Accepts walk-ins", "Wheelchair accessible"],
    reviewList: sampleReviews("boots"),
    ratingBreakdown: { 5: 74, 4: 18, 3: 5, 2: 2, 1: 1 },
    updatedAgo: "Updated 2 days ago",
  },
  {
    id: "riverside-gp",
    name: "Liffey GP Surgery",
    type: "GP",
    distanceKm: 1.1,
    travelMin: 9,
    rating: 4.4,
    reviews: 214,
    hours: "Open until 18:30",
    openNow: true,
    address: "5 Bachelors Walk, Dublin 1, D01 K2C8",
    phone: "+353 1 872 1234",
    lat: 53.3467,
    lng: -6.2617,
    badges: ["HSE-registered", "Same-day triage", "Online booking"],
    reviewList: sampleReviews("liffey"),
    ratingBreakdown: defaultBreakdown,
    updatedAgo: "Updated 5 days ago",
  },
  {
    id: "citycare-urgent",
    name: "CityCare Urgent Care Clinic",
    type: "Urgent Care",
    distanceKm: 2.3,
    travelMin: 14,
    rating: 4.7,
    reviews: 891,
    hours: "Open 24 hours",
    openNow: true,
    address: "88 Amiens Street, Dublin 1, D01 R6P7",
    phone: "+353 1 872 5555",
    lat: 53.3555,
    lng: -6.2478,
    badges: ["24/7 walk-in", "X-ray on site", "Wheelchair accessible"],
    reviewList: sampleReviews("citycare"),
    ratingBreakdown: { 5: 80, 4: 14, 3: 4, 2: 1, 1: 1 },
    updatedAgo: "Updated yesterday",
  },
  {
    id: "royal-hospital",
    name: "Mater Misericordiae University Hospital",
    type: "Hospital",
    distanceKm: 3.6,
    travelMin: 19,
    rating: 4.2,
    reviews: 1204,
    hours: "Open 24 hours",
    openNow: true,
    address: "Eccles Street, Dublin 7, D07 R2WY",
    phone: "+353 1 803 2000",
    lat: 53.3595,
    lng: -6.2666,
    badges: ["Emergency Department", "24/7", "Public hospital"],
    reviewList: sampleReviews("mater"),
    ratingBreakdown: { 5: 55, 4: 25, 3: 12, 2: 5, 1: 3 },
    updatedAgo: "Updated 1 week ago",
  },
  {
    id: "greenlane-pharmacy",
    name: "Greenlane Community Pharmacy",
    type: "Pharmacy",
    distanceKm: 0.9,
    travelMin: 8,
    rating: 4.5,
    reviews: 142,
    hours: "Closes at 19:00",
    openNow: true,
    address: "14 Dorset Street, Dublin 1, D01 F7Y2",
    phone: "+353 1 872 0776",
    lat: 53.3568,
    lng: -6.2643,
    badges: ["HSE-registered", "Minor ailments scheme"],
    reviewList: sampleReviews("greenlane"),
    ratingBreakdown: defaultBreakdown,
    updatedAgo: "Updated 3 days ago",
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
