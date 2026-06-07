import type { Coordinate, SmartBinLocation } from "../types";

export const COLOGNE_CENTER: Coordinate = {
  lat: 50.9413,
  lng: 6.9583,
};

export const DEPOT: Coordinate & { label: string } = {
  label: "Waste Collection Depot",
  lat: 50.9515,
  lng: 6.889,
};

export const COLOGNE_BINS_TEMPLATE: Array<Omit<SmartBinLocation, "compartments">> = [
  { bin_id: "CGN-001", label: "Koelner Dom", district: "Innenstadt", lat: 50.9413, lng: 6.9583 },
  { bin_id: "CGN-002", label: "Koeln Hauptbahnhof", district: "Innenstadt", lat: 50.9428, lng: 6.9599 },
  { bin_id: "CGN-003", label: "University of Cologne", district: "Lindenthal", lat: 50.9281, lng: 6.9285 },
  { bin_id: "CGN-004", label: "Rheinauhafen", district: "Altstadt-Sued", lat: 50.9239, lng: 6.9657 },
  { bin_id: "CGN-005", label: "Neumarkt", district: "Innenstadt", lat: 50.9365, lng: 6.9478 },
  { bin_id: "CGN-006", label: "Heumarkt", district: "Innenstadt", lat: 50.9362, lng: 6.9607 },
  { bin_id: "CGN-007", label: "Aachener Weiher", district: "Lindenthal", lat: 50.9307, lng: 6.9228 },
  { bin_id: "CGN-008", label: "Stadtgarten", district: "Neustadt-Nord", lat: 50.9463, lng: 6.9384 },
  { bin_id: "CGN-009", label: "Mediapark", district: "Neustadt-Nord", lat: 50.9485, lng: 6.9441 },
  { bin_id: "CGN-010", label: "Deutzer Freiheit", district: "Deutz", lat: 50.9369, lng: 6.9748 },
  { bin_id: "CGN-011", label: "Lanxess Arena", district: "Deutz", lat: 50.9384, lng: 6.9829 },
  { bin_id: "CGN-012", label: "Chlodwigplatz", district: "Suedstadt", lat: 50.9217, lng: 6.9595 },
  { bin_id: "CGN-013", label: "Zuelpicher Strasse", district: "Innenstadt", lat: 50.9306, lng: 6.9366 },
  { bin_id: "CGN-014", label: "Volksgarten", district: "Suedstadt", lat: 50.9214, lng: 6.9449 },
  { bin_id: "CGN-015", label: "Ehrenfeld", district: "Ehrenfeld", lat: 50.9515, lng: 6.9166 },
  { bin_id: "CGN-016", label: "Nippes", district: "Nippes", lat: 50.9652, lng: 6.9531 },
  { bin_id: "CGN-017", label: "Muelheim Wiener Platz", district: "Muelheim", lat: 50.9618, lng: 7.0044 },
  { bin_id: "CGN-018", label: "Poller Wiesen", district: "Poll", lat: 50.9189, lng: 6.9827 },
  { bin_id: "CGN-019", label: "Rheinpark", district: "Deutz", lat: 50.9468, lng: 6.9738 },
  { bin_id: "CGN-020", label: "Suedstadt", district: "Suedstadt", lat: 50.9179, lng: 6.9609 },
];
