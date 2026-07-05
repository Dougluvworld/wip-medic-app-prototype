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
};

export const providers: Provider[] = [
  {
    id: "boots-pharmacy",
    name: "Boots Pharmacy — High Street",
    type: "Pharmacy",
    distanceKm: 0.4,
    travelMin: 5,
    rating: 4.6,
    reviews: 328,
    hours: "Open until 22:00",
    openNow: true,
    address: "22 High Street, London, E1 6QL",
    phone: "+44 20 7946 0011",
  },
  {
    id: "riverside-gp",
    name: "Riverside GP Surgery",
    type: "GP",
    distanceKm: 1.1,
    travelMin: 9,
    rating: 4.4,
    reviews: 214,
    hours: "Open until 18:30",
    openNow: true,
    address: "5 Riverside Walk, London, E1 7DP",
    phone: "+44 20 7946 0234",
  },
  {
    id: "citycare-urgent",
    name: "CityCare Urgent Treatment Centre",
    type: "Urgent Care",
    distanceKm: 2.3,
    travelMin: 14,
    rating: 4.7,
    reviews: 891,
    hours: "Open 24 hours",
    openNow: true,
    address: "88 Commercial Rd, London, E1 1LP",
    phone: "+44 20 7946 0555",
  },
  {
    id: "royal-hospital",
    name: "Royal London Hospital A&E",
    type: "Hospital",
    distanceKm: 3.6,
    travelMin: 19,
    rating: 4.2,
    reviews: 1204,
    hours: "Open 24 hours",
    openNow: true,
    address: "Whitechapel Rd, London, E1 1FR",
    phone: "+44 20 7377 7000",
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
    address: "14 Greenlane, London, E2 8AA",
    phone: "+44 20 7946 0776",
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
