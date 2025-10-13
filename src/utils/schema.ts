export interface FieldSchema {
  name: string;
  label: string;
  type: "number" | "text";
  step?: string;
}

export const floodModelSchema: FieldSchema[] = [
  {
    name: "Avg_rainfall",
    label: "Average Rainfall (mm)",
    type: "number",
    step: "any",
  },
  {
    name: "Full_reservoir_level",
    label: "Full Reservoir Level",
    type: "number",
    step: "any",
  },
  {
    name: "Live_capacity_FRL",
    label: "Live Capacity FRL",
    type: "number",
    step: "any",
  },
  { name: "Storage", label: "Storage", type: "number", step: "any" },
  { name: "Level", label: "Level", type: "number", step: "any" },
  {
    name: "Storage_shift",
    label: "Storage Shift",
    type: "number",
    step: "any",
  },
  {
    name: "delta_storage",
    label: "Delta Storage",
    type: "number",
    step: "any",
  },
  {
    name: "predicted_inflow",
    label: "Predicted Inflow",
    type: "number",
    step: "any",
  },
  {
    name: "estimated_outflow",
    label: "Estimated Outflow",
    type: "number",
    step: "any",
  },
];
