export type Auto = {
    // ... existující vlastnosti ...
    poznamka?: string;
    pripnuto?: boolean;
    gpsZaznamy?: any[]; // You might want to replace 'any' with a more specific type
  };