import { create } from 'zustand';

export interface Activity {
  id: string;
  date: string;
  duration: number;
  distance: number;
  route: { latitude: number; longitude: number }[];
}

interface ActivityStore {
  activities: Activity[];
  addActivity: (a: Activity) => void;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  activities: [],
  addActivity: (a) =>
    set((state) => ({ activities: [a, ...state.activities] })),
}));